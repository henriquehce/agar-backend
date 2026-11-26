const { Router } = require('express');
const ctrl = require('../controllers/profissional.controller');
const { autenticarProfissional } = require('../middleware/auth.middleware');

// Rotas autenticadas do profissional de saúde (cadastro e login ficam em /auth/profissional).
const router = Router();
router.use(autenticarProfissional);
router.get('/perfil', ctrl.perfil);
router.post('/vincular', ctrl.vincular);
router.get('/gestantes', ctrl.listarGestantes);
router.get('/gestantes/:id/relatorio', ctrl.relatorio);

module.exports = router;
