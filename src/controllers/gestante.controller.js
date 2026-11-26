const bcrypt = require('bcryptjs');
const { gerarCodigo, hashCodigo, VALIDADE_MS } = require('../lib/vinculo');
const { normalizarQuantidadeBebes } = require('../lib/quantidadeBebes');

const PERFIL_SELECT = {
  id: true, nome: true, nomeSocial: true, identidadeGenero: true, email: true, telefone: true, cpf: true,
  dataNascimento: true, tipoSanguineo: true, semanaInicial: true, quantidadeBebes: true,
  ultimaMenstruacao: true, medico: true, alergias: true,
  medicamentos: true, doencas: true, fotoUrl: true,
  dataCadastro: true, criadoEm: true, atualizadoEm: true,
  consentimentoLgpd: true, consentimentoData: true, consentimentoVersao: true,
  consentimentoPesquisa: true, consentimentoNotificacoes: true,
};

async function getPerfil(req, res) {
  const gestante = await req.prisma.gestante.findUnique({
    where: { id: req.gestanteId },
    select: PERFIL_SELECT,
  });

  if (!gestante) return res.status(404).json({ erro: 'Gestante não encontrada' });
  return res.json(gestante);
}

async function updatePerfil(req, res) {
  const { nome, nomeSocial, identidadeGenero, telefone, cpf, dataNascimento, tipoSanguineo, semanaInicial, quantidadeBebes, ultimaMenstruacao, medico, alergias, medicamentos, doencas, fotoUrl, consentimentoPesquisa, consentimentoNotificacoes } = req.body;

  const bebes = normalizarQuantidadeBebes(quantidadeBebes);
  if (bebes === null) return res.status(400).json({ erro: 'quantidadeBebes deve ser um número entre 1 e 4' });

  const gestante = await req.prisma.gestante.update({
    where: { id: req.gestanteId },
    data: {
      ...(nome !== undefined && { nome }),
      ...(nomeSocial !== undefined && { nomeSocial }),
      ...(identidadeGenero !== undefined && { identidadeGenero }),
      ...(telefone !== undefined && { telefone }),
      ...(cpf !== undefined && { cpf }),
      ...(dataNascimento !== undefined && { dataNascimento }),
      ...(tipoSanguineo !== undefined && { tipoSanguineo }),
      ...(semanaInicial !== undefined && { semanaInicial: Number(semanaInicial) }),
      ...(bebes !== undefined && { quantidadeBebes: bebes }),
      ...(ultimaMenstruacao !== undefined && { ultimaMenstruacao }),
      ...(medico !== undefined && { medico }),
      ...(alergias !== undefined && { alergias }),
      ...(medicamentos !== undefined && { medicamentos }),
      ...(doencas !== undefined && { doencas }),
      ...(fotoUrl !== undefined && { fotoUrl }),
      ...(consentimentoPesquisa !== undefined && { consentimentoPesquisa: Boolean(consentimentoPesquisa) }),
      ...(consentimentoNotificacoes !== undefined && { consentimentoNotificacoes: Boolean(consentimentoNotificacoes) }),
    },
    select: PERFIL_SELECT,
  });

  return res.json(gestante);
}

async function updateSenha(req, res) {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ erro: 'senhaAtual e novaSenha são obrigatórios' });
  }

  const gestante = await req.prisma.gestante.findUnique({ where: { id: req.gestanteId } });
  const ok = await bcrypt.compare(senhaAtual, gestante.senha);
  if (!ok) return res.status(401).json({ erro: 'Senha atual incorreta' });

  const hash = await bcrypt.hash(novaSenha, 12);
  await req.prisma.gestante.update({ where: { id: req.gestanteId }, data: { senha: hash } });

  return res.json({ mensagem: 'Senha atualizada com sucesso' });
}

