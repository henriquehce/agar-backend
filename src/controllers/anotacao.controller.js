
async function listar(req, res) {
  const anotacoes = await req.prisma.anotacao.findMany({
    where: { gestanteId: req.gestanteId },
    orderBy: { criadoEm: 'desc' },
  });
  return res.json(anotacoes);
}

async function criar(req, res) {
  const { texto, humor } = req.body;
  if (!texto || !texto.trim()) return res.status(400).json({ erro: 'texto é obrigatório' });

  const humorNumero = humor != null ? Number(humor) : null;
  if (humorNumero != null && (!Number.isInteger(humorNumero) || humorNumero < 1 || humorNumero > 6)) {
    return res.status(400).json({ erro: 'humor deve ser um número entre 1 e 6' });
  }

  const anotacao = await req.prisma.anotacao.create({
    data: { gestanteId: req.gestanteId, texto: texto.trim(), humor: humorNumero },
  });
  return res.status(201).json(anotacao);
}

async function remover(req, res) {
  const id = Number(req.params.id);
  const existe = await req.prisma.anotacao.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Anotação não encontrada' });

  await req.prisma.anotacao.delete({ where: { id } });
  return res.json({ mensagem: 'Anotação removida' });
}

module.exports = { listar, criar, remover };
