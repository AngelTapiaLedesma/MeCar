const { Router } = require('express');
const { getHistorialVehiculo, createServicio } = require('../controllers/historial.controller');

const router = Router();

// Ruta para ver el historial de un auto usando su ID
router.get('/vehiculos/:idVehiculo/historial', getHistorialVehiculo);

// Ruta para agregar una nueva reparación/chequeo
router.post('/historial', createServicio);

module.exports = router;