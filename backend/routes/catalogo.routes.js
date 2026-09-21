const { Router } = require('express');
const {
    getCatalogo,
    createSeccion,
    deleteSeccion,
    createItem,
    updateItem,
    deleteItem,
} = require('../controllers/catalogo.controller');

const router = Router();

router.get('/catalogo', getCatalogo);
router.post('/catalogo/secciones', createSeccion);
router.delete('/catalogo/secciones/:id', deleteSeccion);
router.post('/catalogo/items', createItem);
router.put('/catalogo/items/:id', updateItem);
router.delete('/catalogo/items/:id', deleteItem);

module.exports = router;