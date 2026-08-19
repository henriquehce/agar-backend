const { Router } = require('express');
const { listar, criar, atualizar, remover } = require('../controllers/consulta.controller');
const autenticar = require('../middleware/auth.middleware');

const router = Router();

router.use(autenticar);

router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);

module.exports = router;