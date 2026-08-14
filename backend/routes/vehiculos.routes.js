const { Router } = require('express');
const { getVehiculosDeCliente, createVehiculo } = require('../controllers/vehiculos.controller');

const router = Router();

// Fíjate en el ":idCliente", es una variable en la URL
router.get('/clientes/:idCliente/vehiculos', getVehiculosDeCliente);

router.post('/vehiculos', createVehiculo);

module.exports = router;