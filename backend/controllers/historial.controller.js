const { getConnection, sql } = require('../db');

// Obtener todo el historial de UN auto en específico
const getHistorialVehiculo = async (req, res) => {
    const { idVehiculo } = req.params;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdVehiculo', sql.Int, idVehiculo)
            // Los ordenamos por fecha, para que lo más reciente salga primero
            .query('SELECT * FROM HistorialServicios WHERE IdVehiculo = @IdVehiculo ORDER BY FechaServicio DESC');
            
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Registrar un nuevo servicio (Agregar nota al Log)
const createServicio = async (req, res) => {
    const { IdVehiculo, Titulo, Descripcion, CostoPiezas, CostoManoObra, KilometrajeEnServicio } = req.body;
    
    try {
        const pool = await getConnection();
        
        await pool.request()
            .input('IdVehiculo', sql.Int, IdVehiculo)
            .input('Titulo', sql.NVarChar, Titulo)
            .input('Descripcion', sql.NVarChar, Descripcion)
            .input('CostoPiezas', sql.Decimal(10,2), CostoPiezas)
            .input('CostoManoObra', sql.Decimal(10,2), CostoManoObra)
            .input('KilometrajeEnServicio', sql.Int, KilometrajeEnServicio)
            // No insertamos CostoTotal ni FechaServicio porque SQL los genera automáticamente
            .query(`INSERT INTO HistorialServicios (IdVehiculo, Titulo, Descripcion, CostoPiezas, CostoManoObra, KilometrajeEnServicio) 
                    VALUES (@IdVehiculo, @Titulo, @Descripcion, @CostoPiezas, @CostoManoObra, @KilometrajeEnServicio)`);
            
        res.status(201).json({ message: '¡Servicio registrado exitosamente en el historial del auto!' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { getHistorialVehiculo, createServicio };