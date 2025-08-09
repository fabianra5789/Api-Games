const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const gamesRoutes = require('./routes/games');
const { initDatabase } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para Vercel
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api/games', gamesRoutes);

// Ruta de bienvenida
app.get('/api', (req, res) => {
  res.json({
    mensaje: 'GameHub API - Gestión de Videojuegos',
    version: '1.0.0',
    desarrollador: 'Eric Ramirez (Eric.Raw)',
    endpoints: {
      games: '/api/games',
      frontend: '/'
    },
    status: 'online'
  });
});

// Ruta para servir el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    mensaje: 'La ruta solicitada no existe'
  });
});

// Función para inicializar la aplicación
async function startApp() {
  try {
    await initDatabase();
    console.log('✅ Base de datos inicializada');
    
    // Solo iniciar servidor si no estamos en Vercel
    if (process.env.NODE_ENV !== 'production') {
      const server = app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`🎮 API disponible en http://localhost:${PORT}/api/games`);
        console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
      });
      
      // Exportar para tests
      if (require.main !== module) {
        module.exports = { app, server };
      }
    }
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    process.exit(1);
  }
}

// Inicializar aplicación
startApp();

// Exportar app para Vercel
module.exports = app;

// Manejo de señales para cerrar el servidor correctamente
process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});