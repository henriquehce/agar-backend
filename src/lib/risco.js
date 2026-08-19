function classificarPressao(sistolica, diastolica) {
  if (sistolica >= 160 || diastolica >= 110) return 'critico';
  if (sistolica >= 140 || diastolica >= 90) return 'alto';
  if (sistolica <= 90 || diastolica <= 60) return 'atencao';
  return 'normal';
}

function classificarGlicemia(valor, subtipo) {
  if (subtipo === 'Jejum') {
    if (valor >= 126) return 'alto';
    if (valor >= 100) return 'atencao';
    return 'normal';
  }
  if (valor >= 180) return 'alto';
  if (valor >= 140) return 'atencao';
  return 'normal';
}

function calcularNivelRisco({ tipo, valor1, valor2, subtipo }) {
  if (tipo === 'pressao') return classificarPressao(valor1, valor2);
  if (tipo === 'glicemia') return classificarGlicemia(valor1, subtipo);
  return null;
}

module.exports = { calcularNivelRisco, classificarPressao, classificarGlicemia };
