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

// NUEVO: edita los datos del vehículo (no cambia de dueño aquí).
const updateVehiculo = async (req, res) => {
    const { id } = req.params;
    const { Placas, Marca, Modelo, Anio, Color, KilometrajeActual } = req.body;

    if (!Placas || !Marca || !Modelo) {
        return res
            .status(400)
            .json({ message: 'Placas, Marca y Modelo son obligatorios.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdVehiculo', sql.Int, id)
            .input('Placas', sql.NVarChar, Placas)
            .input('Marca', sql.NVarChar, Marca)
            .input('Modelo', sql.NVarChar, Modelo)
            .input('Anio', sql.Int, Anio)
            .input('Color', sql.NVarChar, Color)
            .input('KilometrajeActual', sql.Int, KilometrajeActual)
            .query(`
                UPDATE Vehiculos
                SET Placas = @Placas,
                    Marca = @Marca,
                    Modelo = @Modelo,
                    Anio = @Anio,
                    Color = @Color,
                    KilometrajeActual = @KilometrajeActual
                WHERE IdVehiculo = @IdVehiculo
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }

        res.json({ message: 'Vehículo actualizado.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Borra un vehículo. Sus tickets ABIERTOS ('In Progress') se borran de
// verdad junto con él; sus tickets CERRADOS se quedan en el historial
// (se desvinculan solos vía ON DELETE SET NULL, y conservan su
// VehiculoSnapshot/ClienteSnapshot para seguir siendo legibles).
const deleteVehiculo = async (req, res) => {
    const { id } = req.params;
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        await new sql.Request(transaction)
            .input('IdVehiculo', sql.Int, id)
            .query(`
                DELETE FROM HistorialServicios
                WHERE IdVehiculo = @IdVehiculo AND Estatus = 'In Progress'
            `);

        const result = await new sql.Request(transaction)
            .input('IdVehiculo', sql.Int, id)
            .query('DELETE FROM Vehiculos WHERE IdVehiculo = @IdVehiculo');

        if (result.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }

        await transaction.commit();
        res.json({ message: 'Vehículo eliminado.' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).send(error.message);
    }
};

module.exports = { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo };