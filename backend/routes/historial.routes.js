const { Router } = require('express');
const { getHistorial, createTicket } = require('../controllers/historial.controller');

const router = Router();

router.get('/historial', getHistorial);
router.post('/historial', createTicket);

module.exports = router;