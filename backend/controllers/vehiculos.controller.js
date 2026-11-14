const { getConnection, sql } = require('../db');
const { normalizeTitle } = require('../utils/text');
const { getVerificationData } = require('../utils/verification');
const { ensureVerificationReminder } = require('./recordatorios.controller');

const getVehiculos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT v.*, c.NombreCompleto AS ClienteNombre
            FROM Vehiculos v
            INNER JOIN Clientes c ON c.IdCliente = v.IdCliente
            ORDER BY LOWER(v.Marca), LOWER(v.Modelo), v.IdVehiculo
        `);
        res.json(result.recordset.map((vehicle) => ({
            ...vehicle,
            DatosVerificacion: getVerificationData(vehicle.Placas),
        })));
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Devuelve un vehículo con su cliente y los datos de verificación derivados
// de la placa. Lo usa el detalle del vehículo para refrescar kilometraje.
const getVehiculoById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdVehiculo', sql.Int, id)
            .query(`
                SELECT v.*, c.NombreCompleto AS ClienteNombre
                FROM Vehiculos v
                INNER JOIN Clientes c ON c.IdCliente = v.IdCliente
                WHERE v.IdVehiculo = @IdVehiculo
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }

        const vehicle = result.recordset[0];
        res.json({
            ...vehicle,
            DatosVerificacion: getVerificationData(vehicle.Placas),
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Busca si un VIN ya está registrado en otro vehículo.
const checkVin = async (req, res) => {
    const { vin, excludeId } = req.query;
    if (!vin || !vin.trim()) return res.json({ exists: false });
    try {
        const pool = await getConnection();
        const request = pool.request().input('VIN', sql.NVarChar, vin.trim());
        let query = `
            SELECT v.IdVehiculo, v.Marca, v.Modelo, c.NombreCompleto AS ClienteNombre
            FROM Vehiculos v
            INNER JOIN Clientes c ON c.IdCliente = v.IdCliente
            WHERE v.VIN = @VIN
        `;
        if (excludeId) {
            request.input('ExcludeId', sql.Int, excludeId);
            query += ' AND v.IdVehiculo <> @ExcludeId';
        }
        const result = await request.query(query);
        if (result.recordset.length === 0) return res.json({ exists: false });
        const match = result.recordset[0];
        res.json({
            exists: true,
            vehicle: `${match.Marca} ${match.Modelo}`,
            client: match.ClienteNombre,
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const createVehiculo = async (req, res) => {
    const { IdCliente, Placas, Anio, Color, KilometrajeActual, VIN } = req.body;
    const PlacasNormalizadas = String(Placas || '').trim();
    const VINNormalizado = String(VIN || '').trim() || null;
    const MarcaNormalizada = normalizeTitle(req.body.Marca);
    const ModeloNormalizado = normalizeTitle(req.body.Modelo);

    if (!IdCliente || !PlacasNormalizadas || !MarcaNormalizada || !ModeloNormalizado) {
        return res
            .status(400)
            .json({ message: 'IdCliente, Placas, Marca y Modelo son obligatorios.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdCliente', sql.Int, IdCliente)
            .input('Placas', sql.NVarChar, PlacasNormalizadas)
            .input('Marca', sql.NVarChar, MarcaNormalizada)
            .input('Modelo', sql.NVarChar, ModeloNormalizado)
            .input('Anio', sql.Int, Anio)
            .input('Color', sql.NVarChar, Color)
            .input('KilometrajeActual', sql.Int, KilometrajeActual)
            .input('VIN', sql.NVarChar, VINNormalizado)
            .query(`
                INSERT INTO Vehiculos (IdCliente, Placas, Marca, Modelo, Anio, Color, KilometrajeActual, VIN)
                OUTPUT INSERTED.*
                VALUES (@IdCliente, @Placas, @Marca, @Modelo, @Anio, @Color, @KilometrajeActual, @VIN)
            `);
        const vehicle = result.recordset[0];
        await ensureVerificationReminder(pool, vehicle);
        res.status(201).json({
            message: 'Vehículo registrado.',
            IdVehiculo: vehicle.IdVehiculo,
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// NUEVO: edita los datos del vehículo (no cambia de dueño aquí).
const updateVehiculo = async (req, res) => {
    const { id } = req.params;
    const { Placas, Anio, Color, KilometrajeActual, VIN } = req.body;
    const PlacasNormalizadas = String(Placas || '').trim();
    const VINNormalizado = String(VIN || '').trim() || null;
    const MarcaNormalizada = normalizeTitle(req.body.Marca);
    const ModeloNormalizado = normalizeTitle(req.body.Modelo);

    if (!PlacasNormalizadas || !MarcaNormalizada || !ModeloNormalizado) {
        return res
            .status(400)
            .json({ message: 'Placas, Marca y Modelo son obligatorios.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdVehiculo', sql.Int, id)
            .input('Placas', sql.NVarChar, PlacasNormalizadas)
            .input('Marca', sql.NVarChar, MarcaNormalizada)
            .input('Modelo', sql.NVarChar, ModeloNormalizado)
            .input('Anio', sql.Int, Anio)
            .input('Color', sql.NVarChar, Color)
            .input('KilometrajeActual', sql.Int, KilometrajeActual)
            .input('VIN', sql.NVarChar, VINNormalizado)
            .query(`
                UPDATE Vehiculos
                SET Placas = @Placas,
                    Marca = @Marca,
                    Modelo = @Modelo,
                    Anio = @Anio,
                    Color = @Color,
                    KilometrajeActual = @KilometrajeActual,
                    VIN = @VIN
                OUTPUT DELETED.Placas AS PlacasAnteriores
                WHERE IdVehiculo = @IdVehiculo
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }

        const vehicleResult = await pool.request()
            .input('IdVehiculo', sql.Int, id)
            .query('SELECT * FROM Vehiculos WHERE IdVehiculo = @IdVehiculo');
        const vehicle = vehicleResult.recordset[0];

        // Solo reconciliamos la cita automática cuando cambia la placa;
        // una edición de color o kilometraje no debe borrar una cita manual
        // de verificación que coincida con la ventana vigente.
        const previousPlate = result.recordset[0]?.PlacasAnteriores;
        if (previousPlate !== vehicle.Placas) {
            await pool.request()
                .input('IdVehiculo', sql.Int, id)
                .query(`
                    DELETE FROM Recordatorios
                    WHERE IdVehiculo = @IdVehiculo
                      AND EsAutomatico = 1
                `);
        }
        await ensureVerificationReminder(pool, vehicle);
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

module.exports = {
    getVehiculos,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo,
    checkVin,
};