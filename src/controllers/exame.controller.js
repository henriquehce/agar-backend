
async function listar(req, res) {
  const exames = await req.prisma.exame.findMany({
    where: { gestanteId: req.gestanteId },
    orderBy: { criadoEm: 'asc' },
  });
  return res.json(exames);
}

async function criar(req, res) {
  const { nome, realizado, dataRealizacao } = req.body;
  if (!nome) return res.status(400).json({ erro: 'nome é obrigatório' });

  const exame = await req.prisma.exame.create({
    data: {
      gestanteId: req.gestanteId,
      nome,
      realizado: Boolean(realizado),
      dataRealizacao: dataRealizacao || null,
    },
  });
  return res.status(201).json(exame);
}

// Anexo vem como data URL de imagem; o D1 aceita ate 2 MB por linha, entao fica uma folga.
const ANEXO_MAX_CHARS = 1_500_000;

async function atualizar(req, res) {
  const id = Number(req.params.id);
  const { realizado, dataRealizacao, nome, anexoUrl } = req.body;

  if (anexoUrl !== undefined && anexoUrl !== null) {
    if (typeof anexoUrl !== 'string' || !anexoUrl.startsWith('data:image/')) {
      return res.status(400).json({ erro: 'O anexo deve ser uma imagem' });
    }
    if (anexoUrl.length > ANEXO_MAX_CHARS) {
      return res.status(413).json({ erro: 'Imagem muito grande. Tente uma foto com menos resolução.' });
    }
  }

  const existe = await req.prisma.exame.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Exame não encontrado' });

  const exame = await req.prisma.exame.update({
    where: { id },
    data: {
      ...(realizado !== undefined && { realizado: Boolean(realizado) }),
      ...(dataRealizacao !== undefined && { dataRealizacao }),
      ...(nome !== undefined && { nome }),
      ...(anexoUrl !== undefined && { anexoUrl }),
    },
  });
  return res.json(exame);
}

async function remover(req, res) {
  const id = Number(req.params.id);
  const existe = await req.prisma.exame.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Exame não encontrado' });

  await req.prisma.exame.delete({ where: { id } });
  return res.json({ mensagem: 'Exame removido' });
}

module.exports = { listar, criar, atualizar, remover };
