const { getConnection, sql } = require('../db');
const { getVerificationData } = require('../utils/verification');

// Genera (si hace falta) la próxima cita de verificación de un vehículo.
// Es idempotente: la clave única por vehículo/periodo y la verificación de
// recordatorios ya existentes evitan duplicados aunque se llame varias veces.
async function ensureVerificationReminder(pool, vehicle, options = {}) {
    const data = getVerificationData(vehicle.Placas, options.referenceDate);
    if (!data) return { created: false, reason: 'plate', data: null };

    const category = await pool.request()
        .input('Nombre', sql.NVarChar, 'Verificación')
        .query('SELECT TOP 1 IdCategoria FROM Categorias WHERE Nombre = @Nombre');
    if (!category.recordset.length) {
        return { created: false, reason: 'category', data };
    }

    const key = `VERIFICACION-${vehicle.IdVehiculo}-${data.periodKey}`;

    // Mantiene una sola cita automática pendiente: descarta las generadas para
    // periodos anteriores o para una placa anterior, sin tocar las manuales.
    await pool.request()
        .input('IdVehiculo', sql.Int, vehicle.IdVehiculo)
        .input('ClaveAutomatica', sql.NVarChar, key)
        .query(`
            DELETE FROM Recordatorios
            WHERE IdVehiculo = @IdVehiculo
              AND EsAutomatico = 1
              AND (ClaveAutomatica IS NULL OR ClaveAutomatica <> @ClaveAutomatica)
        `);

    // Solo respeta citas manuales que aún no hayan vencido: si la única cita
    // en la ventana ya pasó, el vehículo necesita su nueva verificación.
    const result = await pool.request()
        .input('IdVehiculo', sql.Int, vehicle.IdVehiculo)
        .input('TipoRecordatorio', sql.NVarChar, 'Verificación')
        .input('FechaInicio', sql.Date, data.dueDate)
        .input('IdCategoria', sql.Int, category.recordset[0].IdCategoria)
        .input('ClaveAutomatica', sql.NVarChar, key)
        .input('WindowStart', sql.Date, data.windowStart)
        .input('WindowEnd', sql.Date, data.windowEnd)
        .input('AutoKeyPrefix', sql.NVarChar, `VERIFICACION-${vehicle.IdVehiculo}-%`)
        .input('ReferenceDate', sql.Date, data.dueDate)
        .query(`
            INSERT INTO Recordatorios
                (IdVehiculo, TipoRecordatorio, FechaInicio, EsRecurrente, IntervaloDias, Notificar, IdCategoria, EsAutomatico, ClaveAutomatica)
            OUTPUT INSERTED.IdRecordatorio
            SELECT
                @IdVehiculo, @TipoRecordatorio, @FechaInicio, 0, NULL, 1, @IdCategoria, 1, @ClaveAutomatica
            WHERE NOT EXISTS (
                SELECT 1
                FROM Recordatorios WITH (UPDLOCK, HOLDLOCK)
                WHERE ClaveAutomatica = @ClaveAutomatica
            )
            AND NOT EXISTS (
                SELECT 1
                FROM Recordatorios r WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN Categorias c ON c.IdCategoria = r.IdCategoria
                WHERE r.IdVehiculo = @IdVehiculo
                  AND c.Nombre = 'Verificación'
                  AND r.FechaInicio BETWEEN @WindowStart AND @WindowEnd
                  AND r.FechaInicio >= @ReferenceDate
                  AND (r.EsAutomatico = 0 OR r.ClaveAutomatica LIKE @AutoKeyPrefix)
            )
        `);

    return {
        created: result.recordset.length > 0,
        reminder: result.recordset[0] || null,
        data,
    };
}

