const { Router } = require('express');
const {
    getAllCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
} = require('../controllers/categorias.controller');

const router = Router();

router.get('/categorias', getAllCategorias);
router.post('/categorias', createCategoria);
router.put('/categorias/:id', updateCategoria);
router.delete('/categorias/:id', deleteCategoria);

module.exports = router;
