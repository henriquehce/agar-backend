// Documentação interativa da API (OpenAPI 3.0), servida em /docs (JSON em /openapi.json).
// Especificação escrita à mão (em vez de anotações JSDoc espalhadas pelas rotas) para manter
// tudo num único lugar, fácil de conferir contra as rotas reais em src/worker.js.

const respostaErro = {
  type: 'object',
  properties: { erro: { type: 'string' } },
};

const bearerAuth = [{ bearerAuth: [] }];

function crud(recurso, tag, campos, idParam = true) {
  const base = `/${recurso}`;
  const paths = {};
  paths[base] = {
    get: {
      tags: [tag],
      summary: `Lista os registros de ${tag.toLowerCase()} da gestante autenticada`,
      security: bearerAuth,
      responses: { 200: { description: 'Lista de registros' }, 401: { description: 'Token ausente ou inválido' } },
    },
    post: {
      tags: [tag],
      summary: `Cria um novo registro de ${tag.toLowerCase()}`,
      security: bearerAuth,
      requestBody: { content: { 'application/json': { schema: { type: 'object', properties: campos } } } },
      responses: { 201: { description: 'Registro criado' }, 400: { description: 'Dados inválidos', content: { 'application/json': { schema: respostaErro } } } },
    },
  };
  if (idParam) {
    paths[`${base}/{id}`] = {
      put: {
        tags: [tag],
        summary: `Atualiza um registro de ${tag.toLowerCase()}`,
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Registro atualizado' }, 404: { description: 'Não encontrado' } },
      },
      delete: {
        tags: [tag],
        summary: `Remove um registro de ${tag.toLowerCase()}`,
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Registro removido' }, 404: { description: 'Não encontrado' } },
      },
    };
  }
  return paths;
}

