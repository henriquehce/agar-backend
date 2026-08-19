const prisma = require('../lib/prisma');

function comAlerta(registro) {
  return { ...registro, baixaContagem: registro.quantidade < 10 };
}

async function listar(req, res) {
  const movimentos = await prisma.movimentoFetal.findMany({
    where: { gestanteId: req.gestanteId },
    orderBy: { criadoEm: 'desc' },
  });
  return res.json(movimentos.map(comAlerta));
}

async function criar(req, res) {
  const { quantidade, duracaoSegundos } = req.body;
  if (quantidade === undefined || duracaoSegundos === undefined) {
    return res.status(400).json({ erro: 'quantidade e duracaoSegundos são obrigatórios' });
  }

  const movimento = await prisma.movimentoFetal.create({
    data: {
      gestanteId: req.gestanteId,
      quantidade: Number(quantidade),
      duracaoSegundos: Number(duracaoSegundos),
    },
  });
  return res.status(201).json(comAlerta(movimento));
}

async function remover(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.movimentoFetal.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Registro não encontrado' });

  await prisma.movimentoFetal.delete({ where: { id } });
  return res.json({ mensagem: 'Registro removido' });
}

module.exports = { listar, criar, remover };
