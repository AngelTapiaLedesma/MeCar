const { getConnection, sql } = require('../db');

const parseServiceDate = (val) => {
    if (!val) return new Date();
    const str = String(val).slice(0, 10);
    const parts = str.split('-');
    if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(val);
};

const MILEAGE_BELOW_CURRENT = 'El kilometraje insertado es menor al último, si desea ajustar el kilometraje debe hacerlo desde la pestaña del vehículo.';

function parseMileage(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    const mileage = Number(value);
    return Number.isInteger(mileage) && mileage >= 0 ? mileage : null;
}

const getHistorial = async (req, res) => {
    try {
        const pool = await getConnection();
        const serviciosResult = await pool.request().query(`
            SELECT
                s.*,
                v.Placas, v.Marca, v.Modelo, v.Anio, v.VIN, v.KilometrajeActual,
                c.NombreCompleto AS ClienteNombre
            FROM HistorialServicios s
            LEFT JOIN Vehiculos v ON v.IdVehiculo = s.IdVehiculo
            LEFT JOIN Clientes c ON c.IdCliente = v.IdCliente
            ORDER BY s.FechaServicio DESC, s.IdServicio DESC
        `);
        const itemsResult = await pool.request()
            .query('SELECT * FROM ServicioItems ORDER BY IdServicio, IdServicioItem');

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
        KilometrajeEnServicio,
        FechaServicio,
        Items = [],
        CostoManoObra = 0,
        CostoManoObraTaller = null,
        MargenGanancia = 0,
        Notas,
    } = req.body;

    const kilometraje = parseMileage(KilometrajeEnServicio);
    if (!IdVehiculo || Items.length === 0 || kilometraje == null) {
        return res
            .status(400)
            .json({ message: 'IdVehiculo, kilometraje y al menos un item son obligatorios.' });
    }

    const CostoPiezas = Items.reduce((sum, i) => sum + Number(i.Precio || 0), 0);
    const Titulo = Items.map((i) => i.Nombre).slice(0, 3).join(', ') || 'Servicio';

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Bloquea la fila del vehículo hasta el commit para que dos tickets
        // simultáneos no lean/regresen el mismo kilometraje.
        const infoResult = await new sql.Request(transaction)
            .input('IdVehiculo', sql.Int, IdVehiculo)
            .query(`
                SELECT v.Marca, v.Modelo, v.Anio, v.Placas, v.VIN, v.KilometrajeActual, c.NombreCompleto AS ClienteNombre
                FROM Vehiculos v WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN Clientes c ON c.IdCliente = v.IdCliente
                WHERE v.IdVehiculo = @IdVehiculo
            `);

        if (infoResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }

        const info = infoResult.recordset[0];
        if (info.KilometrajeActual != null && kilometraje < Number(info.KilometrajeActual)) {
            await transaction.rollback();
            return res.status(422).json({ message: MILEAGE_BELOW_CURRENT, code: 'MILEAGE_BELOW_CURRENT' });
        }
        const VehiculoSnapshot = `${info.Marca} ${info.Modelo} ${info.Anio} — ${info.Placas}`;
        const ClienteSnapshot = info.ClienteNombre;
        const VINSnapshot = info.VIN || null;

        const servicioResult = await new sql.Request(transaction)
            .input('IdVehiculo', sql.Int, IdVehiculo)
            .input('Titulo', sql.NVarChar, Titulo)
            .input('Descripcion', sql.NVarChar, Notas || '')
            .input('CostoPiezas', sql.Decimal(10, 2), CostoPiezas)
            .input('CostoManoObra', sql.Decimal(10, 2), CostoManoObra)
            .input('CostoManoObraTaller', sql.Decimal(10, 2), CostoManoObraTaller)
            .input('MargenGanancia', sql.Decimal(10, 2), MargenGanancia)
            .input('KilometrajeEnServicio', sql.Int, kilometraje)
            .input('FechaServicio', sql.DateTime, parseServiceDate(FechaServicio))
            .input('VehiculoSnapshot', sql.NVarChar, VehiculoSnapshot)
            .input('ClienteSnapshot', sql.NVarChar, ClienteSnapshot)
            .input('VINSnapshot', sql.NVarChar, VINSnapshot)
            .query(`
                INSERT INTO HistorialServicios
                    (IdVehiculo, Titulo, Descripcion, CostoPiezas, CostoManoObra, CostoManoObraTaller, MargenGanancia, KilometrajeEnServicio, FechaServicio, VehiculoSnapshot, ClienteSnapshot, VINSnapshot)
                OUTPUT INSERTED.IdServicio
                VALUES
                    (@IdVehiculo, @Titulo, @Descripcion, @CostoPiezas, @CostoManoObra, @CostoManoObraTaller, @MargenGanancia, @KilometrajeEnServicio, @FechaServicio, @VehiculoSnapshot, @ClienteSnapshot, @VINSnapshot)
            `);

        const idServicio = servicioResult.recordset[0].IdServicio;

        // Nunca regresa el kilometraje del vehículo: si otro ticket ya subió
        // el valor, esta condición simplemente no actualiza.
        await new sql.Request(transaction)
            .input('IdVehiculo', sql.Int, IdVehiculo)
            .input('KilometrajeActual', sql.Int, kilometraje)
            .query(`
                UPDATE Vehiculos
                SET KilometrajeActual = @KilometrajeActual
                WHERE IdVehiculo = @IdVehiculo
                  AND (KilometrajeActual IS NULL OR KilometrajeActual <= @KilometrajeActual)
            `);

        for (const item of Items) {
            await new sql.Request(transaction)
                .input('IdServicio', sql.Int, idServicio)
                .input('Nombre', sql.NVarChar, item.Nombre)
                .input('Precio', sql.Decimal(10, 2), item.Precio)
                .input('Costo', sql.Decimal(10, 2), item.Costo != null ? item.Costo : null)
                .input('Origen', sql.NVarChar, item.Origen || 'custom')
                .input('IdCatalogoItem', sql.Int, item.IdCatalogoItem || null)
                .query(`
                    INSERT INTO ServicioItems (IdServicio, Nombre, Precio, Costo, Origen, IdCatalogoItem)
                    VALUES (@IdServicio, @Nombre, @Precio, @Costo, @Origen, @IdCatalogoItem)
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
        KilometrajeEnServicio,
        FechaServicio,
        Items = [],
        CostoManoObra = 0,
        CostoManoObraTaller = null,
        MargenGanancia = 0,
        Notas,
        Estatus,
    } = req.body;

    const kilometraje = parseMileage(KilometrajeEnServicio);
    if (Items.length === 0 || kilometraje == null) {
        return res.status(400).json({ message: 'Debe haber al menos un item y kilometraje válido.' });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const currentResult = await new sql.Request(transaction)
            .input('IdServicio', sql.Int, id)
            .query(`
                SELECT IdVehiculo, Estatus, KilometrajeEnServicio
                FROM HistorialServicios WITH (UPDLOCK, HOLDLOCK)
                WHERE IdServicio = @IdServicio
            `);

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

        const existingMileage = currentResult.recordset[0].KilometrajeEnServicio;
        const mileageChanged = Number(existingMileage) !== kilometraje;
        if (mileageChanged) {
            const vehicleResult = await new sql.Request(transaction)
                .input('IdVehiculo', sql.Int, currentResult.recordset[0].IdVehiculo)
                .query(`
                    SELECT KilometrajeActual
                    FROM Vehiculos WITH (UPDLOCK, HOLDLOCK)
                    WHERE IdVehiculo = @IdVehiculo
                `);
            const currentMileage = vehicleResult.recordset[0]?.KilometrajeActual;
            if (currentMileage != null && kilometraje < Number(currentMileage)) {
                await transaction.rollback();
                return res.status(422).json({ message: MILEAGE_BELOW_CURRENT, code: 'MILEAGE_BELOW_CURRENT' });
            }
        }

        const CostoPiezas = Items.reduce((sum, i) => sum + Number(i.Precio || 0), 0);
        const Titulo = Items.map((i) => i.Nombre).slice(0, 3).join(', ') || 'Servicio';
        const nuevoEstatus = Estatus === 'Closed' ? 'Closed' : 'In Progress';

        await new sql.Request(transaction)
            .input('IdServicio', sql.Int, id)
            .input('KilometrajeEnServicio', sql.Int, kilometraje)
            .input('FechaServicio', sql.DateTime, parseServiceDate(FechaServicio))
            .input('Titulo', sql.NVarChar, Titulo)
            .input('Descripcion', sql.NVarChar, Notas || '')
            .input('CostoPiezas', sql.Decimal(10, 2), CostoPiezas)
            .input('CostoManoObra', sql.Decimal(10, 2), CostoManoObra)
            .input('CostoManoObraTaller', sql.Decimal(10, 2), CostoManoObraTaller)
            .input('MargenGanancia', sql.Decimal(10, 2), MargenGanancia)
            .input('Estatus', sql.NVarChar, nuevoEstatus)
            .query(`
                UPDATE HistorialServicios
                SET KilometrajeEnServicio = @KilometrajeEnServicio,
                    FechaServicio = @FechaServicio,
                    Titulo = @Titulo,
                    Descripcion = @Descripcion,
                    CostoPiezas = @CostoPiezas,
                    CostoManoObra = @CostoManoObra,
                    CostoManoObraTaller = @CostoManoObraTaller,
                    MargenGanancia = @MargenGanancia,
                    Estatus = @Estatus
                WHERE IdServicio = @IdServicio
            `);

        // Igual que al crear: el kilometraje del vehículo nunca retrocede.
        await new sql.Request(transaction)
            .input('IdVehiculo', sql.Int, currentResult.recordset[0].IdVehiculo)
            .input('KilometrajeActual', sql.Int, kilometraje)
            .query(`
                UPDATE Vehiculos
                SET KilometrajeActual = @KilometrajeActual
                WHERE IdVehiculo = @IdVehiculo
                  AND (KilometrajeActual IS NULL OR KilometrajeActual <= @KilometrajeActual)
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
                .input('Costo', sql.Decimal(10, 2), item.Costo != null ? item.Costo : null)
                .input('Origen', sql.NVarChar, item.Origen || 'custom')
                .input('IdCatalogoItem', sql.Int, item.IdCatalogoItem || null)
                .query(`
                    INSERT INTO ServicioItems (IdServicio, Nombre, Precio, Costo, Origen, IdCatalogoItem)
                    VALUES (@IdServicio, @Nombre, @Precio, @Costo, @Origen, @IdCatalogoItem)
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