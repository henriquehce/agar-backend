// Segurança do módulo do profissional (RN11): separação dos tokens e código de vínculo.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { autenticar, autenticarProfissional } = require('../src/middleware/auth.middleware');
const { gerarCodigo, normalizarCodigo, hashCodigo, ALFABETO, TAMANHO } = require('../src/lib/vinculo');

process.env.JWT_SECRET = 'segredo-de-teste';

function chamar(middleware, token) {
  const req = { headers: token ? { authorization: 'Bearer ' + token } : {} };
  let status = 200; let passou = false;
  const res = { status(c) { status = c; return res; }, json() { return res; } };
  middleware(req, res, () => { passou = true; });
  return { passou, status, req };
}

test('token de profissional é recusado nas rotas da gestante', () => {
  const token = jwt.sign({ id: 5, tipo: 'profissional' }, process.env.JWT_SECRET);
  const r = chamar(autenticar, token);
  assert.equal(r.passou, false);
  assert.equal(r.status, 401);
  assert.equal(r.req.gestanteId, undefined);
});

test('token de gestante é recusado nas rotas do profissional', () => {
  const token = jwt.sign({ id: 5 }, process.env.JWT_SECRET);
  const r = chamar(autenticarProfissional, token);
  assert.equal(r.passou, false);
  assert.equal(r.status, 401);
});

test('cada tipo de token passa no próprio middleware', () => {
  const g = chamar(autenticar, jwt.sign({ id: 7 }, process.env.JWT_SECRET));
  assert.equal(g.passou, true); assert.equal(g.req.gestanteId, 7);
  const p = chamar(autenticarProfissional, jwt.sign({ id: 3, tipo: 'profissional' }, process.env.JWT_SECRET));
  assert.equal(p.passou, true); assert.equal(p.req.profissionalId, 3);
});

test('token sem assinatura válida é recusado', () => {
  const falso = jwt.sign({ id: 1, tipo: 'profissional' }, 'outro-segredo');
  assert.equal(chamar(autenticarProfissional, falso).passou, false);
  assert.equal(chamar(autenticar, undefined).status, 401);
});

test('código de vínculo: 6 caracteres sem letras e números ambíguos', () => {
  for (let i = 0; i < 200; i++) {
    const c = gerarCodigo();
    assert.equal(c.length, TAMANHO);
    for (const ch of c) assert.ok(ALFABETO.includes(ch), c);
    assert.ok(!/[01OIL]/.test(c), c);
  }
});

test('código digitado com espaço, hífen ou minúscula leva ao mesmo hash', () => {
  assert.equal(normalizarCodigo(' ab-3 k9z '), 'AB3K9Z');
  assert.equal(hashCodigo('ab3-k9z'), hashCodigo('AB3K9Z'));
  assert.notEqual(hashCodigo('AB3K9Z'), 'AB3K9Z');
  assert.equal(hashCodigo('AB3K9Z').length, 64);
});
