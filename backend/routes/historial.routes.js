const { Router } = require('express');
const {
    getHistorial,
    createTicket,
    updateTicket,
    deleteTicket,
} = require('../controllers/historial.controller');

const router = Router();

router.get('/historial', getHistorial);
router.post('/historial', createTicket);
router.put('/historial/:id', updateTicket);
router.delete('/historial/:id', deleteTicket);

module.exports = router;