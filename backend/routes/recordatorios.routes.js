const { Router } = require('express');
const {
    getAllRecordatorios,
    getRecordatoriosByVehiculo,
    createRecordatorio,
    updateRecordatorio,
    deleteRecordatorio,
} = require('../controllers/recordatorios.controller');

const router = Router();

router.get('/recordatorios', getAllRecordatorios);
router.get('/vehiculos/:idVehiculo/recordatorios', getRecordatoriosByVehiculo);
router.post('/recordatorios', createRecordatorio);
router.put('/recordatorios/:id', updateRecordatorio);
router.delete('/recordatorios/:id', deleteRecordatorio);

module.exports = router;