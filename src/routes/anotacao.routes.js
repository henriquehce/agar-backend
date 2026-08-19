const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/anotacao.controller');

router.use(auth);
router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.delete('/:id', ctrl.remover);

module.exports = router;
