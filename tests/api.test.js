const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

// Configuración del servidor de test
const TEST_PORT = 3001;
process.env.PORT = TEST_PORT;
process.env.NODE_ENV = 'test';

let server;

// Función helper para hacer requests HTTP
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsedBody = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, body: parsedBody });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Función para esperar un poco
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('API de Videojuegos', () => {
    before(async () => {
        try {
            // Limpiar cualquier servidor previo
            if (server) {
                server.close();
                await wait(100);
            }
            
            // Inicializar base de datos
            const { initDatabase } = require('../database/database');
            await initDatabase();
            
            // Configurar servidor Express
            const express = require('express');
            const cors = require('cors');
            const gamesRoutes = require('../routes/games');
            
            const app = express();
            app.use(cors());
            app.use(express.json());
            app.use('/api/games', gamesRoutes);
            
            // Iniciar servidor
            server = app.listen(TEST_PORT);
            
            // Esperar a que el servidor esté listo
            await new Promise((resolve, reject) => {
                server.on('listening', resolve);
                server.on('error', reject);
                setTimeout(() => reject(new Error('Timeout al iniciar servidor')), 5000);
            });
            
            // Esperar un poco más para asegurar que todo esté listo
            await wait(100);
            
        } catch (error) {
            console.error('Error en setup de tests:', error);
            throw error;
        }
    });
    
    after(async () => {
        if (server) {
            server.close();
            await wait(100);
        }
    });
    
    test('GET /api/games - debería obtener la lista de videojuegos', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: '/api/games',
            method: 'GET'
        });
        
        assert.strictEqual(response.status, 200);
        assert(response.body.games);
        assert(Array.isArray(response.body.games));
        assert(typeof response.body.total === 'number');
    });
    
    test('GET /api/games con filtro - debería filtrar por género', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: '/api/games?genre=Action',
            method: 'GET'
        });
        
        assert.strictEqual(response.status, 200);
        assert(response.body.games);
        assert(Array.isArray(response.body.games));
    });
    
    test('POST /api/games - debería crear un nuevo videojuego', async () => {
        const newGame = {
            title: 'Test Game ' + Date.now(),
            genre: 'Action',
            platform: 'PC',
            developer: 'Test Studio',
            price: 29.99,
            rating: 8.5,
            description: 'Un juego de prueba'
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: '/api/games',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, newGame);
        
        assert.strictEqual(response.status, 201);
        assert(response.body.message);
        assert(typeof response.body.id === 'number');
    });
    
    test('POST /api/games - debería fallar sin campos requeridos', async () => {
        const incompleteGame = {
            title: 'Incomplete Game'
            // Faltan genre y platform
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: '/api/games',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, incompleteGame);
        
        assert.strictEqual(response.status, 400);
        assert(response.body.error);
    });
    
    test('GET /api/games/:id - debería obtener un videojuego específico', async () => {
        // Primero crear un juego
        const newGame = {
            title: 'Specific Test Game ' + Date.now(),
            genre: 'RPG',
            platform: 'PlayStation 5'
        };
        
        const createResponse = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: '/api/games',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, newGame);
        
        assert.strictEqual(createResponse.status, 201);
        const gameId = createResponse.body.id;
        
        // Luego obtenerlo
        const getResponse = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: `/api/games/${gameId}`,
            method: 'GET'
        });
        
        assert.strictEqual(getResponse.status, 200);
        assert.strictEqual(getResponse.body.title, newGame.title);
        assert.strictEqual(getResponse.body.genre, newGame.genre);
    });
    
    test('GET /api/games/:id - debería retornar 404 para ID inexistente', async () => {
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: '/api/games/99999',
            method: 'GET'
        });
        
        assert.strictEqual(response.status, 404);
        assert(response.body.error);
    });
    
    test('PUT /api/games/:id - debería actualizar un videojuego existente', async () => {
        // Crear un juego
        const newGame = {
            title: 'Game to Update ' + Date.now(),
            genre: 'Strategy',
            platform: 'PC'
        };
        
        const createResponse = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: '/api/games',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, newGame);
        
        assert.strictEqual(createResponse.status, 201);
        const gameId = createResponse.body.id;
        
        // Actualizarlo
        const updatedGame = {
            ...newGame,
            title: 'Updated Game Title ' + Date.now(),
            price: 39.99
        };
        
        const updateResponse = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: `/api/games/${gameId}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        }, updatedGame);
        
        assert.strictEqual(updateResponse.status, 200);
        assert(updateResponse.body.message);
    });
    
    test('DELETE /api/games/:id - debería eliminar un videojuego existente', async () => {
        // Crear un juego
        const newGame = {
            title: 'Game to Delete ' + Date.now(),
            genre: 'Puzzle',
            platform: 'Mobile'
        };
        
        const createResponse = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: '/api/games',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, newGame);
        
        assert.strictEqual(createResponse.status, 201);
        const gameId = createResponse.body.id;
        
        // Eliminarlo
        const deleteResponse = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: `/api/games/${gameId}`,
            method: 'DELETE'
        });
        
        assert.strictEqual(deleteResponse.status, 200);
        assert(deleteResponse.body.message);
        
        // Verificar que ya no existe
        const getResponse = await makeRequest({
            hostname: 'localhost',
            port: TEST_PORT,
            path: `/api/games/${gameId}`,
            method: 'GET'
        });
        
        assert.strictEqual(getResponse.status, 404);
    });
});