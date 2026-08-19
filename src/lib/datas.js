function parseDataBr(data, hora) {
  const [dia, mes, ano] = data.split('/').map(Number);
  const [h, m] = (hora || '00:00').split(':').map(Number);
  return new Date(ano, mes - 1, dia, h || 0, m || 0);
}

function diasAteHoje(data) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = parseDataBr(data);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje) / (1000 * 60 * 60 * 24));
}

function statusConsulta(consulta) {
  if (consulta.realizada) return null;
  const dias = diasAteHoje(consulta.data);
  if (dias < 0) return 'atrasada';
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanha';
  if (dias <= 7) return 'proxima';
  return null;
}

module.exports = { parseDataBr, diasAteHoje, statusConsulta };
