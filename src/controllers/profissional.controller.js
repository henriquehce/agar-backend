const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { hashCodigo, normalizarCodigo, TAMANHO } = require('../lib/vinculo');
const { parseDataBr } = require('../lib/datas');

// Mesmo limite do login da gestante (RNF04), contado na tabela logs_acesso.
const LIMITE_TENTATIVAS = 30;
const JANELA_MS = 15 * 60 * 1000;
// Tentativas de código de vínculo erradas por profissional, para impedir adivinhação.
const LIMITE_CODIGO = 10;

const PERFIL = { id: true, nome: true, email: true, registro: true, funcao: true, ativo: true, coordenador: true, criadoEm: true };

// Dados da gestante que o profissional vê. Ficam de fora CPF, e-mail, senha e o
// diário de anotações, que é pessoal (necessidade, art. 6º, III, da LGPD).
const GESTANTE_RELATORIO = {
  id: true, nome: true, nomeSocial: true, telefone: true, dataNascimento: true, tipoSanguineo: true,
  semanaInicial: true, ultimaMenstruacao: true, quantidadeBebes: true, medico: true,
  alergias: true, medicamentos: true, doencas: true, criadoEm: true,
};

const LIMITE_CADASTROS = 5;
const TAMANHO_MAXIMO = { nome: 120, email: 120, senha: 128, registro: 40, funcao: 40 };

async function cadastrar(req, res) {
  const { nome, email, senha, registro, funcao } = req.body;
  if (!nome || !email || !senha || !registro || !funcao) {
    return res.status(400).json({ erro: 'nome, email, senha, registro e funcao são obrigatórios' });
  }
  for (const [campo, max] of Object.entries(TAMANHO_MAXIMO)) {
    if (String(req.body[campo]).length > max) return res.status(400).json({ erro: `O campo ${campo} aceita até ${max} caracteres` });
  }
  // Cadastro é público: limita pedidos por IP para não encher a fila da coordenação.
  if (req.ip) {
    const recentes = await req.prisma.logAcesso.count({ where: { ip: req.ip, email: { startsWith: 'cadastro-profissional:' }, criadoEm: { gte: new Date(Date.now() - JANELA_MS) } } });
    if (recentes >= LIMITE_CADASTROS) return res.status(429).json({ erro: 'Muitos pedidos. Aguarde alguns minutos e tente novamente.' });
  }
  if (String(senha).length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres' });
  }
  const emailNorm = String(email).trim().toLowerCase();
  const existe = await req.prisma.profissional.findUnique({ where: { email: emailNorm } });
  if (existe) return res.status(409).json({ erro: 'E-mail já cadastrado' });

  await req.prisma.logAcesso.create({ data: { email: 'cadastro-profissional:' + emailNorm, sucesso: true, ip: req.ip } });
  try {
    await req.prisma.profissional.create({
      data: { nome: String(nome).trim(), email: emailNorm, senha: await bcrypt.hash(senha, 12), registro: String(registro).trim(), funcao: String(funcao).trim() },
    });
  } catch (e) {
    // Dois pedidos simultâneos com o mesmo e-mail: o segundo bate no índice único.
    if (e?.code === 'P2002') return res.status(409).json({ erro: 'E-mail já cadastrado' });
    throw e;
  }
  return res.status(201).json({ mensagem: 'Cadastro recebido. A coordenação do AGAR vai conferir seu registro profissional e liberar o acesso.' });
}

