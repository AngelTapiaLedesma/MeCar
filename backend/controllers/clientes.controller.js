const { getConnection, sql } = require('../db');
const { normalizeTitle } = require('../utils/text');
const { ensureVerificationReminder } = require('./recordatorios.controller');

const getClientes = async (req, res) => {
    try {
        const pool = await getConnection();
        const clientesResult = await pool.request()
            .query('SELECT * FROM Clientes ORDER BY LOWER(NombreCompleto), IdCliente');
        const vehiculosResult = await pool.request()
            .query('SELECT * FROM Vehiculos ORDER BY LOWER(Marca), LOWER(Modelo), IdVehiculo');

        const clientes = clientesResult.recordset.map((cliente) => ({
            ...cliente,
            Vehiculos: vehiculosResult.recordset.filter(
                (v) => v.IdCliente === cliente.IdCliente
            ),
        }));

        res.json(clientes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getClienteById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        const clienteResult = await pool.request()
            .input('IdCliente', sql.Int, id)
            .query('SELECT * FROM Clientes WHERE IdCliente = @IdCliente');

        if (clienteResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        const vehiculosResult = await pool.request()
            .input('IdCliente', sql.Int, id)
            .query(`
                SELECT * FROM Vehiculos
                WHERE IdCliente = @IdCliente
                ORDER BY LOWER(Marca), LOWER(Modelo), IdVehiculo
            `);

        res.json({
            ...clienteResult.recordset[0],
            Vehiculos: vehiculosResult.recordset,
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const createCliente = async (req, res) => {
    const {
        NombreCompleto,
        Telefono,
        Email,
        Direccion,
        Notas,
        Vehiculos = [],
    } = req.body;

    if (!NombreCompleto || !Telefono) {
        return res
            .status(400)
            .json({ message: 'NombreCompleto y Telefono son obligatorios.' });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    const nombreNormalizado = normalizeTitle(NombreCompleto);
    try {
        await transaction.begin();

        const clienteResult = await new sql.Request(transaction)
            .input('NombreCompleto', sql.NVarChar, nombreNormalizado)
            .input('Telefono', sql.NVarChar, Telefono)
            .input('Email', sql.NVarChar, Email)
            .input('Direccion', sql.NVarChar, Direccion)
            .input('Notas', sql.NVarChar, Notas)
            .query(`
                INSERT INTO Clientes (NombreCompleto, Telefono, Email, Direccion, Notas)
                OUTPUT INSERTED.IdCliente
                VALUES (@NombreCompleto, @Telefono, @Email, @Direccion, @Notas)
            `);

        const idCliente = clienteResult.recordset[0].IdCliente;
        const createdVehicles = [];

        for (const v of Vehiculos) {
            const vehicleResult = await new sql.Request(transaction)
                .input('IdCliente', sql.Int, idCliente)
                .input('Placas', sql.NVarChar, String(v.Placas || '').trim())
                .input('VIN', sql.NVarChar, String(v.VIN || '').trim() || null)
                .input('Marca', sql.NVarChar, normalizeTitle(v.Marca))
                .input('Modelo', sql.NVarChar, normalizeTitle(v.Modelo))
                .input('Anio', sql.Int, v.Anio)
                .input('Color', sql.NVarChar, v.Color)
                .input('KilometrajeActual', sql.Int, v.KilometrajeActual)
                .query(`
                    INSERT INTO Vehiculos (IdCliente, Placas, VIN, Marca, Modelo, Anio, Color, KilometrajeActual)
                    OUTPUT INSERTED.IdVehiculo, INSERTED.Placas
                    VALUES (@IdCliente, @Placas, @VIN, @Marca, @Modelo, @Anio, @Color, @KilometrajeActual)
                `);
            createdVehicles.push(vehicleResult.recordset[0]);
        }

        await transaction.commit();

        // La cita de verificación se genera después del commit para no
        // mezclar la transacción del cliente con la de recordatorios.
        for (const vehicle of createdVehicles) {
            await ensureVerificationReminder(pool, vehicle);
        }

        res.status(201).json({
            message: '¡Cliente registrado con éxito en el taller!',
            IdCliente: idCliente,
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).send(error.message);
    }
};

const updateCliente = async (req, res) => {
    const { id } = req.params;
    const { NombreCompleto, Telefono, Email, Direccion, Notas, Estatus } = req.body;

    if (!NombreCompleto || !Telefono) {
        return res
            .status(400)
            .json({ message: 'NombreCompleto y Telefono son obligatorios.' });
    }

    const nombreNormalizado = normalizeTitle(NombreCompleto);
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdCliente', sql.Int, id)
            .input('NombreCompleto', sql.NVarChar, nombreNormalizado)
            .input('Telefono', sql.NVarChar, Telefono)
            .input('Email', sql.NVarChar, Email)
            .input('Direccion', sql.NVarChar, Direccion)
            .input('Notas', sql.NVarChar, Notas)
            .input('Estatus', sql.Bit, Estatus === false || Estatus === 0 ? 0 : 1)
            .query(`
                UPDATE Clientes
                SET NombreCompleto = @NombreCompleto,
                    Telefono = @Telefono,
                    Email = @Email,
                    Direccion = @Direccion,
                    Notas = @Notas,
                    Estatus = @Estatus
                WHERE IdCliente = @IdCliente
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        res.json({ message: 'Cliente actualizado.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Borra un cliente. Sus vehículos se van con él (FK ON DELETE CASCADE de
// Vehiculos -> Clientes). Antes de eso, borramos manualmente los tickets
// ABIERTOS ('In Progress') de esos vehículos — igual que al borrar un
// vehículo suelto — para que los tickets CERRADOS sí sobrevivan en el
// historial (se desvinculan solos, ON DELETE SET NULL, con su Snapshot).
const deleteCliente = async (req, res) => {
    const { id } = req.params;
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        await new sql.Request(transaction)
            .input('IdCliente', sql.Int, id)
            .query(`
                DELETE hs
                FROM HistorialServicios hs
                INNER JOIN Vehiculos v ON v.IdVehiculo = hs.IdVehiculo
                WHERE v.IdCliente = @IdCliente AND hs.Estatus = 'In Progress'
            `);

        const result = await new sql.Request(transaction)
            .input('IdCliente', sql.Int, id)
            .query('DELETE FROM Clientes WHERE IdCliente = @IdCliente');

        if (result.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        await transaction.commit();
        res.json({ message: 'Cliente eliminado.' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).send(error.message);
    }
};

module.exports = {
    getClientes,
    createCliente,
    getClienteById,
    updateCliente,
    deleteCliente,
};