import { run } from './db.js';

export async function createSalaryTables() {
  await run(`
    CREATE TABLE IF NOT EXISTS staff_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL UNIQUE,
      bank_account_no TEXT,
      ifsc_code TEXT,
      base_salary REAL NOT NULL DEFAULT 45000.0,
      current_balance REAL NOT NULL DEFAULT 0.0,
      last_credited_at DATETIME,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS staff_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'CREDIT_SALARY', 'WITHDRAW', 'BONUS', 'DEDUCTION'
      description TEXT NOT NULL,
      transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      reference_id TEXT,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Salary tables initialized');
}
