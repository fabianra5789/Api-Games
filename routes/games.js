const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

// Agregar al inicio del archivo, después de las importaciones
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// GET /api/games - Obtener todos los videojuegos
router.get('/', (req, res) => {
  const { genre, platform, limit = 10, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM games WHERE 1=1';
  const params = [];
  
  if (genre) {
    query += ' AND genre LIKE ?';
    params.push(`%${genre}%`);
  }
  
  if (platform) {
    query += ' AND platform LIKE ?';
    params.push(`%${platform}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Error al obtener videojuegos', detail: err.message });
    } else {
      res.json({
        games: rows,
        total: rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }
  });
});

// GET /api/games/:id - Obtener un videojuego por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM games WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Error al obtener videojuego', detail: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Videojuego no encontrado' });
    } else {
      res.json(row);
    }
  });
});

// POST /api/games - Crear un nuevo videojuego
router.post('/', (req, res) => {
  const {
    title,
    genre,
    platform,
    developer,
    release_date,
    price,
    description,
    image_url,
    rating
  } = req.body;
  
  // Validaciones básicas
  if (!title || !genre || !platform) {
    return res.status(400).json({
      error: 'Campos requeridos faltantes',
      required: ['title', 'genre', 'platform']
    });
  }
  
  const query = `
    INSERT INTO games 
    (title, genre, platform, developer, release_date, price, description, image_url, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    title,
    genre,
    platform,
    developer,
    release_date,
    price,
    description,
    image_url,
    rating
  ], function(err) {
    if (err) {
      res.status(500).json({ error: 'Error al crear videojuego', detail: err.message });
    } else {
      res.status(201).json({
        message: 'Videojuego creado exitosamente',
        id: this.lastID
      });
    }
  });
});

// PUT /api/games/:id - Actualizar un videojuego
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    genre,
    platform,
    developer,
    release_date,
    price,
    description,
    image_url,
    rating
  } = req.body;
  
  const query = `
    UPDATE games SET
    title = ?, genre = ?, platform = ?, developer = ?,
    release_date = ?, price = ?, description = ?, image_url = ?,
    rating = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [
    title,
    genre,
    platform,
    developer,
    release_date,
    price,
    description,
    image_url,
    rating,
    id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: 'Error al actualizar videojuego', detail: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Videojuego no encontrado' });
    } else {
      res.json({ message: 'Videojuego actualizado exitosamente' });
    }
  });
});

// DELETE /api/games/:id - Eliminar un videojuego
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM games WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: 'Error al eliminar videojuego', detail: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Videojuego no encontrado' });
    } else {
      res.json({ message: 'Videojuego eliminado exitosamente' });
    }
  });
});

module.exports = router;