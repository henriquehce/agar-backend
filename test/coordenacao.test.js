// Regras da coordenação (RF23): ninguém altera o próprio acesso nem o de outro coordenador,
// e "recusar" só vale para pedido que nunca foi liberado.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarAlteracao } = require('../src/controllers/profissional.controller');

const pedido = { id: 2, ativo: false, coordenador: false, aprovadoEm: null };

test('coordenação pode liberar, bloquear e recusar um pedido novo', () => {
  assert.equal(validarAlteracao(1, pedido, 'alterar'), null);
  assert.equal(validarAlteracao(1, pedido, 'recusar'), null);
});

test('não altera o próprio acesso nem o de outro coordenador', () => {
  assert.equal(validarAlteracao(2, pedido, 'alterar').status, 400);
  assert.equal(validarAlteracao(1, { ...pedido, coordenador: true }, 'alterar').status, 400);
});

test('quem já foi liberado não pode ser recusado, só bloqueado', () => {
  assert.equal(validarAlteracao(1, { ...pedido, ativo: true, aprovadoEm: new Date() }, 'recusar').status, 400);
  assert.equal(validarAlteracao(1, { ...pedido, ativo: false, aprovadoEm: new Date() }, 'recusar').status, 400);
  assert.equal(validarAlteracao(1, { ...pedido, ativo: true, aprovadoEm: new Date() }, 'alterar'), null);
});

test('profissional inexistente dá 404', () => {
  assert.equal(validarAlteracao(1, null, 'alterar').status, 404);
});