// LGPD - portabilidade: exporta todos os dados pessoais e registros de saúde da gestante.
async function exportarDados(req, res) {
  const gestante = await req.prisma.gestante.findUnique({
    where: { id: req.gestanteId },
    select: PERFIL_SELECT,
  });
  if (!gestante) return res.status(404).json({ erro: 'Gestante não encontrada' });

  const [consultas, monitoramentos, exames, registrosMensais, anotacoes, movimentosFetais, profissionais, acessosProfissionais] = await Promise.all([
    req.prisma.consulta.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.monitoramento.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.exame.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.registroMensal.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.anotacao.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.movimentoFetal.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.vinculoProfissional.findMany({ where: { gestanteId: req.gestanteId }, include: { profissional: { select: { nome: true, registro: true, funcao: true } } } }),
    req.prisma.acessoProfissional.findMany({ where: { gestanteId: req.gestanteId }, include: { profissional: { select: { nome: true, registro: true } } } }),
  ]);

  return res.json({
    geradoEm: new Date(),
    dadosPessoais: gestante,
    consultas,
    monitoramentos,
    exames,
    registrosMensais,
    anotacoes,
    movimentosFetais,
    profissionaisAutorizados: profissionais,
    acessosDeProfissionais: acessosProfissionais,
  });
}

// LGPD - direito ao esquecimento: exclui definitivamente a conta e todos os dados vinculados.
async function excluirConta(req, res) {
  const { senha } = req.body;
  if (!senha) {
    return res.status(400).json({ erro: 'Informe sua senha para confirmar a exclusão' });
  }

  const gestante = await req.prisma.gestante.findUnique({ where: { id: req.gestanteId } });
  const ok = await bcrypt.compare(senha, gestante.senha);
  if (!ok) return res.status(401).json({ erro: 'Senha incorreta' });

  await req.prisma.gestante.delete({ where: { id: req.gestanteId } });

  return res.json({ mensagem: 'Conta e todos os dados associados foram excluídos permanentemente' });
}

// RN11: a gestante gera um código de uso único para autorizar um profissional do AGAR.
// Um novo código substitui o anterior.
async function gerarCodigoVinculo(req, res) {
  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + VALIDADE_MS);
  await req.prisma.gestante.update({
    where: { id: req.gestanteId },
    data: { codigoVinculoHash: hashCodigo(codigo), codigoVinculoExpira: expiraEm },
  });
  return res.status(201).json({ codigo, expiraEm });
}

// Profissionais com acesso ativo, com o último acesso de cada um.
async function listarProfissionais(req, res) {
  const vinculos = await req.prisma.vinculoProfissional.findMany({
    where: { gestanteId: req.gestanteId, revogadoEm: null },
    include: { profissional: { select: { id: true, nome: true, registro: true, funcao: true } } },
    orderBy: { criadoEm: 'desc' },
  });
  const lista = await Promise.all(vinculos.map(async (v) => {
    const ultimo = await req.prisma.acessoProfissional.findFirst({
      where: { gestanteId: req.gestanteId, profissionalId: v.profissionalId },
      orderBy: { criadoEm: 'desc' },
    });
    return { ...v.profissional, autorizadoEm: v.criadoEm, ultimoAcesso: ultimo?.criadoEm || null };
  }));
  return res.json(lista);
}

async function revogarProfissional(req, res) {
  const profissionalId = Number(req.params.id);
  if (!Number.isInteger(profissionalId) || profissionalId <= 0) return res.status(404).json({ erro: 'Profissional não encontrado' });
  const vinculo = await req.prisma.vinculoProfissional.findFirst({ where: { gestanteId: req.gestanteId, profissionalId, revogadoEm: null } });
  if (!vinculo) return res.status(404).json({ erro: 'Profissional não encontrado' });
  await req.prisma.vinculoProfissional.update({ where: { id: vinculo.id }, data: { revogadoEm: new Date() } });
  return res.json({ mensagem: 'Acesso removido' });
}

module.exports = { getPerfil, updatePerfil, updateSenha, exportarDados, excluirConta, gerarCodigoVinculo, listarProfissionais, revogarProfissional };
