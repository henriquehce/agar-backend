const { Router } = require('express');
const { getPerfil, updatePerfil, updateSenha, exportarDados, excluirConta } = require('../controllers/gestante.controller');
const autenticar = require('../middleware/auth.middleware');

const router = Router();

router.use(autenticar);

router.get('/perfil', getPerfil);
router.put('/perfil', updatePerfil);
router.put('/senha', updateSenha);
router.get('/meus-dados', exportarDados);
router.delete('/conta', excluirConta);

module.exports = router;