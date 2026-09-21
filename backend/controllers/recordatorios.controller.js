const { getConnection, sql } = require('../db');

const getRecordatoriosByVehiculo = async (req, res) => {
    const { idVehiculo } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdVehiculo', sql.Int, idVehiculo)
            .query('SELECT * FROM Recordatorios WHERE IdVehiculo = @IdVehiculo ORDER BY FechaInicio');
        res.json(result.recordset);
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
    } = req.body;

    if (!IdVehiculo || !TipoRecordatorio || !FechaInicio) {
        return res
            .status(400)
            .json({ message: 'IdVehiculo, TipoRecordatorio y FechaInicio son obligatorios.' });
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
            .query(`
                INSERT INTO Recordatorios (IdVehiculo, TipoRecordatorio, FechaInicio, EsRecurrente, IntervaloDias, Notificar)
                OUTPUT INSERTED.IdRecordatorio
                VALUES (@IdVehiculo, @TipoRecordatorio, @FechaInicio, @EsRecurrente, @IntervaloDias, @Notificar)
            `);
        res.status(201).json({ IdRecordatorio: result.recordset[0].IdRecordatorio });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateRecordatorio = async (req, res) => {
    const { id } = req.params;
    const { TipoRecordatorio, FechaInicio, EsRecurrente, IntervaloDias, Notificar } = req.body;

    if (!TipoRecordatorio || !FechaInicio) {
        return res
            .status(400)
            .json({ message: 'TipoRecordatorio y FechaInicio son obligatorios.' });
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
            .query(`
                UPDATE Recordatorios
                SET TipoRecordatorio = @TipoRecordatorio,
                    FechaInicio = @FechaInicio,
                    EsRecurrente = @EsRecurrente,
                    IntervaloDias = @IntervaloDias,
                    Notificar = @Notificar
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
    getRecordatoriosByVehiculo,
    createRecordatorio,
    updateRecordatorio,
    deleteRecordatorio,
};