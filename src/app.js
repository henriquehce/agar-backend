const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const gestanteRoutes = require('./routes/gestante.routes');
const consultaRoutes = require('./routes/consulta.routes');
const monitoramentoRoutes = require('./routes/monitoramento.routes');
const exameRoutes = require('./routes/exame.routes');
const registroMensalRoutes = require('./routes/registroMensal.routes');
const anotacaoRoutes = require('./routes/anotacao.routes');
const movimentoFetalRoutes = require('./routes/movimentoFetal.routes');
const alertaRoutes = require('./routes/alerta.routes');

const app = express();

// Cabeçalhos de segurança (XSS, sniffing, clickjacking etc).
app.use(helmet());

// Em produção, restringe a origem via env var; em dev libera tudo para facilitar o Expo (web/LAN/túnel).
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

app.use(express.json());

// Limita tentativas de login/cadastro por IP — mitiga força bruta e spam de contas.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

app.use('/auth', authLimiter, authRoutes);
app.use('/gestante', gestanteRoutes);
app.use('/consultas', consultaRoutes);
app.use('/monitoramento', monitoramentoRoutes);
app.use('/exames', exameRoutes);
app.use('/registros-mensais', registroMensalRoutes);
app.use('/anotacoes', anotacaoRoutes);
app.use('/movimentos-fetais', movimentoFetalRoutes);
app.use('/alertas', alertaRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'AGAR API online', versao: '1.0.0' });
});

module.exports = app;
