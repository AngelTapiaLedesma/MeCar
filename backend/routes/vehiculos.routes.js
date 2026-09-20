const { Router } = require('express');
const { getVehiculos, createVehiculo } = require('../controllers/vehiculos.controller');

const router = Router();

router.get('/vehiculos', getVehiculos);
router.post('/vehiculos', createVehiculo);

module.exports = router;