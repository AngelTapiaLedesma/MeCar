const { Router } = require('express');
const { getRecordatoriosPendientes, createRecordatorio, completarRecordatorio } = require('../controllers/recordatorios.controller');

const router = Router();

// Ver los próximos vencimientos
router.get('/recordatorios/pendientes', getRecordatoriosPendientes);

// Crear uno nuevo
router.post('/recordatorios', createRecordatorio);

// Marcar como completado (usamos PUT porque estamos actualizando un dato existente)
router.put('/recordatorios/:idRecordatorio/completar', completarRecordatorio);

module.exports = router;