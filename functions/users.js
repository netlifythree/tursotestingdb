const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'users.db');

// Initialize DB and create table if needed
function initDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err);
      else {
        db.run(
          `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT 1
          )`,
          (err) => {
            if (err) reject(err);
            else resolve(db);
          }
        );
      }
    });
  });
}

exports.handler = async function (event, context) {
  let db;
  try {
    db = await initDb();

    // For example, handle GET request to list users
    if (event.httpMethod === 'GET') {
      const users = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM users', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      return {
        statusCode: 200,
        body: JSON.stringify(users),
      };
    }

    // Handle POST request to add a user (expect JSON body with username, password)
    if (event.httpMethod === 'POST') {
      const { username, password } = JSON.parse(event.body);
      if (!username || !password) {
        return { statusCode: 400, body: 'Missing username or password' };
      }
      const result = await new Promise((resolve, reject) => {
        const stmt = db.prepare(
          `INSERT INTO users (username, password, active) VALUES (?, ?, 1)`
        );
        stmt.run([username, password], function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        });
      });
      return {
        statusCode: 201,
        body: JSON.stringify(result),
      };
    }

    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error: ${error.message}`,
    };
  } finally {
    if (db) {
      db.close();
    }
  }
};
