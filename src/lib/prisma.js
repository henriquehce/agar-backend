const { PrismaD1 } = require('@prisma/adapter-d1');
const { PrismaClient } = require('@prisma/client');

// No Workers, o binding do D1 (env.agar_db) só existe dentro do contexto de uma
// requisição — por isso o client é criado por requisição (middleware em worker.js),
// em vez de um singleton top-level como era com o Pool do Postgres.
function criarPrisma(d1Binding) {
  const adapter = new PrismaD1(d1Binding);
  return new PrismaClient({ adapter });
}

module.exports = { criarPrisma };
