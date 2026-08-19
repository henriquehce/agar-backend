const prisma = require('../lib/prisma');

async function listar(req, res) {
  const sinais = await prisma.sinalAlerta.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
  });
  return res.json(sinais);
}

module.exports = { listar };
