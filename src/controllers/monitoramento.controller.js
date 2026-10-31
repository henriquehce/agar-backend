const { calcularNivelRisco } = require('../lib/risco');

async function listar(req, res) {
  const { tipo } = req.query;
  const monitoramentos = await req.prisma.monitoramento.findMany({
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
  const v2 = valor2 !== undefined && valor2 !== null ? Number(valor2) : null;
  // RN08: mesmas faixas plausiveis validadas no aplicativo, repetidas aqui para
  // que nenhum cliente consiga gravar valor invalido (antes, texto virava NaN).
  const inteiroEntre = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
  if (tipo === 'pressao') {
    if (!inteiroEntre(v1, 50, 260) || !inteiroEntre(v2, 30, 160) || v2 >= v1) {
      return res.status(400).json({ erro: 'Pressão inválida: máxima entre 50 e 260, mínima entre 30 e 160, e máxima maior que a mínima' });
    }
  } else if (!inteiroEntre(v1, 20, 600)) {
    return res.status(400).json({ erro: 'Glicemia inválida: informe um valor inteiro entre 20 e 600 mg/dL' });
  }
  const nivelRisco = calcularNivelRisco({ tipo, valor1: v1, valor2: v2, subtipo });

  const registro = await req.prisma.monitoramento.create({
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

// Alerta reflete o estado atual: so a medicao mais recente de cada tipo conta.
// Uma pressao alta antiga, seguida de uma normal, nao deve continuar gerando aviso.
async function alertas(req, res) {
  const ultimas = await Promise.all(['pressao', 'glicemia'].map((tipo) =>
    req.prisma.monitoramento.findFirst({
      where: { gestanteId: req.gestanteId, tipo },
      orderBy: { criadoEm: 'desc' },
    })
  ));
  const ativos = ultimas
    .filter((m) => m && ['alto', 'critico'].includes(m.nivelRisco))
    .sort((a, b) => (a.nivelRisco === 'critico' ? -1 : 0) - (b.nivelRisco === 'critico' ? -1 : 0));
  return res.json(ativos);
}

async function remover(req, res) {
  const id = Number(req.params.id);
  const existe = await req.prisma.monitoramento.findFirst({ where: { id, gestanteId: req.gestanteId } });
  if (!existe) return res.status(404).json({ erro: 'Registro não encontrado' });

  await req.prisma.monitoramento.delete({ where: { id } });
  return res.json({ mensagem: 'Registro removido' });
}

module.exports = { listar, criar, remover, alertas };