async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'email e senha são obrigatórios' });
  const emailNorm = String(email).trim().toLowerCase();
  const ip = req.ip;

  if (ip) {
    const tentativas = await req.prisma.logAcesso.count({ where: { ip, email: { startsWith: 'profissional:' }, criadoEm: { gte: new Date(Date.now() - JANELA_MS) } } });
    if (tentativas >= LIMITE_TENTATIVAS) {
      return res.status(429).json({ erro: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
    }
  }

  const prof = await req.prisma.profissional.findUnique({ where: { email: emailNorm } });
  const ok = prof && await bcrypt.compare(senha, prof.senha);
  await req.prisma.logAcesso.create({ data: { email: 'profissional:' + emailNorm, sucesso: Boolean(ok), ip } });
  if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });
  if (!prof.ativo) {
    return prof.aprovadoEm
      ? res.status(403).json({ erro: 'Seu acesso foi bloqueado pela coordenação do AGAR. Procure a coordenação para mais informações.', codigo: 'ACESSO_BLOQUEADO' })
      : res.status(403).json({ erro: 'Seu cadastro ainda está aguardando a liberação da coordenação do AGAR.', codigo: 'AGUARDANDO_APROVACAO' });
  }

  // O tipo no token impede que ele seja aceito nas rotas da gestante.
  const token = jwt.sign({ id: prof.id, tipo: 'profissional' }, process.env.JWT_SECRET, { expiresIn: '12h' });
  const { senha: _s, ...perfil } = prof;
  return res.json({ token, profissional: perfil });
}

async function _profissionalAtivo(req, res) {
  const prof = await req.prisma.profissional.findUnique({ where: { id: req.profissionalId }, select: PERFIL });
  if (!prof || !prof.ativo) {
    res.status(401).json({ erro: 'Acesso do profissional desativado', codigo: 'SESSAO_INVALIDA' });
    return null;
  }
  return prof;
}

async function perfil(req, res) {
  const prof = await _profissionalAtivo(req, res);
  if (!prof) return;
  // Para a coordenação, o painel mostra quantos pedidos aguardam liberação.
  const pendentes = prof.coordenador ? await req.prisma.profissional.count({ where: { ativo: false, aprovadoEm: null } }) : 0;
  return res.json({ ...prof, pendentes });
}

// ---- Coordenação do AGAR (RF23) ----
async function _coordenador(req, res) {
  const prof = await _profissionalAtivo(req, res);
  if (!prof) return null;
  if (!prof.coordenador) {
    res.status(403).json({ erro: 'Apenas a coordenação do AGAR pode gerenciar os acessos.' });
    return null;
  }
  return prof;
}

// Regras de alteração de um profissional pela coordenação. Fica separada para ser testada.
function validarAlteracao(coordenadorId, alvo, acao) {
  if (!alvo) return { status: 404, erro: 'Profissional não encontrado' };
  if (alvo.id === coordenadorId) return { status: 400, erro: 'Você não pode alterar o próprio acesso.' };
  if (alvo.coordenador) return { status: 400, erro: 'O acesso de outra pessoa da coordenação só pode ser alterado pelo administrador do sistema.' };
  if (acao === 'recusar' && (alvo.ativo || alvo.aprovadoEm)) return { status: 400, erro: 'Só é possível recusar um pedido que ainda não foi liberado. Para quem já teve acesso, use Bloquear.' };
  return null;
}

async function listarProfissionaisCoordenacao(req, res) {
  if (!(await _coordenador(req, res))) return;
  const lista = await req.prisma.profissional.findMany({
    select: { id: true, nome: true, email: true, registro: true, funcao: true, ativo: true, coordenador: true, criadoEm: true, aprovadoEm: true,
      _count: { select: { vinculos: { where: { revogadoEm: null } } } } },
    orderBy: { criadoEm: 'desc' },
  });
  return res.json(lista.map(({ _count, ...p }) => ({ ...p, gestantesVinculadas: _count.vinculos })));
}

