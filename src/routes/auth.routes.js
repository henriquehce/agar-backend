const { Router } = require('express');
const { cadastrar, login, esqueciSenha, redefinirSenha } = require('../controllers/auth.controller');

const router = Router();

router.post('/cadastro', cadastrar);
router.post('/login', login);
router.post('/esqueci-senha', esqueciSenha);
router.post('/redefinir-senha', redefinirSenha);
const profissional = require('../controllers/profissional.controller');
router.post('/profissional/cadastro', profissional.cadastrar);
router.post('/profissional/login', profissional.login);

module.exports = router;
