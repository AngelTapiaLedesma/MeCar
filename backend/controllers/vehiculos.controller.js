const { getConnection, sql } = require('../db');

const getVehiculos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT v.*, c.NombreCompleto AS ClienteNombre
            FROM Vehiculos v
            INNER JOIN Clientes c ON c.IdCliente = v.IdCliente
            ORDER BY v.Marca, v.Modelo
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const createVehiculo = async (req, res) => {
    const { IdCliente, Placas, Marca, Modelo, Anio, Color, KilometrajeActual } = req.body;

    if (!IdCliente || !Placas || !Marca || !Modelo) {
        return res
            .status(400)
            .json({ message: 'IdCliente, Placas, Marca y Modelo son obligatorios.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdCliente', sql.Int, IdCliente)
            .input('Placas', sql.NVarChar, Placas)
            .input('Marca', sql.NVarChar, Marca)
            .input('Modelo', sql.NVarChar, Modelo)
            .input('Anio', sql.Int, Anio)
            .input('Color', sql.NVarChar, Color)
            .input('KilometrajeActual', sql.Int, KilometrajeActual)
            .query(`
                INSERT INTO Vehiculos (IdCliente, Placas, Marca, Modelo, Anio, Color, KilometrajeActual)
                OUTPUT INSERTED.IdVehiculo
                VALUES (@IdCliente, @Placas, @Marca, @Modelo, @Anio, @Color, @KilometrajeActual)
            `);
        res.status(201).json({
            message: 'Vehículo registrado.',
            IdVehiculo: result.recordset[0].IdVehiculo,
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { getVehiculos, createVehiculo };