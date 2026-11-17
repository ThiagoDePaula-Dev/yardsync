// Junta todas as rotas da API (tudo fica sob /api).
const { Router } = require('express');

const router = Router();
router.use(require('./auth.routes'));
router.use(require('./veiculos.routes'));
router.use(require('./exportacao.routes'));
router.use(require('./ti.routes'));

module.exports = router;
