// Popula a tabela sinais_alerta com o conteúdo que antes vivia fixo no app (AlertaScreen.js).
// Rodar com: npm run seed:alertas
//
// `cor`/`bg`/`borda` devem bater com a escala única de risco em agar-app/src/theme/index.js
// (riskCrise, riskAtencao, riskLeve) — nunca usar verde aqui, pois no Monitoramento verde
// significa "normal", e nenhum destes três níveis é "sem risco".
// `icone` é o nome de um ícone do Ionicons (@expo/vector-icons), não mais emoji.
const prisma = require('../src/lib/prisma');

const SINAIS = [
  {
    nivel: 'EMERGENCIA',
    cor: '#C0392B',
    bg: '#FBE7E4',
    borda: '#C0392B',
    icone: 'alert-circle',
    titulo: 'Sinais de emergência',
    acao: 'Se notar qualquer um destes sinais, vá até a maternidade — não precisa esperar a consulta.',
    sintomas: JSON.stringify([
      'Sangramento vaginal intenso',
      'Dor abdominal muito forte e constante',
      'Ausência de movimentos do bebê por mais de 12h',
      'Convulsões ou desmaio',
      'Febre acima de 39°C com dor intensa',
    ]),
    ordem: 0,
  },
  {
    nivel: 'URGENTE',
    cor: '#C77D0A',
    bg: '#FBF1DE',
    borda: '#C77D0A',
    icone: 'warning',
    titulo: 'Sinais de urgência',
    acao: 'Se notar qualquer um destes sinais, entre em contato com o AGAR ainda hoje.',
    sintomas: JSON.stringify([
      'Dor de cabeça forte que não melhora',
      'Visão turva ou flashes de luz',
      'Inchaço súbito nas mãos, rosto ou pés',
      'Pressão acima de 140/90 mmHg',
      'Dificuldade para respirar em repouso',
      'Queimação forte ao urinar com febre',
    ]),
    ordem: 1,
  },
  {
    nivel: 'ATENCAO',
    cor: '#2B6CB0',
    bg: '#EBF8FF',
    borda: '#2B6CB0',
    icone: 'information-circle',
    titulo: 'Sinais de atenção',
    acao: 'Vale comentar qualquer um destes pontos na sua próxima consulta.',
    sintomas: JSON.stringify([
      'Inchaço leve nos pés ao final do dia',
      'Azia frequente e intensa',
      'Câimbras nas pernas',
      'Corrimento diferente do habitual',
      'Coceira intensa no corpo',
      'Pressão entre 130/85 e 139/89 mmHg',
    ]),
    ordem: 2,
  },
];

async function main() {
  for (const s of SINAIS) {
    const existente = await prisma.sinalAlerta.findFirst({ where: { nivel: s.nivel } });
    if (existente) {
      await prisma.sinalAlerta.update({ where: { id: existente.id }, data: s });
    } else {
      await prisma.sinalAlerta.create({ data: s });
    }
  }
  console.log(`Seed de alertas concluído (${SINAIS.length} registros).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
