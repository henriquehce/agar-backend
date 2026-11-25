// Testes do classificador de risco (RN01 e RN02), com os valores exatos de cada limite.
// Rodar com: npm test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classificarPressao, classificarGlicemia, calcularNivelRisco } = require('../src/lib/risco');

test('pressão: limites de cada faixa', () => {
  const casos = [
    [118, 76, 'normal'], [139, 89, 'normal'], [91, 61, 'normal'],
    [90, 70, 'atencao'], [110, 60, 'atencao'],
    [140, 80, 'alto'], [130, 90, 'alto'], [159, 109, 'alto'],
    [160, 100, 'critico'], [150, 110, 'critico'], [200, 130, 'critico'],
  ];
  for (const [s, d, esperado] of casos) assert.equal(classificarPressao(s, d), esperado, `${s}/${d}`);
});

test('pressão alta prevalece sobre pressão baixa no mesmo registro', () => {
  assert.equal(classificarPressao(145, 60), 'alto');
  assert.equal(classificarPressao(165, 55), 'critico');
});

test('glicemia em jejum: limites da gestação', () => {
  const casos = [[70, 'normal'], [94, 'normal'], [95, 'atencao'], [125, 'atencao'], [126, 'alto'], [69, 'atencao']];
  for (const [v, esperado] of casos) assert.equal(classificarGlicemia(v, 'Jejum'), esperado, `jejum ${v}`);
});

test('glicemia 1 hora após a refeição e em outro horário', () => {
  for (const subtipo of ['Pós-prandial', 'Aleatória']) {
    const casos = [[70, 'normal'], [139, 'normal'], [140, 'atencao'], [179, 'atencao'], [180, 'alto'], [60, 'atencao']];
    for (const [v, esperado] of casos) assert.equal(classificarGlicemia(v, subtipo), esperado, `${subtipo} ${v}`);
  }
});

test('calcularNivelRisco despacha por tipo', () => {
  assert.equal(calcularNivelRisco({ tipo: 'pressao', valor1: 165, valor2: 112 }), 'critico');
  assert.equal(calcularNivelRisco({ tipo: 'glicemia', valor1: 96, subtipo: 'Jejum' }), 'atencao');
  assert.equal(calcularNivelRisco({ tipo: 'outro', valor1: 1 }), null);
});
