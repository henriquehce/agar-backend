const crypto = require('crypto');

// Sem 0/O e 1/I/L, que se confundem quando a gestante dita o código na consulta.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TAMANHO = 6;
const VALIDADE_MS = 30 * 60 * 1000;

function gerarCodigo() {
  let codigo = '';
  for (let i = 0; i < TAMANHO; i++) codigo += ALFABETO[crypto.randomInt(0, ALFABETO.length)];
  return codigo;
}

// Aceita o código digitado com espaço, hífen ou minúsculas.
function normalizarCodigo(texto) {
  return String(texto || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// O código fica guardado só como hash: quem lê o banco não consegue usá-lo.
function hashCodigo(codigo) {
  return crypto.createHash('sha256').update(normalizarCodigo(codigo)).digest('hex');
}

module.exports = { gerarCodigo, normalizarCodigo, hashCodigo, ALFABETO, TAMANHO, VALIDADE_MS };
