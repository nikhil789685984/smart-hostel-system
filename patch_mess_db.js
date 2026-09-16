const fs = require('fs');
let code = fs.readFileSync('backend/src/database/db.js', 'utf8');

const tableSql = `
    CREATE TABLE IF NOT EXISTS mess_complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      issue_type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
`;

code = code.replace(/CREATE TABLE IF NOT EXISTS warden_complaints \(/, tableSql + '\n    CREATE TABLE IF NOT EXISTS warden_complaints (');

fs.writeFileSync('backend/src/database/db.js', code);
console.log('DB updated with mess_complaints');