// Libera (ativo: true) ou bloqueia (ativo: false) um profissional. Bloquear não apaga
// os vínculos: se a conta voltar a ser liberada, as gestantes continuam autorizando.
async function alterarAcesso(req, res) {
  const coord = await _coordenador(req, res);
  if (!coord) return;
  const id = Number(req.params.id);
  const alvo = Number.isInteger(id) && id > 0 ? await req.prisma.profissional.findUnique({ where: { id } }) : null;
  const erro = validarAlteracao(coord.id, alvo, 'alterar');
  if (erro) return res.status(erro.status).json({ erro: erro.erro });
  const ativo = req.body.ativo === true;
  await req.prisma.profissional.update({
    where: { id },
    data: ativo ? { ativo: true, aprovadoEm: new Date(), aprovadoPorId: coord.id } : { ativo: false },
  });
  return res.json({ mensagem: ativo ? 'Acesso liberado.' : 'Acesso bloqueado.' });
}

// Recusa um pedido que nunca foi liberado: a conta é excluída.
async function recusarPedido(req, res) {
  const coord = await _coordenador(req, res);
  if (!coord) return;
  const id = Number(req.params.id);
  const alvo = Number.isInteger(id) && id > 0 ? await req.prisma.profissional.findUnique({ where: { id } }) : null;
  const erro = validarAlteracao(coord.id, alvo, 'recusar');
  if (erro) return res.status(erro.status).json({ erro: erro.erro });
  await req.prisma.profissional.delete({ where: { id } });
  return res.json({ mensagem: 'Pedido recusado.' });
}

async function vincular(req, res) {
  if (!(await _profissionalAtivo(req, res))) return;
  const codigo = normalizarCodigo(req.body.codigo);
  if (codigo.length !== TAMANHO) return res.status(400).json({ erro: 'O código tem 6 caracteres. Confira com a gestante.' });

  // A tentativa é registrada antes de conferir o código: assim, várias requisições
  // em paralelo também contam para o limite. Se der certo, o registro é marcado como sucesso.
  const marcador = 'vinculo:' + req.profissionalId;
  const tentativa = await req.prisma.logAcesso.create({ data: { email: marcador, sucesso: false, ip: req.ip } });
  const erros = await req.prisma.logAcesso.count({ where: { email: marcador, sucesso: false, criadoEm: { gte: new Date(Date.now() - JANELA_MS) } } });
  if (erros > LIMITE_CODIGO) {
    return res.status(429).json({ erro: 'Muitos códigos incorretos. Aguarde alguns minutos.' });
  }

  const hash = hashCodigo(codigo);
  const agora = new Date();
  const gestante = await req.prisma.gestante.findFirst({
    where: { codigoVinculoHash: hash, codigoVinculoExpira: { gt: agora }, ativo: true },
    select: { id: true, nome: true, nomeSocial: true },
  });
  // Uso único e atômico: só quem consegue apagar o código cria o vínculo. Duas
  // requisições simultâneas com o mesmo código não geram dois vínculos.
  const baixa = gestante
    ? await req.prisma.gestante.updateMany({
      where: { id: gestante.id, codigoVinculoHash: hash, codigoVinculoExpira: { gt: agora } },
      data: { codigoVinculoHash: null, codigoVinculoExpira: null },
    })
    : { count: 0 };
  if (baixa.count !== 1) {
    return res.status(404).json({ erro: 'Código inválido ou expirado. Peça à gestante para gerar um novo na Carteirinha.' });
  }
  await req.prisma.logAcesso.update({ where: { id: tentativa.id }, data: { sucesso: true } });
  await req.prisma.vinculoProfissional.upsert({
    where: { gestanteId_profissionalId: { gestanteId: gestante.id, profissionalId: req.profissionalId } },
    create: { gestanteId: gestante.id, profissionalId: req.profissionalId },
    update: { revogadoEm: null, criadoEm: new Date() },
  });
  return res.status(201).json({ mensagem: 'Gestante vinculada.', gestante: { id: gestante.id, nome: gestante.nomeSocial || gestante.nome } });
}

function _proximaConsulta(consultas) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return consultas
    .filter((c) => !c.realizada && parseDataBr(c.data) >= hoje)
    .sort((a, b) => parseDataBr(a.data, a.hora) - parseDataBr(b.data, b.hora))[0] || null;
}

