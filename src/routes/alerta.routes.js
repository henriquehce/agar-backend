const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/alerta.controller');

router.use(auth);
router.get('/', ctrl.listar);

module.exports = router;
