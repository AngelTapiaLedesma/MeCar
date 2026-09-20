const { getConnection, sql } = require('../db');

// Trae todos los clientes junto con sus vehículos (para la tabla de Clients)
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

// Trae un solo cliente con sus vehículos (para la pantalla de detalle)
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

// Crea un cliente y, si vienen, sus vehículos — todo en una sola transacción
// (si falla el vehículo, no se queda el cliente huérfano a medias)
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

module.exports = { getClientes, createCliente, getClienteById };