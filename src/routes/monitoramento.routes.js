const { Router } = require('express');
const { listar, criar, remover, alertas } = require('../controllers/monitoramento.controller');
const autenticar = require('../middleware/auth.middleware');

const router = Router();

router.use(autenticar);

router.get('/alertas', alertas);
router.get('/', listar);
router.post('/', criar);
router.delete('/:id', remover);

module.exports = router;