const bcrypt = require('bcryptjs');
const { normalizarQuantidadeBebes } = require('../lib/quantidadeBebes');
const jwt = require('jsonwebtoken');

const EXAMES_PADRAO = [
  'Hemograma completo',
  'Tipagem sanguínea e Fator Rh',
  'Glicemia de jejum',
  'Toxoplasmose (IgG e IgM)',
  'Rubéola (IgG e IgM)',
  'VDRL (sífilis)',
  'HIV',
  'Hepatite B (HBsAg)',
  'Hepatite C',
  'Urina EAS',
  'Urocultura',
  'Teste de tolerância à glicose (TOTG 75g)',
  'Ultrassom morfológico 1º trimestre',
  'Ultrassom morfológico 2º trimestre',
  'Vacina da gripe',
  'Vacina dTpa (coqueluche)',
  'Estreptococo grupo B (35-37 semanas)',
];

const VERSAO_TERMOS_ATUAL = '1.1';

async function cadastrar(req, res) {
  const { nome, nomeSocial, identidadeGenero, email, senha, telefone, cpf, dataNascimento, tipoSanguineo, semanaInicial, quantidadeBebes, ultimaMenstruacao, medico, alergias, medicamentos, doencas, aceitouLgpd } = req.body;

  if (!nome || !email || !senha || semanaInicial === undefined) {
    return res.status(400).json({ erro: 'nome, email, senha e semanaInicial são obrigatórios' });
  }

  if (aceitouLgpd !== true) {
    return res.status(400).json({ erro: 'É necessário aceitar os Termos de Uso e a Política de Privacidade para se cadastrar' });
  }

  const bebes = normalizarQuantidadeBebes(quantidadeBebes);
  if (bebes === null) {
    return res.status(400).json({ erro: 'quantidadeBebes deve ser um número entre 1 e 4' });
  }

  const existe = await req.prisma.gestante.findUnique({ where: { email } });
  if (existe) {
    return res.status(409).json({ erro: 'E-mail já cadastrado' });
  }

  const hash = await bcrypt.hash(senha, 12);

  const gestante = await req.prisma.gestante.create({
    data: {
      nome, nomeSocial, identidadeGenero, email, senha: hash, telefone, cpf, dataNascimento, tipoSanguineo,
      semanaInicial: Number(semanaInicial), quantidadeBebes: bebes ?? 1, ultimaMenstruacao, medico, alergias, medicamentos, doencas,
      consentimentoLgpd: true, consentimentoData: new Date(), consentimentoVersao: VERSAO_TERMOS_ATUAL,
    },
  });

  await req.prisma.exame.createMany({
    data: EXAMES_PADRAO.map(nome => ({ gestanteId: gestante.id, nome })),
  });

  const token = jwt.sign({ id: gestante.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  return res.status(201).json({ token, gestante: _semSenha(gestante) });
}

// RNF04: no máximo 30 tentativas de login (sucesso ou falha) por IP a cada 15 minutos.
// Reaproveita a tabela logs_acesso já existente em vez de depender de rate limit em
// memória do processo (que não funciona em Workers, onde cada requisição é isolada).
const LOGIN_LIMITE_TENTATIVAS = 30;
const LOGIN_JANELA_MS = 15 * 60 * 1000;

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'email e senha são obrigatórios' });
  }

  const ip = req.ip;

  if (ip) {
    const desde = new Date(Date.now() - LOGIN_JANELA_MS);
    const tentativas = await req.prisma.logAcesso.count({
      where: { ip, criadoEm: { gte: desde } },
    });
    if (tentativas >= LOGIN_LIMITE_TENTATIVAS) {
      return res.status(429).json({ erro: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
    }
  }

  const gestante = await req.prisma.gestante.findUnique({ where: { email } });

  if (!gestante || !gestante.ativo) {
    await req.prisma.logAcesso.create({ data: { email, sucesso: false, ip } });
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaOk = await bcrypt.compare(senha, gestante.senha);
  if (!senhaOk) {
    await req.prisma.logAcesso.create({ data: { email, sucesso: false, ip } });
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  await req.prisma.logAcesso.create({ data: { email, sucesso: true, ip } });

  const token = jwt.sign({ id: gestante.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  return res.json({ token, gestante: _semSenha(gestante) });
}

const crypto = require('crypto');

// Código de 6 dígitos, válido por 15 minutos.
const RESET_CODIGO_TTL_MS = 15 * 60 * 1000;

async function esqueciSenha(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ erro: 'email é obrigatório' });
  }

  const gestante = await req.prisma.gestante.findUnique({ where: { email } });

  // Resposta genérica sempre - não revela se o e-mail existe ou não na base.
  const resposta = { mensagem: 'Se este e-mail estiver cadastrado, enviamos um código de verificação.' };

  if (!gestante || !gestante.ativo) {
    return res.json(resposta);
  }

  const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const resetSenhaHash = await bcrypt.hash(codigo, 10);
  const resetSenhaExpira = new Date(Date.now() + RESET_CODIGO_TTL_MS);

  await req.prisma.gestante.update({
    where: { id: gestante.id },
    data: { resetSenhaHash, resetSenhaExpira },
  });

  // TODO: integrar com um provedor de e-mail (ex.: Resend, SendGrid, SMTP) para
  // enviar o código de fato. Por enquanto, em desenvolvimento, ele só é logado
  // aqui no servidor para permitir testar o fluxo de ponta a ponta.
  console.log(`[reset-senha] Código para ${email}: ${codigo} (expira em 15min)`);

  return res.json(resposta);
}

async function redefinirSenha(req, res) {
  const { email, codigo, novaSenha } = req.body;

  if (!email || !codigo || !novaSenha) {
    return res.status(400).json({ erro: 'email, codigo e novaSenha são obrigatórios' });
  }
  if (novaSenha.length < 6) {
    return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 6 caracteres' });
  }

  const gestante = await req.prisma.gestante.findUnique({ where: { email } });

  if (!gestante || !gestante.resetSenhaHash || !gestante.resetSenhaExpira) {
    return res.status(400).json({ erro: 'Código inválido ou expirado' });
  }
  if (gestante.resetSenhaExpira < new Date()) {
    return res.status(400).json({ erro: 'Código inválido ou expirado' });
  }

  const codigoOk = await bcrypt.compare(codigo, gestante.resetSenhaHash);
  if (!codigoOk) {
    return res.status(400).json({ erro: 'Código inválido ou expirado' });
  }

  const hash = await bcrypt.hash(novaSenha, 12);
  await req.prisma.gestante.update({
    where: { id: gestante.id },
    data: { senha: hash, resetSenhaHash: null, resetSenhaExpira: null },
  });

  return res.json({ mensagem: 'Senha redefinida com sucesso.' });
}

function _semSenha(g) {
  const { senha, ...resto } = g;
  return resto;
}

module.exports = { cadastrar, login, esqueciSenha, redefinirSenha };
