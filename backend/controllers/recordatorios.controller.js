const { getConnection, sql } = require('../db');

// Obtener todos los recordatorios PENDIENTES, ordenados por el más próximo a vencer
const getRecordatoriosPendientes = async (req, res) => {
    try {
        const pool = await getConnection();
        // Hacemos un JOIN rápido para traernos las placas del auto y saber de quién es
        const result = await pool.request().query(`
            SELECT r.IdRecordatorio, r.TipoRecordatorio, r.FechaVencimiento, v.Placas, v.Marca, v.Modelo 
            FROM Recordatorios r
            INNER JOIN Vehiculos v ON r.IdVehiculo = v.IdVehiculo
            WHERE r.Completado = 0 
            ORDER BY r.FechaVencimiento ASC
        `);
            
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Crear una nueva alerta (Ej. Próxima verificación)
const createRecordatorio = async (req, res) => {
    const { IdVehiculo, TipoRecordatorio, FechaVencimiento } = req.body;
    
    try {
        const pool = await getConnection();
        
        await pool.request()
            .input('IdVehiculo', sql.Int, IdVehiculo)
            .input('TipoRecordatorio', sql.NVarChar, TipoRecordatorio)
            .input('FechaVencimiento', sql.Date, FechaVencimiento)
            .query(`INSERT INTO Recordatorios (IdVehiculo, TipoRecordatorio, FechaVencimiento) 
                    VALUES (@IdVehiculo, @TipoRecordatorio, @FechaVencimiento)`);
            
        res.status(201).json({ message: '¡Recordatorio agendado con éxito!' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Marcar un recordatorio como "Completado"
const completarRecordatorio = async (req, res) => {
    const { idRecordatorio } = req.params;

    try {
        const pool = await getConnection();
        
        await pool.request()
            .input('IdRecordatorio', sql.Int, idRecordatorio)
            .query(`UPDATE Recordatorios 
                    SET Completado = 1, FechaCompletado = GETDATE() 
                    WHERE IdRecordatorio = @IdRecordatorio`);
            
        res.json({ message: '¡Recordatorio marcado como completado!' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { getRecordatoriosPendientes, createRecordatorio, completarRecordatorio };