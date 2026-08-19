const prisma = require('../lib/prisma');
const { parseDataBr, diasAteHoje, statusConsulta } = require('../lib/datas');

async function listar(req, res) {
  const consultas = await prisma.consulta.findMany({
    where: { gestanteId: req.gestanteId },
  });

  const comOrdenacao = consultas
    .map(c => ({
      ...c,
      diasRestantes: diasAteHoje(c.data),
      status: statusConsulta(c),
    }))
    .sort((a, b) => parseDataBr(a.data, a.hora) - parseDataBr(b.data, b.hora));

  return res.json(comOrdenacao);
}

async function criar(req, res) {
  const { tipo, data, hora, local, medico, obs } = req.body;
  if (!tipo || !data || !hora || !local) {
    return res.status(400).json({ erro: 'tipo, data, hora e local são obrigatórios' });
  }

  const consulta = await prisma.consulta.create({
    data: { gestanteId: req.gestanteId, tipo, data, hora, local, medico, obs },
  });
  return res.status(201).json(consulta);
}

async function atualizar(req, res) {
  const id = Number(req.params.id);
  const { tipo, data, hora, local, medico, obs, realizada } = req.body;

  const existe = await prisma.consulta.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Consulta não encontrada' });

  const consulta = await prisma.consulta.update({
    where: { id },
    data: {
      ...(tipo !== undefined && { tipo }),
      ...(data !== undefined && { data }),
      ...(hora !== undefined && { hora }),
      ...(local !== undefined && { local }),
      ...(medico !== undefined && { medico }),
      ...(obs !== undefined && { obs }),
      ...(realizada !== undefined && { realizada: Boolean(realizada) }),
    },
  });
  return res.json(consulta);
}

async function remover(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.consulta.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Consulta não encontrada' });

  await prisma.consulta.delete({ where: { id } });
  return res.json({ mensagem: 'Consulta removida' });
}

module.exports = { listar, criar, atualizar, remover };