const { getConnection, sql } = require('../db');

// Obtener todas las categorías
const getAllCategorias = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT IdCategoria, Nombre, ColorClase, FechaCreacion
            FROM Categorias
            ORDER BY Nombre
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Crear nueva categoría
const createCategoria = async (req, res) => {
    const { Nombre, ColorClase } = req.body;

    if (!Nombre || !ColorClase) {
        return res.status(400).json({ message: 'Nombre y ColorClase son obligatorios.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('Nombre', sql.NVarChar(50), Nombre)
            .input('ColorClase', sql.NVarChar(100), ColorClase)
            .query(`
                INSERT INTO Categorias (Nombre, ColorClase)
                OUTPUT INSERTED.IdCategoria, INSERTED.Nombre, INSERTED.ColorClase
                VALUES (@Nombre, @ColorClase)
            `);
        res.status(201).json(result.recordset[0]);
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return res.status(400).json({ message: 'Ya existe una categoría con ese nombre.' });
        }
        res.status(500).send(error.message);
    }
};

// Actualizar categoría
const updateCategoria = async (req, res) => {
    const { id } = req.params;
    const { Nombre, ColorClase } = req.body;

    if (!Nombre || !ColorClase) {
        return res.status(400).json({ message: 'Nombre y ColorClase son obligatorios.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdCategoria', sql.Int, id)
            .input('Nombre', sql.NVarChar(50), Nombre)
            .input('ColorClase', sql.NVarChar(100), ColorClase)
            .query(`
                UPDATE Categorias
                SET Nombre = @Nombre, ColorClase = @ColorClase
                WHERE IdCategoria = @IdCategoria
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }

        res.json({ message: 'Categoría actualizada exitosamente.' });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return res.status(400).json({ message: 'Ya existe una categoría con ese nombre.' });
        }
        res.status(500).send(error.message);
    }
};

// Eliminar categoría (solo si no tiene recordatorios asociados)
const deleteCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();

        // Verificar si hay recordatorios asociados
        const checkResult = await pool.request()
            .input('IdCategoria', sql.Int, id)
            .query(`
                SELECT COUNT(*) as Count
                FROM Recordatorios
                WHERE IdCategoria = @IdCategoria
            `);

        if (checkResult.recordset[0].Count > 0) {
            return res.status(400).json({
                message: 'No se puede eliminar la categoría porque tiene recordatorios asociados.'
            });
        }

        const result = await pool.request()
            .input('IdCategoria', sql.Int, id)
            .query('DELETE FROM Categorias WHERE IdCategoria = @IdCategoria');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }

        res.json({ message: 'Categoría eliminada exitosamente.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    getAllCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
};
