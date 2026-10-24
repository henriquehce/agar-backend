// undefined = campo nao enviado; null = valor invalido (o controller responde 400).
function normalizarQuantidadeBebes(valor) {
  if (valor === undefined || valor === null || valor === '') return undefined;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
}

module.exports = { normalizarQuantidadeBebes };
