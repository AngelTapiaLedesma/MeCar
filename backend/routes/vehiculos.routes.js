const { Router } = require('express');
const {
    getVehiculos,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo,
} = require('../controllers/vehiculos.controller');

const router = Router();

router.get('/vehiculos', getVehiculos);
router.post('/vehiculos', createVehiculo);
router.put('/vehiculos/:id', updateVehiculo);
router.delete('/vehiculos/:id', deleteVehiculo);

module.exports = router;