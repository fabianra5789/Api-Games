const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usar /tmp en Vercel (sistema de archivos temporal)
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/games.db' 
  : path.join(__dirname, 'games.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Crear tabla de videojuegos
const createTable = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        genre TEXT NOT NULL,
        platform TEXT NOT NULL,
        developer TEXT,
        release_date DATE,
        price DECIMAL(10,2),
        description TEXT,
        image_url TEXT,
        rating DECIMAL(3,1),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.run(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Tabla games creada o ya existe');
        resolve();
      }
    });
  });
};

// Insertar datos de ejemplo
const insertSampleData = () => {
  return new Promise((resolve, reject) => {
    // Verificar si ya hay datos
    db.get('SELECT COUNT(*) as count FROM games', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row.count > 0) {
        console.log('✅ La base de datos ya tiene datos');
        resolve();
        return;
      }
      
      // Insertar datos de ejemplo
      const sampleGames = [
        {
          title: 'The Legend of Zelda: Breath of the Wild',
          genre: 'Aventura',
          platform: 'Nintendo Switch',
          developer: 'Nintendo',
          release_date: '2017-03-03',
          price: 59.99,
          description: 'Un juego de aventuras en mundo abierto que redefine la serie Zelda.',
          rating: 9.7
        },
        {
          title: 'Cyberpunk 2077',
          genre: 'RPG',
          platform: 'PC',
          developer: 'CD Projekt Red',
          release_date: '2020-12-10',
          price: 39.99,
          description: 'Un RPG de mundo abierto ambientado en Night City, una megalópolis obsesionada con el poder, el glamour y la modificación corporal.',
          rating: 8.1
        },
        {
          title: 'God of War',
          genre: 'Acción',
          platform: 'PlayStation 5',
          developer: 'Santa Monica Studio',
          release_date: '2018-04-20',
          price: 49.99,
          description: 'Kratos regresa en una nueva aventura nórdica junto a su hijo Atreus.',
          rating: 9.5
        },
        {
          title: 'Hades',
          genre: 'Acción',
          platform: 'PC',
          developer: 'Supergiant Games',
          release_date: '2020-09-17',
          price: 24.99,
          description: 'Un roguelike de acción donde juegas como el hijo del Hades.',
          rating: 9.2
        }
      ];
      
      const insertPromises = sampleGames.map(game => {
        return new Promise((resolveInsert, rejectInsert) => {
          const sql = `
            INSERT INTO games (title, genre, platform, developer, release_date, price, description, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          db.run(sql, [
            game.title,
            game.genre,
            game.platform,
            game.developer,
            game.release_date,
            game.price,
            game.description,
            game.rating
          ], function(err) {
            if (err) {
              rejectInsert(err);
            } else {
              resolveInsert(this.lastID);
            }
          });
        });
      });
      
      Promise.all(insertPromises)
        .then(() => {
          console.log('✅ Datos de ejemplo insertados');
          resolve();
        })
        .catch(reject);
    });
  });
};

// Función para inicializar la base de datos
const initDatabase = async () => {
  try {
    await createTable();
    await insertSampleData();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

module.exports = { db, initDatabase };