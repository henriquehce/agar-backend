// Entrypoint do Cloudflare Worker. Express foi trocado por Hono (equivalente,
// nativo da plataforma); os controllers em src/controllers/ continuam com a
// assinatura (req, res) do Express - o adaptador abaixo (toHono) faz a ponte,
// então a lógica de negócio em si não precisou ser reescrita.
const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { secureHeaders } = require('hono/secure-headers');
const jwt = require('jsonwebtoken');

const { criarPrisma } = require('./lib/prisma');
const autenticar = require('./middleware/auth.middleware');

const authCtrl = require('./controllers/auth.controller');
const gestanteCtrl = require('./controllers/gestante.controller');
const consultaCtrl = require('./controllers/consulta.controller');
const monitoramentoCtrl = require('./controllers/monitoramento.controller');
const exameCtrl = require('./controllers/exame.controller');
const registroMensalCtrl = require('./controllers/registroMensal.controller');
const anotacaoCtrl = require('./controllers/anotacao.controller');
const movimentoFetalCtrl = require('./controllers/movimentoFetal.controller');
const alertaCtrl = require('./controllers/alerta.controller');
const swaggerSpec = require('./swagger');

const app = new Hono({ strict: false });

app.use('*', secureHeaders());
app.use('*', cors());

// `process.env` não existe nativamente no Worker - os secrets (wrangler secret put)
// só chegam via c.env. Espelha aqui pra todo o código legado do Express (controllers,
// jsonwebtoken) continuar lendo process.env.JWT_SECRET sem precisar ser reescrito.
app.use('*', async (c, next) => {
  globalThis.process = globalThis.process || { env: {} };
  process.env.JWT_SECRET = c.env.JWT_SECRET;
  c.set('prisma', criarPrisma(c.env.agar_db));
  await next();
});

// Adapta um controller no formato Express (req, res) pra um handler Hono.
// `privado` decide se passa pelo middleware de autenticação antes.
function toHono(handler, { privado = true } = {}) {
  return async (c) => {
    const req = {
      body: {},
      params: c.req.param(),
      query: c.req.query(),
      headers: Object.fromEntries(c.req.raw.headers),
      ip: c.req.header('cf-connecting-ip') || '',
      prisma: c.get('prisma'),
    };
    if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
      req.body = await c.req.json().catch(() => ({}));
    }

    let statusCode = 200;
    let payload;
    const res = {
      status(code) { statusCode = code; return res; },
      json(data) { payload = data; return res; },
    };

    if (privado) {
      let autenticado = false;
      await new Promise((resolve) => {
        autenticar(req, res, () => { autenticado = true; resolve(); });
        if (!autenticado) resolve();
      });
      if (!autenticado) return c.json(payload, statusCode);
    }

    await handler(req, res);
    return c.json(payload, statusCode);
  };
}

// ---- Autenticação (pública) ----
app.post('/auth/cadastro', toHono(authCtrl.cadastrar, { privado: false }));
app.post('/auth/login', toHono(authCtrl.login, { privado: false }));
app.post('/auth/esqueci-senha', toHono(authCtrl.esqueciSenha, { privado: false }));
app.post('/auth/redefinir-senha', toHono(authCtrl.redefinirSenha, { privado: false }));

// ---- Gestante ----
app.get('/gestante/perfil', toHono(gestanteCtrl.getPerfil));
app.put('/gestante/perfil', toHono(gestanteCtrl.updatePerfil));
app.put('/gestante/senha', toHono(gestanteCtrl.updateSenha));
app.get('/gestante/meus-dados', toHono(gestanteCtrl.exportarDados));
app.delete('/gestante/conta', toHono(gestanteCtrl.excluirConta));

// ---- Consultas ----
app.get('/consultas', toHono(consultaCtrl.listar));
app.post('/consultas', toHono(consultaCtrl.criar));
app.put('/consultas/:id', toHono(consultaCtrl.atualizar));
app.delete('/consultas/:id', toHono(consultaCtrl.remover));

// ---- Monitoramento ----
app.get('/monitoramento/alertas', toHono(monitoramentoCtrl.alertas));
app.get('/monitoramento', toHono(monitoramentoCtrl.listar));
app.post('/monitoramento', toHono(monitoramentoCtrl.criar));
app.delete('/monitoramento/:id', toHono(monitoramentoCtrl.remover));

// ---- Exames ----
app.get('/exames', toHono(exameCtrl.listar));
app.post('/exames', toHono(exameCtrl.criar));
app.put('/exames/:id', toHono(exameCtrl.atualizar));
app.delete('/exames/:id', toHono(exameCtrl.remover));

// ---- Registros mensais ----
app.get('/registros-mensais', toHono(registroMensalCtrl.listar));
app.post('/registros-mensais', toHono(registroMensalCtrl.criar));
app.put('/registros-mensais/:id', toHono(registroMensalCtrl.atualizar));
app.delete('/registros-mensais/:id', toHono(registroMensalCtrl.remover));

// ---- Anotações ----
app.get('/anotacoes', toHono(anotacaoCtrl.listar));
app.post('/anotacoes', toHono(anotacaoCtrl.criar));
app.delete('/anotacoes/:id', toHono(anotacaoCtrl.remover));

// ---- Movimentos fetais ----
app.get('/movimentos-fetais', toHono(movimentoFetalCtrl.listar));
app.post('/movimentos-fetais', toHono(movimentoFetalCtrl.criar));
app.delete('/movimentos-fetais/:id', toHono(movimentoFetalCtrl.remover));

// ---- Alertas ----
app.get('/alertas', toHono(alertaCtrl.listar));

// ---- Documentação ----
app.get('/openapi.json', (c) => c.json(swaggerSpec));

app.get('/', (c) => c.json({ status: 'AGAR API online', versao: '1.0.0', infra: 'Cloudflare Workers + D1' }));

export default app;