// Painel: gestantes que autorizaram este profissional, com a última medição de cada
// tipo. Quem tem pressão ou glicemia alta/crise no último registro aparece primeiro.
async function listarGestantes(req, res) {
  if (!(await _profissionalAtivo(req, res))) return;
  const vinculos = await req.prisma.vinculoProfissional.findMany({
    where: { profissionalId: req.profissionalId, revogadoEm: null, gestante: { ativo: true } },
    include: { gestante: { select: { id: true, nome: true, nomeSocial: true, semanaInicial: true, ultimaMenstruacao: true, criadoEm: true, quantidadeBebes: true } } },
  });

  const lista = await Promise.all(vinculos.map(async (v) => {
    const g = v.gestante;
    const [pressao, glicemia, consultas] = await Promise.all([
      req.prisma.monitoramento.findFirst({ where: { gestanteId: g.id, tipo: 'pressao' }, orderBy: { criadoEm: 'desc' } }),
      req.prisma.monitoramento.findFirst({ where: { gestanteId: g.id, tipo: 'glicemia' }, orderBy: { criadoEm: 'desc' } }),
      req.prisma.consulta.findMany({ where: { gestanteId: g.id, realizada: false } }),
    ]);
    const niveis = [pressao?.nivelRisco, glicemia?.nivelRisco];
    const prioridade = niveis.includes('critico') ? 3 : niveis.includes('alto') ? 2 : niveis.includes('atencao') ? 1 : 0;
    return { ...g, vinculadoEm: v.criadoEm, ultimaPressao: pressao, ultimaGlicemia: glicemia, proximaConsulta: _proximaConsulta(consultas), prioridade };
  }));

  lista.sort((a, b) => b.prioridade - a.prioridade || (a.nomeSocial || a.nome).localeCompare(b.nomeSocial || b.nome));
  return res.json(lista);
}

// Relatório de uma gestante, somente leitura. Exige vínculo ativo e registra o acesso.
async function relatorio(req, res) {
  if (!(await _profissionalAtivo(req, res))) return;
  const gestanteId = Number(req.params.id);
  if (!Number.isInteger(gestanteId) || gestanteId <= 0) return res.status(404).json({ erro: 'Gestante não encontrada ou acesso revogado' });
  const vinculo = await req.prisma.vinculoProfissional.findFirst({
    where: { gestanteId, profissionalId: req.profissionalId, revogadoEm: null, gestante: { ativo: true } },
  });
  // 404 também quando existe a gestante mas não há vínculo: não revela quem está na base.
  if (!vinculo) return res.status(404).json({ erro: 'Gestante não encontrada ou acesso revogado' });

  const [gestante, monitoramentos, consultas, exames, registrosMensais, movimentosFetais] = await Promise.all([
    req.prisma.gestante.findUnique({ where: { id: gestanteId }, select: GESTANTE_RELATORIO }),
    req.prisma.monitoramento.findMany({ where: { gestanteId }, orderBy: { criadoEm: 'desc' }, take: 200 }),
    req.prisma.consulta.findMany({ where: { gestanteId } }),
    req.prisma.exame.findMany({ where: { gestanteId }, select: { id: true, nome: true, realizado: true, dataRealizacao: true } }),
    req.prisma.registroMensal.findMany({ where: { gestanteId }, orderBy: { semana: 'asc' } }),
    req.prisma.movimentoFetal.findMany({ where: { gestanteId }, orderBy: { criadoEm: 'desc' }, take: 30 }),
  ]);
  await req.prisma.acessoProfissional.create({ data: { gestanteId, profissionalId: req.profissionalId } });

  return res.json({ geradoEm: new Date(), gestante, monitoramentos, consultas, exames, registrosMensais, movimentosFetais });
}

module.exports = { cadastrar, login, perfil, vincular, listarGestantes, relatorio, listarProfissionaisCoordenacao, alterarAcesso, recusarPedido, validarAlteracao };
