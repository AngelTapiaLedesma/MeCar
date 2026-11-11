const { Router } = require('express');
const {
    getVehiculos,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo,
    checkVin,
} = require('../controllers/vehiculos.controller');

const router = Router();

router.get('/vehiculos', getVehiculos);
router.get('/vehiculos/check-vin', checkVin);
router.get('/vehiculos/:id', getVehiculoById);
router.post('/vehiculos', createVehiculo);
router.put('/vehiculos/:id', updateVehiculo);
router.delete('/vehiculos/:id', deleteVehiculo);

module.exports = router;