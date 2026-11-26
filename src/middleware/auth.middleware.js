const jwt = require('jsonwebtoken');

function lerToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token não fornecido', codigo: 'SESSAO_INVALIDA' });
    return null;
  }
  try {
    return jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado', codigo: 'SESSAO_INVALIDA' });
    return null;
  }
}

// Rotas da gestante. Tokens de profissional são recusados: o id do token de um
// profissional não pode ser lido como id de gestante (os ids são de tabelas diferentes).
function autenticar(req, res, next) {
  const payload = lerToken(req, res);
  if (!payload) return;
  if (payload.tipo === 'profissional') {
    return res.status(401).json({ erro: 'Acesso permitido apenas para gestantes', codigo: 'SESSAO_INVALIDA' });
  }
  req.gestanteId = payload.id;
  next();
}

// Rotas do profissional de saúde: exige o tipo no token.
function autenticarProfissional(req, res, next) {
  const payload = lerToken(req, res);
  if (!payload) return;
  if (payload.tipo !== 'profissional') {
    return res.status(401).json({ erro: 'Acesso permitido apenas para profissionais', codigo: 'SESSAO_INVALIDA' });
  }
  req.profissionalId = payload.id;
  next();
}

module.exports = autenticar;
module.exports.autenticar = autenticar;
module.exports.autenticarProfissional = autenticarProfissional;
