const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

// GET /api/videojuegos - Obtener todos los videojuegos
router.get('/', (req, res) => {
  const { genero, plataforma, limit = 10, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM videojuegos WHERE 1=1';
  const params = [];
  
  if (genero) {
    query += ' AND genero LIKE ?';
    params.push(`%${genero}%`);
  }
  
  if (plataforma) {
    query += ' AND plataforma LIKE ?';
    params.push(`%${plataforma}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Error al obtener videojuegos', detalle: err.message });
    } else {
      res.json({
        videojuegos: rows,
        total: rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }
  });
});

// GET /api/videojuegos/:id - Obtener un videojuego por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM videojuegos WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Error al obtener videojuego', detalle: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Videojuego no encontrado' });
    } else {
      res.json(row);
    }
  });
});

// POST /api/videojuegos - Crear un nuevo videojuego
router.post('/', (req, res) => {
  const {
    titulo,
    genero,
    plataforma,
    desarrollador,
    fecha_lanzamiento,
    precio,
    descripcion,
    imagen_url,
    puntuacion
  } = req.body;
  
  // Validaciones básicas
  if (!titulo || !genero || !plataforma) {
    return res.status(400).json({
      error: 'Campos requeridos faltantes',
      requeridos: ['titulo', 'genero', 'plataforma']
    });
  }
  
  const query = `
    INSERT INTO videojuegos 
    (titulo, genero, plataforma, desarrollador, fecha_lanzamiento, precio, descripcion, imagen_url, puntuacion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    titulo,
    genero,
    plataforma,
    desarrollador,
    fecha_lanzamiento,
    precio,
    descripcion,
    imagen_url,
    puntuacion
  ], function(err) {
    if (err) {
      res.status(500).json({ error: 'Error al crear videojuego', detalle: err.message });
    } else {
      res.status(201).json({
        mensaje: 'Videojuego creado exitosamente',
        id: this.lastID
      });
    }
  });
});

// PUT /api/videojuegos/:id - Actualizar un videojuego
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    titulo,
    genero,
    plataforma,
    desarrollador,
    fecha_lanzamiento,
    precio,
    descripcion,
    imagen_url,
    puntuacion
  } = req.body;
  
  const query = `
    UPDATE videojuegos SET
    titulo = ?, genero = ?, plataforma = ?, desarrollador = ?,
    fecha_lanzamiento = ?, precio = ?, descripcion = ?, imagen_url = ?,
    puntuacion = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [
    titulo,
    genero,
    plataforma,
    desarrollador,
    fecha_lanzamiento,
    precio,
    descripcion,
    imagen_url,
    puntuacion,
    id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: 'Error al actualizar videojuego', detalle: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Videojuego no encontrado' });
    } else {
      res.json({ mensaje: 'Videojuego actualizado exitosamente' });
    }
  });
});

// DELETE /api/videojuegos/:id - Eliminar un videojuego
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM videojuegos WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: 'Error al eliminar videojuego', detalle: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Videojuego no encontrado' });
    } else {
      res.json({ mensaje: 'Videojuego eliminado exitosamente' });
    }
  });
});

module.exports = router;