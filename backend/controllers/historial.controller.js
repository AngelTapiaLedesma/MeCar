const { getConnection, sql } = require('../db');

const getHistorial = async (req, res) => {
    try {
        const pool = await getConnection();
        const serviciosResult = await pool.request().query(`
            SELECT
                s.*,
                v.Placas, v.Marca, v.Modelo, v.Anio,
                c.NombreCompleto AS ClienteNombre
            FROM HistorialServicios s
            LEFT JOIN Vehiculos v ON v.IdVehiculo = s.IdVehiculo
            LEFT JOIN Clientes c ON c.IdCliente = v.IdCliente
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

    const CostoPiezas = Items.reduce((sum, i) => sum + Number(i.Precio || 0), 0);
    const Titulo = Items.map((i) => i.Nombre).slice(0, 3).join(', ') || 'Servicio';

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const infoResult = await new sql.Request(transaction)
            .input('IdVehiculo', sql.Int, IdVehiculo)
            .query(`
                SELECT v.Marca, v.Modelo, v.Anio, v.Placas, c.NombreCompleto AS ClienteNombre
                FROM Vehiculos v
                INNER JOIN Clientes c ON c.IdCliente = v.IdCliente
                WHERE v.IdVehiculo = @IdVehiculo
            `);

        if (infoResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }

        const info = infoResult.recordset[0];
        const VehiculoSnapshot = `${info.Marca} ${info.Modelo} ${info.Anio} — ${info.Placas}`;
        const ClienteSnapshot = info.ClienteNombre;

        const servicioResult = await new sql.Request(transaction)
            .input('IdVehiculo', sql.Int, IdVehiculo)
            .input('Titulo', sql.NVarChar, Titulo)
            .input('Descripcion', sql.NVarChar, Notas || '')
            .input('CostoPiezas', sql.Decimal(10, 2), CostoPiezas)
            .input('CostoManoObra', sql.Decimal(10, 2), CostoManoObra)
            .input('MargenGanancia', sql.Decimal(10, 2), MargenGanancia)
            .input('Tecnico', sql.NVarChar, Tecnico)
            .input('FechaServicio', sql.DateTime, FechaServicio ? new Date(FechaServicio) : new Date())
            .input('VehiculoSnapshot', sql.NVarChar, VehiculoSnapshot)
            .input('ClienteSnapshot', sql.NVarChar, ClienteSnapshot)
            .query(`
                INSERT INTO HistorialServicios
                    (IdVehiculo, Titulo, Descripcion, CostoPiezas, CostoManoObra, MargenGanancia, Tecnico, FechaServicio, VehiculoSnapshot, ClienteSnapshot)
                OUTPUT INSERTED.IdServicio
                VALUES
                    (@IdVehiculo, @Titulo, @Descripcion, @CostoPiezas, @CostoManoObra, @MargenGanancia, @Tecnico, @FechaServicio, @VehiculoSnapshot, @ClienteSnapshot)
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

// Edita un ticket completo (datos + reemplaza todas sus líneas).
// Si el ticket ya está 'Closed', se rechaza — el candado se hace cumplir
// aquí en el servidor, no solo escondiendo botones en el frontend.
const updateTicket = async (req, res) => {
    const { id } = req.params;
    const {
        Tecnico,
        FechaServicio,
        Items = [],
        CostoManoObra = 0,
        MargenGanancia = 0,
        Notas,
        Estatus,
    } = req.body;

    if (Items.length === 0) {
        return res.status(400).json({ message: 'Debe haber al menos un item.' });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const currentResult = await new sql.Request(transaction)
            .input('IdServicio', sql.Int, id)
            .query('SELECT Estatus FROM HistorialServicios WHERE IdServicio = @IdServicio');

        if (currentResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Ticket no encontrado.' });
        }
        if (currentResult.recordset[0].Estatus === 'Closed') {
            await transaction.rollback();
            return res
                .status(423)
                .json({ message: 'Este ticket está cerrado y ya no se puede modificar.' });
        }

        const CostoPiezas = Items.reduce((sum, i) => sum + Number(i.Precio || 0), 0);
        const Titulo = Items.map((i) => i.Nombre).slice(0, 3).join(', ') || 'Servicio';
        const nuevoEstatus = Estatus === 'Closed' ? 'Closed' : 'In Progress';

        await new sql.Request(transaction)
            .input('IdServicio', sql.Int, id)
            .input('Tecnico', sql.NVarChar, Tecnico)
            .input('FechaServicio', sql.DateTime, FechaServicio ? new Date(FechaServicio) : new Date())
            .input('Titulo', sql.NVarChar, Titulo)
            .input('Descripcion', sql.NVarChar, Notas || '')
            .input('CostoPiezas', sql.Decimal(10, 2), CostoPiezas)
            .input('CostoManoObra', sql.Decimal(10, 2), CostoManoObra)
            .input('MargenGanancia', sql.Decimal(10, 2), MargenGanancia)
            .input('Estatus', sql.NVarChar, nuevoEstatus)
            .query(`
                UPDATE HistorialServicios
                SET Tecnico = @Tecnico,
                    FechaServicio = @FechaServicio,
                    Titulo = @Titulo,
                    Descripcion = @Descripcion,
                    CostoPiezas = @CostoPiezas,
                    CostoManoObra = @CostoManoObra,
                    MargenGanancia = @MargenGanancia,
                    Estatus = @Estatus
                WHERE IdServicio = @IdServicio
            `);

        // Reemplaza todas las líneas: se borran las viejas y se insertan las nuevas.
        await new sql.Request(transaction)
            .input('IdServicio', sql.Int, id)
            .query('DELETE FROM ServicioItems WHERE IdServicio = @IdServicio');

        for (const item of Items) {
            await new sql.Request(transaction)
                .input('IdServicio', sql.Int, id)
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
        res.json({ message: 'Ticket actualizado.' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).send(error.message);
    }
};

// Borra un ticket — solo si NO está cerrado.
const deleteTicket = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        const currentResult = await pool.request()
            .input('IdServicio', sql.Int, id)
            .query('SELECT Estatus FROM HistorialServicios WHERE IdServicio = @IdServicio');

        if (currentResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Ticket no encontrado.' });
        }
        if (currentResult.recordset[0].Estatus === 'Closed') {
            return res
                .status(423)
                .json({ message: 'Este ticket está cerrado y no se puede eliminar.' });
        }

        await pool.request()
            .input('IdServicio', sql.Int, id)
            .query('DELETE FROM HistorialServicios WHERE IdServicio = @IdServicio');

        res.json({ message: 'Ticket eliminado.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { getHistorial, createTicket, updateTicket, deleteTicket };