const paths = {
  '/auth/cadastro': {
    post: {
      tags: ['Autenticação'],
      summary: 'Cria a conta da gestante (RF01)',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['nome', 'email', 'senha', 'semanaInicial'],
              properties: {
                nome: { type: 'string' }, email: { type: 'string' }, senha: { type: 'string' },
                telefone: { type: 'string' }, semanaInicial: { type: 'integer' }, quantidadeBebes: { type: 'integer', minimum: 1, maximum: 4, default: 1 },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Conta criada' }, 400: { description: 'E-mail já cadastrado', content: { 'application/json': { schema: respostaErro } } } },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Autenticação'],
      summary: 'Autentica a gestante e retorna o token JWT (RF02)',
      requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email', 'senha'], properties: { email: { type: 'string' }, senha: { type: 'string' } } } } } },
      responses: { 200: { description: 'Login realizado, token retornado' }, 401: { description: 'Credenciais inválidas', content: { 'application/json': { schema: respostaErro } } } },
    },
  },
  '/auth/esqueci-senha': {
    post: {
      tags: ['Autenticação'],
      summary: 'Envia código de verificação por e-mail para recuperação de senha (RF03)',
      requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } } } },
      responses: { 200: { description: 'Código enviado (resposta genérica, evita enumeração de e-mails)' } },
    },
  },
  '/auth/redefinir-senha': {
    post: {
      tags: ['Autenticação'],
      summary: 'Redefine a senha a partir do código de verificação (RF03)',
      requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, codigo: { type: 'string' }, novaSenha: { type: 'string' } } } } } },
      responses: { 200: { description: 'Senha redefinida' }, 400: { description: 'Código inválido ou expirado', content: { 'application/json': { schema: respostaErro } } } },
    },
  },
  '/gestante/perfil': {
    get: { tags: ['Gestante'], summary: 'Retorna os dados de perfil da gestante autenticada (RF16)', security: bearerAuth, responses: { 200: { description: 'Perfil da gestante' } } },
    put: { tags: ['Gestante'], summary: 'Atualiza dados de perfil e consentimentos LGPD (RF16, RF18)', security: bearerAuth, responses: { 200: { description: 'Perfil atualizado' } } },
  },
  '/gestante/senha': {
    put: { tags: ['Gestante'], summary: 'Altera a senha da gestante autenticada (RF16)', security: bearerAuth, responses: { 200: { description: 'Senha alterada' } } },
  },
  '/gestante/meus-dados': {
    get: { tags: ['Gestante'], summary: 'Exporta todos os dados pessoais e clínicos da gestante (RF17 / LGPD)', security: bearerAuth, responses: { 200: { description: 'Dados exportados em JSON' } } },
  },
  '/gestante/conta': {
    delete: { tags: ['Gestante'], summary: 'Exclui a conta e os dados vinculados à gestante (RF17 / LGPD)', security: bearerAuth, responses: { 200: { description: 'Conta excluída' } } },
  },
  ...crud('consultas', 'Consultas', { tipo: { type: 'string' }, data: { type: 'string' }, hora: { type: 'string' }, local: { type: 'string' } }),
  '/monitoramento/alertas': {
    get: { tags: ['Monitoramento'], summary: 'Lista registros de monitoramento fora da faixa normal (RF05)', security: bearerAuth, responses: { 200: { description: 'Registros em alerta' } } },
  },
  ...crud('monitoramento', 'Monitoramento', { tipo: { type: 'string', enum: ['pressao', 'glicemia'] }, valor1: { type: 'integer' }, valor2: { type: 'integer' }, subtipo: { type: 'string' } }, true),
  ...crud('exames', 'Exames', { nome: { type: 'string' }, realizado: { type: 'boolean' }, dataRealizacao: { type: 'string' } }),
  ...crud('registros-mensais', 'RegistrosMensais', { semana: { type: 'integer' }, peso: { type: 'string' }, au: { type: 'string' }, bcf: { type: 'string' }, pressao: { type: 'string' } }),
  ...crud('anotacoes', 'Anotacoes', { texto: { type: 'string' }, humor: { type: 'integer', minimum: 1, maximum: 6 } }, false),
  '/anotacoes/{id}': {
    delete: { tags: ['Anotacoes'], summary: 'Remove uma anotação do diário (RF10)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Removida' } } },
  },
  ...crud('movimentos-fetais', 'MovimentosFetais', { quantidade: { type: 'integer' }, duracaoSegundos: { type: 'integer' } }, false),
  '/movimentos-fetais/{id}': {
    delete: { tags: ['MovimentosFetais'], summary: 'Remove um registro de contagem de movimentos fetais (RF09)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Removido' } } },
  },
  '/gestante/codigo-vinculo': {
    post: { tags: ['Gestante'], summary: 'Gera um código de uso único, válido por 30 minutos, para autorizar um profissional (RN11)', security: bearerAuth, responses: { 201: { description: 'Código e validade' } } },
  },
  '/gestante/profissionais': {
    get: { tags: ['Gestante'], summary: 'Lista os profissionais autorizados e o último acesso de cada um (RN11)', security: bearerAuth, responses: { 200: { description: 'Profissionais autorizados' } } },
  },
  '/gestante/profissionais/{id}': {
    delete: { tags: ['Gestante'], summary: 'Revoga o acesso de um profissional (RN11)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Acesso removido' } } },
  },
  '/auth/profissional/cadastro': {
    post: { tags: ['Profissional'], summary: 'Cadastro do profissional de saúde; a conta fica inativa até a coordenação liberar (RF20)', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['nome', 'email', 'senha', 'registro', 'funcao'], properties: { nome: { type: 'string' }, email: { type: 'string' }, senha: { type: 'string' }, registro: { type: 'string' }, funcao: { type: 'string' } } } } } }, responses: { 201: { description: 'Cadastro recebido' }, 409: { description: 'E-mail já cadastrado' } } },
  },
  '/auth/profissional/login': {
    post: { tags: ['Profissional'], summary: 'Login do profissional; retorna token do tipo profissional (RF20)', responses: { 200: { description: 'Token' }, 403: { description: 'Aguardando aprovação' } } },
  },
  '/profissional/vincular': {
    post: { tags: ['Profissional'], summary: 'Vincula uma gestante a partir do código gerado por ela (RN11)', security: bearerAuth, responses: { 201: { description: 'Vinculada' }, 404: { description: 'Código inválido ou expirado' } } },
  },
  '/profissional/gestantes': {
    get: { tags: ['Profissional'], summary: 'Painel com as gestantes vinculadas, com prioridade para medições alteradas (RF21)', security: bearerAuth, responses: { 200: { description: 'Gestantes vinculadas' } } },
  },
  '/profissional/gestantes/{id}/relatorio': {
    get: { tags: ['Profissional'], summary: 'Relatório somente leitura da gestante; o acesso é registrado (RF21)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Relatório' }, 404: { description: 'Sem vínculo ativo' } } },
  },
  '/profissional/coordenacao/profissionais': {
    get: { tags: ['Coordenação'], summary: 'Lista os profissionais e os pedidos de acesso; apenas coordenação (RF23)', security: bearerAuth, responses: { 200: { description: 'Profissionais' }, 403: { description: 'Não é coordenação' } } },
  },
  '/profissional/coordenacao/profissionais/{id}': {
    put: { tags: ['Coordenação'], summary: 'Libera ({ativo:true}) ou bloqueia ({ativo:false}) um profissional; registra quem liberou (RF23)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Alterado' }, 400: { description: 'Regra violada' } } },
    delete: { tags: ['Coordenação'], summary: 'Recusa um pedido que nunca foi liberado (exclui a conta) (RF23)', security: bearerAuth, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Recusado' } } },
  },
  '/alertas': {
    get: { tags: ['Alertas'], summary: 'Lista os sinais de alerta ativos (RF14)', security: bearerAuth, responses: { 200: { description: 'Lista de sinais de alerta' } } },
  },
};

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'AGAR Digital - API REST',
    version: '1.0.0',
    description: 'Documentação interativa dos endpoints do back-end do AGAR Digital, agrupados por módulo funcional.',
  },
  servers: [
    { url: 'https://agar-backend.henrique-cipriani.workers.dev', description: 'Produção (Cloudflare Workers)' },
    { url: 'http://localhost:8787', description: 'Desenvolvimento local (wrangler dev)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths,
};

module.exports = spec;
