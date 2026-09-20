const { Router } = require('express');
const {
    getClientes,
    createCliente,
    getClienteById,
} = require('../controllers/clientes.controller');

const router = Router();

// Endpoint para obtener todos (GET)
router.get('/clientes', getClientes);

// NUEVO: Endpoint para obtener uno solo, con sus vehículos (GET)
router.get('/clientes/:id', getClienteById);

// Endpoint para insertar (POST)
router.post('/clientes', createCliente);

module.exports = router;