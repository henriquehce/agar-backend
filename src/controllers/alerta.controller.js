
async function listar(req, res) {
  const sinais = await req.prisma.sinalAlerta.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
  });
  // `sintomas` é salvo como JSON stringificado (SQLite/D1 não tem array nativo);
  // devolve como array de verdade pro app, sem mudar o contrato da API.
  const sinaisComSintomasArray = sinais.map(s => ({
    ...s,
    sintomas: JSON.parse(s.sintomas),
  }));
  return res.json(sinaisComSintomasArray);
}

module.exports = { listar };
