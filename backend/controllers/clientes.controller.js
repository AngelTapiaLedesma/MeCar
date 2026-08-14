const { getConnection, sql } = require('../db');

// Función que ya tenías
const getClientes = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Clientes');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// NUEVA FUNCIÓN: Para crear un cliente
const createCliente = async (req, res) => {
    // Extraemos los datos que nos mandará el frontend (o Thunder Client)
    const { NombreCompleto, Telefono, Email, Notas } = req.body;
    
    try {
        const pool = await getConnection();
        
        // Usamos .input() para proteger la base de datos de inyecciones SQL
        await pool.request()
            .input('NombreCompleto', sql.NVarChar, NombreCompleto)
            .input('Telefono', sql.NVarChar, Telefono)
            .input('Email', sql.NVarChar, Email)
            .input('Notas', sql.NVarChar, Notas)
            .query('INSERT INTO Clientes (NombreCompleto, Telefono, Email, Notas) VALUES (@NombreCompleto, @Telefono, @Email, @Notas)');
            
        res.status(201).json({ message: '¡Cliente registrado con éxito en el taller!' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { getClientes, createCliente };