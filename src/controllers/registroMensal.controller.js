const prisma = require('../lib/prisma');

async function listar(req, res) {
  const registros = await prisma.registroMensal.findMany({
    where: { gestanteId: req.gestanteId },
    orderBy: { semana: 'asc' },
  });
  return res.json(registros);
}

async function criar(req, res) {
  const { semana, peso, au, bcf, pressao, obs } = req.body;
  if (!semana) return res.status(400).json({ erro: 'semana é obrigatória' });

  const existe = await prisma.registroMensal.findFirst({
    where: { gestanteId: req.gestanteId, semana: Number(semana) },
  });
  if (existe) return res.status(400).json({ erro: 'Já existe registro para esta semana' });

  const registro = await prisma.registroMensal.create({
    data: { gestanteId: req.gestanteId, semana: Number(semana), peso, au, bcf, pressao, obs },
  });
  return res.status(201).json(registro);
}

async function atualizar(req, res) {
  const id = Number(req.params.id);
  const { peso, au, bcf, pressao, obs } = req.body;

  const existe = await prisma.registroMensal.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Registro não encontrado' });

  const registro = await prisma.registroMensal.update({
    where: { id },
    data: {
      ...(peso !== undefined && { peso }),
      ...(au !== undefined && { au }),
      ...(bcf !== undefined && { bcf }),
      ...(pressao !== undefined && { pressao }),
      ...(obs !== undefined && { obs }),
    },
  });
  return res.json(registro);
}

async function remover(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.registroMensal.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Registro não encontrado' });

  await prisma.registroMensal.delete({ where: { id } });
  return res.json({ mensagem: 'Registro removido' });
}

module.exports = { listar, criar, atualizar, remover };
