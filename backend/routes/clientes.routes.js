const { Router } = require('express');
const {
    getClientes,
    createCliente,
    getClienteById,
    updateCliente,
    deleteCliente,
} = require('../controllers/clientes.controller');

const router = Router();

router.get('/clientes', getClientes);
router.get('/clientes/:id', getClienteById);
router.post('/clientes', createCliente);
router.put('/clientes/:id', updateCliente);
router.delete('/clientes/:id', deleteCliente);

module.exports = router;