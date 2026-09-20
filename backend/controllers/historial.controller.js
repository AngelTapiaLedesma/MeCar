const { getConnection, sql } = require('../db');

const getHistorial = async (req, res) => {
    try {
        const pool = await getConnection();
        const serviciosResult = await pool.request().query(`
            SELECT s.*, v.Placas, v.Marca, v.Modelo, v.Anio, c.NombreCompleto AS ClienteNombre
            FROM HistorialServicios s
            INNER JOIN Vehiculos v ON v.IdVehiculo = s.IdVehiculo
            INNER JOIN Clientes c ON c.IdCliente = v.IdCliente
            ORDER BY s.FechaServicio DESC
        `);
        const itemsResult = await pool.request().query('SELECT * FROM ServicioItems');

        const historial = serviciosResult.recordset.map((s) => ({
            ...s,
            Items: itemsResult.recordset.filter((i) => i.IdServicio === s.IdServicio),
        }));

        res.json(historial);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Crea un ticket de reparación completo: el registro en HistorialServicios
// + cada línea (catálogo o custom) en ServicioItems, todo en una transacción.
const createTicket = async (req, res) => {
    const {
        IdVehiculo,
        Tecnico,
        FechaServicio,
        Items = [],
        CostoManoObra = 0,
        MargenGanancia = 0,
        Notas,
    } = req.body;

    if (!IdVehiculo || Items.length === 0) {
        return res
            .status(400)
            .json({ message: 'IdVehiculo y al menos un item son obligatorios.' });
    }

    // El costo de piezas SIEMPRE se calcula del lado del servidor, sumando
    // las líneas reales — nunca confiamos en un total que mande el cliente.
    const CostoPiezas = Items.reduce((sum, i) => sum + Number(i.Precio || 0), 0);
    const Titulo = Items.map((i) => i.Nombre).slice(0, 3).join(', ') || 'Servicio';

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const servicioResult = await new sql.Request(transaction)
            .input('IdVehiculo', sql.Int, IdVehiculo)
            .input('Titulo', sql.NVarChar, Titulo)
            .input('Descripcion', sql.NVarChar, Notas || '')
            .input('CostoPiezas', sql.Decimal(10, 2), CostoPiezas)
            .input('CostoManoObra', sql.Decimal(10, 2), CostoManoObra)
            .input('MargenGanancia', sql.Decimal(10, 2), MargenGanancia)
            .input('Tecnico', sql.NVarChar, Tecnico)
            .input('FechaServicio', sql.DateTime, FechaServicio ? new Date(FechaServicio) : new Date())
            .query(`
                INSERT INTO HistorialServicios
                    (IdVehiculo, Titulo, Descripcion, CostoPiezas, CostoManoObra, MargenGanancia, Tecnico, FechaServicio)
                OUTPUT INSERTED.IdServicio
                VALUES
                    (@IdVehiculo, @Titulo, @Descripcion, @CostoPiezas, @CostoManoObra, @MargenGanancia, @Tecnico, @FechaServicio)
            `);

        const idServicio = servicioResult.recordset[0].IdServicio;

        for (const item of Items) {
            await new sql.Request(transaction)
                .input('IdServicio', sql.Int, idServicio)
                .input('Nombre', sql.NVarChar, item.Nombre)
                .input('Precio', sql.Decimal(10, 2), item.Precio)
                .input('Origen', sql.NVarChar, item.Origen || 'custom')
                .input('IdCatalogoItem', sql.Int, item.IdCatalogoItem || null)
                .query(`
                    INSERT INTO ServicioItems (IdServicio, Nombre, Precio, Origen, IdCatalogoItem)
                    VALUES (@IdServicio, @Nombre, @Precio, @Origen, @IdCatalogoItem)
                `);
        }

        await transaction.commit();
        res.status(201).json({ message: 'Ticket creado.', IdServicio: idServicio });
    } catch (error) {
        await transaction.rollback();
        res.status(500).send(error.message);
    }
};

module.exports = { getHistorial, createTicket };