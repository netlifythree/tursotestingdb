const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Open or create the Turso (SQLite) database file
const db = new sqlite3.Database('users.db');

// Read the SQL from the file to create users table
const createTableSql = fs.readFileSync('db.sql', 'utf-8');

db.serialize(() => {
  // Create users table if not exists
  db.run(createTableSql, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      return;
    }
    console.log('Users table created or already exists.');

    // Insert sample user
    db.run(
      `INSERT INTO users (username, password, active) VALUES (?, ?, ?)`,
      ['alice', 'securepassword', 1],
      function (err) {
        if (err) {
          console.error('Insert error:', err.message);
        } else {
          console.log(`A row has been inserted with id ${this.lastID}`);
        }
      }
    );

    // Query all users
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        console.error('Select error:', err.message);
      }
      console.log('Users:', rows);
    });
  });
});
