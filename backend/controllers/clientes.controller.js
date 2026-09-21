const { getConnection, sql } = require('../db');

const getClientes = async (req, res) => {
    try {
        const pool = await getConnection();
        const clientesResult = await pool.request()
            .query('SELECT * FROM Clientes ORDER BY FechaRegistro DESC');
        const vehiculosResult = await pool.request()
            .query('SELECT * FROM Vehiculos');

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
            .query('SELECT * FROM Vehiculos WHERE IdCliente = @IdCliente');

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

    try {
        await transaction.begin();

        const clienteResult = await new sql.Request(transaction)
            .input('NombreCompleto', sql.NVarChar, NombreCompleto)
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

        for (const v of Vehiculos) {
            await new sql.Request(transaction)
                .input('IdCliente', sql.Int, idCliente)
                .input('Placas', sql.NVarChar, v.Placas)
                .input('Marca', sql.NVarChar, v.Marca)
                .input('Modelo', sql.NVarChar, v.Modelo)
                .input('Anio', sql.Int, v.Anio)
                .input('Color', sql.NVarChar, v.Color)
                .input('KilometrajeActual', sql.Int, v.KilometrajeActual)
                .query(`
                    INSERT INTO Vehiculos (IdCliente, Placas, Marca, Modelo, Anio, Color, KilometrajeActual)
                    VALUES (@IdCliente, @Placas, @Marca, @Modelo, @Anio, @Color, @KilometrajeActual)
                `);
        }

        await transaction.commit();
        res.status(201).json({
            message: '¡Cliente registrado con éxito en el taller!',
            IdCliente: idCliente,
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).send(error.message);
    }
};

// NUEVO: actualiza los datos del cliente (no toca sus vehículos, esos se
// editan aparte desde la sección de Vehicles).
const updateCliente = async (req, res) => {
    const { id } = req.params;
    const { NombreCompleto, Telefono, Email, Direccion, Notas, Estatus } = req.body;

    if (!NombreCompleto || !Telefono) {
        return res
            .status(400)
            .json({ message: 'NombreCompleto y Telefono son obligatorios.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdCliente', sql.Int, id)
            .input('NombreCompleto', sql.NVarChar, NombreCompleto)
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

module.exports = { getClientes, createCliente, getClienteById, updateCliente };