const getAllRecordatorios = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT
                r.*,
                v.Placas, v.Marca, v.Modelo, v.Anio, v.VIN,
                c.NombreCompleto AS ClienteNombre,
                cat.Nombre AS CategoriaNombre,
                cat.ColorClase AS CategoriaColor
            FROM Recordatorios r
            INNER JOIN Vehiculos v ON v.IdVehiculo = r.IdVehiculo
            INNER JOIN Clientes c ON c.IdCliente = v.IdCliente
            INNER JOIN Categorias cat ON cat.IdCategoria = r.IdCategoria
            ORDER BY r.FechaInicio ASC, r.IdRecordatorio ASC
        `);
        res.json(result.recordset.map((reminder) => {
            const verification = getVerificationData(reminder.Placas);
            return {
                ...reminder,
                DatosVerificacion: verification,
                ColorPlaca: verification?.color || null,
                DiaNoCircula: verification?.noCircula || null,
            };
        }));
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getRecordatoriosByVehiculo = async (req, res) => {
    const { idVehiculo } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdVehiculo', sql.Int, idVehiculo)
            .query(`
                SELECT
                    r.*,
                    v.Placas,
                    cat.Nombre AS CategoriaNombre,
                    cat.ColorClase AS CategoriaColor
                FROM Recordatorios r
                INNER JOIN Vehiculos v ON v.IdVehiculo = r.IdVehiculo
                INNER JOIN Categorias cat ON cat.IdCategoria = r.IdCategoria
                WHERE r.IdVehiculo = @IdVehiculo
                ORDER BY r.FechaInicio, r.IdRecordatorio
            `);
        res.json(result.recordset.map((reminder) => {
            const verification = getVerificationData(reminder.Placas);
            return {
                ...reminder,
                DatosVerificacion: verification,
                ColorPlaca: verification?.color || null,
                DiaNoCircula: verification?.noCircula || null,
            };
        }));
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Recorre todos los vehículos y crea las citas de verificación que falten.
// Se usa para poner al día los vehículos que ya existían antes de esta función.
const syncVerificationReminders = async (req, res) => {
    try {
        const pool = await getConnection();
        const vehicles = await pool.request().query('SELECT IdVehiculo, Placas FROM Vehiculos');
        let created = 0;

        for (const vehicle of vehicles.recordset) {
            try {
                const result = await ensureVerificationReminder(pool, vehicle);
                if (result.created) created += 1;
            } catch (error) {
                console.error(
                    `No se pudo generar la verificación del vehículo ${vehicle.IdVehiculo}:`,
                    error.message
                );
            }
        }

        res.json({
            message: 'Verificaciones sincronizadas.',
            processed: vehicles.recordset.length,
            created,
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const createRecordatorio = async (req, res) => {
    const {
        IdVehiculo,
        TipoRecordatorio,
        FechaInicio,
        EsRecurrente,
        IntervaloDias,
        Notificar,
        IdCategoria,
    } = req.body;

    if (!IdVehiculo || !TipoRecordatorio || !FechaInicio || !IdCategoria) {
        return res
            .status(400)
            .json({ message: 'IdVehiculo, TipoRecordatorio, FechaInicio e IdCategoria son obligatorios.' });
    }
    if (EsRecurrente && !IntervaloDias) {
        return res
            .status(400)
            .json({ message: 'IntervaloDias es obligatorio para eventos recurrentes.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdVehiculo', sql.Int, IdVehiculo)
            .input('TipoRecordatorio', sql.NVarChar, TipoRecordatorio)
            .input('FechaInicio', sql.Date, FechaInicio)
            .input('EsRecurrente', sql.Bit, EsRecurrente ? 1 : 0)
            .input('IntervaloDias', sql.Int, EsRecurrente ? IntervaloDias : null)
            .input('Notificar', sql.Bit, Notificar === false ? 0 : 1)
            .input('IdCategoria', sql.Int, IdCategoria)
            .query(`
                INSERT INTO Recordatorios (IdVehiculo, TipoRecordatorio, FechaInicio, EsRecurrente, IntervaloDias, Notificar, IdCategoria, EsAutomatico, ClaveAutomatica)
                OUTPUT INSERTED.IdRecordatorio
                VALUES (@IdVehiculo, @TipoRecordatorio, @FechaInicio, @EsRecurrente, @IntervaloDias, @Notificar, @IdCategoria, 0, NULL)
            `);
        res.status(201).json({ IdRecordatorio: result.recordset[0].IdRecordatorio });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateRecordatorio = async (req, res) => {
    const { id } = req.params;
    const { TipoRecordatorio, FechaInicio, EsRecurrente, IntervaloDias, Notificar, IdCategoria } = req.body;

    if (!TipoRecordatorio || !FechaInicio || !IdCategoria) {
        return res
            .status(400)
            .json({ message: 'TipoRecordatorio, FechaInicio e IdCategoria son obligatorios.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdRecordatorio', sql.Int, id)
            .input('TipoRecordatorio', sql.NVarChar, TipoRecordatorio)
            .input('FechaInicio', sql.Date, FechaInicio)
            .input('EsRecurrente', sql.Bit, EsRecurrente ? 1 : 0)
            .input('IntervaloDias', sql.Int, EsRecurrente ? IntervaloDias : null)
            .input('Notificar', sql.Bit, Notificar === false ? 0 : 1)
            .input('IdCategoria', sql.Int, IdCategoria)
            .query(`
                UPDATE Recordatorios
                SET TipoRecordatorio = @TipoRecordatorio,
                    FechaInicio = @FechaInicio,
                    EsRecurrente = @EsRecurrente,
                    IntervaloDias = @IntervaloDias,
                    Notificar = @Notificar,
                    IdCategoria = @IdCategoria
                WHERE IdRecordatorio = @IdRecordatorio
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Recordatorio no encontrado.' });
        }

        res.json({ message: 'Recordatorio actualizado.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const deleteRecordatorio = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdRecordatorio', sql.Int, id)
            .query('DELETE FROM Recordatorios WHERE IdRecordatorio = @IdRecordatorio');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Recordatorio no encontrado.' });
        }

        res.json({ message: 'Recordatorio eliminado.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    ensureVerificationReminder,
    syncVerificationReminders,
    getAllRecordatorios,
    getRecordatoriosByVehiculo,
    createRecordatorio,
    updateRecordatorio,
    deleteRecordatorio,
};
