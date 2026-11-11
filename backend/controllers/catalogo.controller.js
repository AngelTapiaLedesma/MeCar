const { getConnection, sql } = require('../db');
const { normalizeTitle } = require('../utils/text');

// Trae el catálogo completo: cada sección con sus items anidados
const getCatalogo = async (req, res) => {
    try {
        const pool = await getConnection();
        const seccionesResult = await pool.request()
            .query('SELECT * FROM CatalogoSecciones ORDER BY LOWER(Nombre), IdSeccion');
        const itemsResult = await pool.request()
            .query('SELECT * FROM CatalogoItems ORDER BY LOWER(Nombre), IdItem');

        const secciones = seccionesResult.recordset.map((s) => ({
            ...s,
            Items: itemsResult.recordset.filter((i) => i.IdSeccion === s.IdSeccion),
        }));

        res.json(secciones);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const createSeccion = async (req, res) => {
    const Nombre = normalizeTitle(req.body.Nombre);
    if (!Nombre) {
        return res.status(400).json({ message: 'Nombre es obligatorio.' });
    }
    try {
        const pool = await getConnection();
        const maxOrden = await pool.request()
            .query('SELECT ISNULL(MAX(Orden), 0) AS MaxOrden FROM CatalogoSecciones');
        const result = await pool.request()
            .input('Nombre', sql.NVarChar, Nombre.trim())
            .input('Orden', sql.Int, maxOrden.recordset[0].MaxOrden + 1)
            .query(`
                INSERT INTO CatalogoSecciones (Nombre, Orden)
                OUTPUT INSERTED.IdSeccion
                VALUES (@Nombre, @Orden)
            `);
        res.status(201).json({ IdSeccion: result.recordset[0].IdSeccion });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Borrar una sección borra en cascada sus items (FK ON DELETE CASCADE)
const deleteSeccion = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('IdSeccion', sql.Int, id)
            .query('DELETE FROM CatalogoSecciones WHERE IdSeccion = @IdSeccion');
        res.json({ message: 'Sección eliminada.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateSeccion = async (req, res) => {
    const { id } = req.params;
    const Nombre = normalizeTitle(req.body.Nombre);
    if (!Nombre) {
        return res.status(400).json({ message: 'Nombre es obligatorio.' });
    }
    try {
        const pool = await getConnection();
        await pool.request()
            .input('IdSeccion', sql.Int, id)
            .input('Nombre', sql.NVarChar, Nombre)
            .query(`
                UPDATE CatalogoSecciones
                SET Nombre = @Nombre
                WHERE IdSeccion = @IdSeccion
            `);
        res.json({ message: 'Sección actualizada.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const createItem = async (req, res) => {
    const { IdSeccion, PrecioBase, CostoBase } = req.body;
    const Nombre = normalizeTitle(req.body.Nombre);
    if (!IdSeccion || !Nombre) {
        return res.status(400).json({ message: 'IdSeccion y Nombre son obligatorios.' });
    }
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdSeccion', sql.Int, IdSeccion)
            .input('Nombre', sql.NVarChar, Nombre)
            .input('PrecioBase', sql.Decimal(10, 2), PrecioBase || 0)
            .input('CostoBase', sql.Decimal(10, 2), CostoBase || 0)
            .query(`
                INSERT INTO CatalogoItems (IdSeccion, Nombre, PrecioBase, CostoBase)
                OUTPUT INSERTED.IdItem
                VALUES (@IdSeccion, @Nombre, @PrecioBase, @CostoBase)
            `);
        res.status(201).json({ IdItem: result.recordset[0].IdItem });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Actualiza el nombre/precio/costo de REFERENCIA en el catálogo.
// OJO: esto nunca toca los tickets ya creados — cada ticket ya tiene su
// propia copia del precio guardada en ServicioItems.
const updateItem = async (req, res) => {
    const { id } = req.params;
    const { PrecioBase, CostoBase } = req.body;
    const Nombre = normalizeTitle(req.body.Nombre);
    if (!Nombre) return res.status(400).json({ message: 'Nombre es obligatorio.' });
    try {
        const pool = await getConnection();
        await pool.request()
            .input('IdItem', sql.Int, id)
            .input('Nombre', sql.NVarChar, Nombre)
            .input('PrecioBase', sql.Decimal(10, 2), PrecioBase)
            .input('CostoBase', sql.Decimal(10, 2), CostoBase || 0)
            .query(`
                UPDATE CatalogoItems
                SET Nombre = @Nombre, PrecioBase = @PrecioBase, CostoBase = @CostoBase
                WHERE IdItem = @IdItem
            `);
        res.json({ message: 'Item actualizado.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('IdItem', sql.Int, id)
            .query('DELETE FROM CatalogoItems WHERE IdItem = @IdItem');
        res.json({ message: 'Item eliminado.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    getCatalogo,
    createSeccion,
    deleteSeccion,
    updateSeccion,
    createItem,
    updateItem,
    deleteItem,
};