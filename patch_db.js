const fs = require('fs');
let code = fs.readFileSync('backend/src/database/db.js', 'utf8');

const tableSql = `
    CREATE TABLE IF NOT EXISTS warden_complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      warden_user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (warden_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`;

code = code.replace(/CREATE TABLE IF NOT EXISTS complaints \(/, tableSql + '\n    CREATE TABLE IF NOT EXISTS complaints (');

fs.writeFileSync('backend/src/database/db.js', code);
console.log('DB updated');
