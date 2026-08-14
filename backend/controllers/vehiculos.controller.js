const { getConnection, sql } = require('../db');

// Función para obtener los autos de UN cliente en específico
const getVehiculosDeCliente = async (req, res) => {
    // Extraemos el ID del cliente desde la URL
    const { idCliente } = req.params; 

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdCliente', sql.Int, idCliente)
            .query('SELECT * FROM Vehiculos WHERE IdCliente = @IdCliente');
            
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Función para registrar un auto nuevo
const createVehiculo = async (req, res) => {
    const { IdCliente, Placas, VIN, Marca, Modelo, Anio, Motor, KilometrajeActual } = req.body;
    
    try {
        const pool = await getConnection();
        
        await pool.request()
            .input('IdCliente', sql.Int, IdCliente)
            .input('Placas', sql.NVarChar, Placas)
            .input('VIN', sql.NVarChar, VIN)
            .input('Marca', sql.NVarChar, Marca)
            .input('Modelo', sql.NVarChar, Modelo)
            .input('Anio', sql.Int, Anio)
            .input('Motor', sql.NVarChar, Motor)
            .input('KilometrajeActual', sql.Int, KilometrajeActual)
            .query(`INSERT INTO Vehiculos (IdCliente, Placas, VIN, Marca, Modelo, Anio, Motor, KilometrajeActual) 
                    VALUES (@IdCliente, @Placas, @VIN, @Marca, @Modelo, @Anio, @Motor, @KilometrajeActual)`);
            
        res.status(201).json({ message: '¡Automóvil registrado con éxito en el sistema!' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { getVehiculosDeCliente, createVehiculo };