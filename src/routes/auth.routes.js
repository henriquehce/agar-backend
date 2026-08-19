const { Router } = require('express');
const { cadastrar, login, esqueciSenha, redefinirSenha } = require('../controllers/auth.controller');

const router = Router();

router.post('/cadastro', cadastrar);
router.post('/login', login);
router.post('/esqueci-senha', esqueciSenha);
router.post('/redefinir-senha', redefinirSenha);

module.exports = router;
