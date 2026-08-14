const { Router } = require('express');
const { getClientes, createCliente } = require('../controllers/clientes.controller');

const router = Router();

// Endpoint para obtener (GET)
router.get('/clientes', getClientes);

// NUEVO: Endpoint para insertar (POST)
router.post('/clientes', createCliente);

module.exports = router;