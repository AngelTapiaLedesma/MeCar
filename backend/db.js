require('dotenv').config();
const sql = require('mssql');

const dbSettings = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, // Falso porque estamos en local con Docker
        trustServerCertificate: true // Evita errores de certificados SSL locales
    }
};

const getConnection = async () => {
    try {
        const pool = await sql.connect(dbSettings);
        return pool;
    } catch (error) {
        console.error('Error fatal conectando a la base de datos:', error);
    }
};

module.exports = { sql, getConnection };