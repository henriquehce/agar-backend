const bcrypt = require('bcryptjs');
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

  const [consultas, monitoramentos, exames, registrosMensais, anotacoes, movimentosFetais] = await Promise.all([
    req.prisma.consulta.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.monitoramento.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.exame.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.registroMensal.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.anotacao.findMany({ where: { gestanteId: req.gestanteId } }),
    req.prisma.movimentoFetal.findMany({ where: { gestanteId: req.gestanteId } }),
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

module.exports = { getPerfil, updatePerfil, updateSenha, exportarDados, excluirConta };
