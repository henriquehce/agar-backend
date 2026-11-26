const { Router } = require('express');
const { getPerfil, updatePerfil, updateSenha, exportarDados, excluirConta, gerarCodigoVinculo, listarProfissionais, revogarProfissional } = require('../controllers/gestante.controller');
const autenticar = require('../middleware/auth.middleware');

const router = Router();

router.use(autenticar);

router.get('/perfil', getPerfil);
router.put('/perfil', updatePerfil);
router.put('/senha', updateSenha);
router.get('/meus-dados', exportarDados);
router.delete('/conta', excluirConta);
router.post('/codigo-vinculo', gerarCodigoVinculo);
router.get('/profissionais', listarProfissionais);
router.delete('/profissionais/:id', revogarProfissional);

module.exports = router;
