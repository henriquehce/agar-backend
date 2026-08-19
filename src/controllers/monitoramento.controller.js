const prisma = require('../lib/prisma');
const { calcularNivelRisco } = require('../lib/risco');

async function listar(req, res) {
  const { tipo } = req.query;
  const monitoramentos = await prisma.monitoramento.findMany({
    where: {
      gestanteId: req.gestanteId,
      ...(tipo && { tipo }),
    },
    orderBy: { criadoEm: 'desc' },
  });
  return res.json(monitoramentos);
}

async function criar(req, res) {
  const { tipo, valor1, valor2, subtipo, obs } = req.body;
  if (!tipo || valor1 === undefined) {
    return res.status(400).json({ erro: 'tipo e valor1 são obrigatórios' });
  }
  if (!['pressao', 'glicemia'].includes(tipo)) {
    return res.status(400).json({ erro: 'tipo deve ser "pressao" ou "glicemia"' });
  }

  const v1 = Number(valor1);
  const v2 = valor2 !== undefined ? Number(valor2) : null;
  const nivelRisco = calcularNivelRisco({ tipo, valor1: v1, valor2: v2, subtipo });

  const registro = await prisma.monitoramento.create({
    data: {
      gestanteId: req.gestanteId,
      tipo,
      valor1: v1,
      valor2: v2,
      subtipo,
      obs,
      nivelRisco,
    },
  });
  return res.status(201).json(registro);
}

async function alertas(req, res) {
  const recentes = await prisma.monitoramento.findMany({
    where: {
      gestanteId: req.gestanteId,
      nivelRisco: { in: ['alto', 'critico'] },
    },
    orderBy: { criadoEm: 'desc' },
    take: 5,
  });
  return res.json(recentes);
}

async function remover(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.monitoramento.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Registro não encontrado' });

  await prisma.monitoramento.delete({ where: { id } });
  return res.json({ mensagem: 'Registro removido' });
}

module.exports = { listar, criar, remover, alertas };