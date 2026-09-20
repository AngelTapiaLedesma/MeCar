const express = require('express');
const cors = require('cors');
const { getConnection } = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares: Para que la API entienda JSON y acepte peticiones de tu futuro frontend
app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/', (req, res) => {
    res.send('API del Gestor Mecánico funcionando al 100% 🚗🔧');
});

// Rutas
app.use(require('./routes/clientes.routes'));
app.use(require('./routes/vehiculos.routes'));
app.use(require('./routes/historial.routes'));
app.use(require('./routes/recordatorios.routes'));
app.use(require('./routes/catalogo.routes')); // NUEVO: catálogo de servicios

// Levantar el servidor y comprobar la base de datos
app.listen(port, async () => {
    console.log(`[Servidor] Corriendo en http://localhost:${port}`);

    const db = await getConnection();
    if (db) {
        console.log('[Base de Datos] ¡Conexión a SQL Server exitosa! 🚀');
    }
});