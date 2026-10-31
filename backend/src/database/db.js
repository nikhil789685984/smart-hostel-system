import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mysqlPool = null;
let sqliteDb = null;
let activeEngine = 'sqlite';

export async function initDb() {
  if (config.db.type === 'mysql') {
    try {
      console.log('Attempting to connect to MySQL database:', config.db.database);
      mysqlPool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test connection
      const connection = await mysqlPool.getConnection();
      console.log(' Successfully connected to MySQL database');
      connection.release();
      activeEngine = 'mysql';
      return;
    } catch (err) {
      console.warn('⚠️  MySQL connection failed (' + err.message + '). Falling back to built-in SQLite engine.');
    }
  }

  // SQLite Engine Fallback / Default
  activeEngine = 'sqlite';
  const dbPath = path.join(__dirname, 'hostel.db');
  console.log(' Initializing SQLite database at:', dbPath);
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  // Initialize SQLite tables
  setupSqliteSchema(sqliteDb);
  seedSqliteData(sqliteDb);
  console.log(' SQLite database ready with all 17 tables and seed data.');
}

function setupSqliteSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      phone TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hostels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'boys',
      total_blocks INTEGER NOT NULL DEFAULT 1,
      address TEXT,
      contact_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hostel_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      floors_count INTEGER NOT NULL DEFAULT 3,
      FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_id INTEGER NOT NULL,
      room_number TEXT NOT NULL,
      floor INTEGER NOT NULL DEFAULT 1,
      capacity INTEGER NOT NULL DEFAULT 2,
      room_type TEXT NOT NULL DEFAULT 'Non-AC',
      fee_per_semester REAL NOT NULL DEFAULT 35000.0,
      status TEXT NOT NULL DEFAULT 'available',
      FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS beds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      bed_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'vacant',
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      roll_number TEXT NOT NULL UNIQUE,
      enrollment_number TEXT,
      course TEXT NOT NULL DEFAULT 'B.Tech',
      branch TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
      year INTEGER NOT NULL DEFAULT 3,
      semester INTEGER NOT NULL DEFAULT 6,
      cgpa REAL DEFAULT 8.5,
      dob DATE,
      gender TEXT DEFAULT 'Male',
      blood_group TEXT DEFAULT 'B+',
      aadhar_number TEXT,
      father_name TEXT,
      father_phone TEXT,
      father_occupation TEXT,
      mother_name TEXT,
      mother_phone TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      emergency_contact TEXT,
      address_line TEXT,
      city TEXT DEFAULT 'New Delhi',
      state TEXT DEFAULT 'Delhi',
      pincode TEXT DEFAULT '110016',
      checkin_date DATE,
      status TEXT NOT NULL DEFAULT 'active',
      caretaker_id INTEGER REFERENCES caretakers(id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS caretakers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      staff_id TEXT UNIQUE NOT NULL,
      phone TEXT,
      email TEXT,
      shift TEXT DEFAULT 'Full Time',
      assigned_block TEXT,
      floor TEXT DEFAULT 'All Floors',
      duty_role TEXT DEFAULT 'Hostel Resident Caretaker',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wardens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      employee_id TEXT NOT NULL UNIQUE,
      assigned_hostel_id INTEGER,
      department TEXT DEFAULT 'Student Welfare & Security',
      office_location TEXT DEFAULT 'Ground Floor Admin Cabin, Block A',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_hostel_id) REFERENCES hostels(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS room_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      bed_id INTEGER NOT NULL,
      allocated_from DATE NOT NULL,
      allocated_to DATE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE CASCADE
    );

    
    
    CREATE TABLE IF NOT EXISTS mess_complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      issue_type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

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

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      location TEXT NOT NULL,
      image_url TEXT,
      priority TEXT NOT NULL DEFAULT 'Medium',
      department TEXT DEFAULT 'Maintenance',
      status TEXT NOT NULL DEFAULT 'Pending',
      assigned_to TEXT,
      resolution_notes TEXT,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS complaint_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      updated_by_user_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS block_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_id INTEGER NOT NULL,
      warden_id INTEGER,
      cleanliness_score REAL NOT NULL DEFAULT 9.0,
      remarks TEXT,
      inspected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS marketplace_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0.0,
      condition TEXT NOT NULL DEFAULT 'Good',
      description TEXT NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'Available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );




    CREATE TABLE IF NOT EXISTS mess_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week TEXT NOT NULL UNIQUE,
      breakfast TEXT NOT NULL,
      lunch TEXT NOT NULL,
      snacks TEXT NOT NULL,
      dinner TEXT NOT NULL,
      special_item TEXT,
      dietary_tags TEXT DEFAULT 'Veg, High-Protein'
    );

    CREATE TABLE IF NOT EXISTS mess_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      rating INTEGER NOT NULL,
      taste_rating INTEGER,
      quality_rating INTEGER,
      cleanliness_rating INTEGER,
      comments TEXT,
      date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      priority TEXT NOT NULL DEFAULT 'Normal',
      published_by_user_id INTEGER NOT NULL,
      target_audience TEXT NOT NULL DEFAULT 'all',
      date DATE NOT NULL,
      expires_at DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (published_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS staff_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL UNIQUE,
      bank_account_no TEXT,
      ifsc_code TEXT,
      base_salary REAL NOT NULL DEFAULT 45000.0,
      current_balance REAL NOT NULL DEFAULT 0.0,
      last_credited_at DATETIME,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS staff_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      reference_id TEXT,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      semester INTEGER NOT NULL DEFAULT 6,
      total_amount REAL NOT NULL DEFAULT 45000.0,
      paid_amount REAL NOT NULL DEFAULT 0.0,
      pending_amount REAL NOT NULL DEFAULT 45000.0,
      due_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      receipt_number TEXT,
      last_payment_date DATETIME,
      transaction_id TEXT,
      payment_method TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS room_change_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      current_bed_id INTEGER NOT NULL,
      preferred_block TEXT NOT NULL,
      preferred_room_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      warden_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (current_bed_id) REFERENCES beds(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gate_passes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      pass_type TEXT NOT NULL DEFAULT 'Day Outing',
      destination TEXT NOT NULL,
      reason TEXT NOT NULL,
      departure_time DATETIME NOT NULL,
      expected_return DATETIME NOT NULL,
      actual_return DATETIME,
      status TEXT NOT NULL DEFAULT 'Pending',
      qr_token TEXT UNIQUE,
      approved_by_user_id INTEGER,
      warden_remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Present',
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(student_id, date)
    );

    CREATE TABLE IF NOT EXISTS fee_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fee_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_id TEXT NOT NULL UNIQUE,
      receipt_number TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS staff_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER,
      subject TEXT,
      message TEXT NOT NULL,
      priority TEXT DEFAULT 'Normal',
      category TEXT DEFAULT 'General',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      fee_id INTEGER,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Unpaid',
      days_overdue INTEGER DEFAULT 0,
      issued_by_user_id INTEGER,
      issued_date DATE DEFAULT (date('now')),
      paid_date DATETIME,
      transaction_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE SET NULL,
      FOREIGN KEY (issued_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_absences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date DATE NOT NULL,
      meal_type TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT 'Personal / Dining Out',
      rebate_amount REAL DEFAULT 65.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(student_id, date, meal_type)
    );

    CREATE TABLE IF NOT EXISTS checkout_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      expected_checkout_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS depression_screenings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      roll_number TEXT,
      block_name TEXT,
      room_number TEXT,
      total_score INTEGER NOT NULL,
      severity TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      notes TEXT,
      counseling_requested INTEGER DEFAULT 1,
      preferred_mode TEXT DEFAULT 'In-Person',
      status TEXT DEFAULT 'Pending',
      admin_notes TEXT,
      session_time DATETIME,
      counselor_name TEXT,
      session_venue TEXT,
      approved_by_user_id INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_preview TEXT,
      type TEXT,
      status TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Run dynamic schema migrations for fees table
  try {
    const cols = sqliteDb.prepare('PRAGMA table_info(fees)').all().map(c => c.name);
    if (!cols.includes('late_fine')) {
      sqliteDb.prepare('ALTER TABLE fees ADD COLUMN late_fine REAL NOT NULL DEFAULT 0.0').run();
    }
    if (!cols.includes('days_overdue')) {
      sqliteDb.prepare('ALTER TABLE fees ADD COLUMN days_overdue INTEGER DEFAULT 0').run();
    }
    if (!cols.includes('fine_reason')) {
      sqliteDb.prepare('ALTER TABLE fees ADD COLUMN fine_reason TEXT').run();
    }
  } catch (err) {
    console.warn('Migration note for fees table:', err.message);
  }

  // Run dynamic schema migrations for students table
  try {
    const sCols = sqliteDb.prepare('PRAGMA table_info(students)').all().map(c => c.name);
    const newStudentCols = [
      { name: 'father_name', type: "TEXT DEFAULT 'Ramesh Sharma'" },
      { name: 'father_phone', type: "TEXT DEFAULT '+91 98765 11111'" },
      { name: 'father_occupation', type: "TEXT DEFAULT 'Senior Officer / Engineer'" },
      { name: 'mother_name', type: "TEXT DEFAULT 'Sunita Sharma'" },
      { name: 'mother_phone', type: "TEXT DEFAULT '+91 98765 22222'" },
      { name: 'parent_email', type: "TEXT DEFAULT 'parents.guardians@gmail.com'" },
      { name: 'dob', type: "DATE DEFAULT '2004-05-15'" },
      { name: 'gender', type: "TEXT DEFAULT 'Male'" },
      { name: 'aadhar_number', type: "TEXT DEFAULT '7712-4490-1823'" },
      { name: 'address_line', type: "TEXT DEFAULT 'Flat 402, Green Park Enclave'" },
      { name: 'city', type: "TEXT DEFAULT 'New Delhi'" },
      { name: 'state', type: "TEXT DEFAULT 'Delhi'" },
      { name: 'pincode', type: "TEXT DEFAULT '110016'" },
      { name: 'cgpa', type: "REAL DEFAULT 8.75" },
      { name: 'enrollment_number', type: "TEXT DEFAULT 'EN2024CS9901'" }
    ];

    for (const col of newStudentCols) {
      if (!sCols.includes(col.name)) {
        sqliteDb.prepare(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type}`).run();
      }
    }
  } catch (err) {
    console.warn('Migration note for students table:', err.message);
  }

  // Seed initial notifications & overdue fines if empty
  try {
    const notifCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
    if (notifCount === 0) {
      console.log('Seeding initial interactive campus notifications...');
      const insNotif = sqliteDb.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
      `);

      // Notifications for Student 1 (Aarav Sharma - user_id: 12)
      insNotif.run(12, 'Annual Room Safety Audit', 'Annual mandatory electrical audit scheduled on 18th Sept. Please keep room accessible.', 'notice', '/student/notices', 0, '-2 hours');
      insNotif.run(12, 'Gate Pass Approved', 'Your Day Outing Pass #GP-8840 has been approved by Chief Warden Dr. Rajesh Verma.', 'gate_pass', '/student/gate-pass', 0, '-4 hours');
      insNotif.run(12, 'Complaint In Progress', 'Complaint #101 (Geyser Breakage) assigned to Senior Electrician.', 'complaint', '/student/complaints', 1, '-1 day');

      // Notifications for Student 2 (Rohan Patel - user_id: 13)
      insNotif.run(13, '⚠️ Overdue Late Fine Levied', 'Late penalty of ₹700 applied for overdue Semester 6 hostel fee (14 days overdue). Please clear dues immediately.', 'fine', '/student/fees', 0, '-1 hour');

      // Notifications for Warden (Dr. Rajesh Verma - user_id: 2)
      insNotif.run(2, 'Official Admin Directive', 'New Directive: Electrical audit schedule across all Himalaya Boys blocks.', 'message', '/warden/messages', 0, '-1 hour');
      insNotif.run(2, 'Gate Pass Application', 'Student Rohan Patel applied for Weekend Leave Gate Pass #GP-8842.', 'gate_pass', '/warden/gate-passes', 0, '-3 hours');
      insNotif.run(2, 'High Priority Complaint', 'Water leakage reported in Himalaya Block B (Room 204). Technician dispatched.', 'complaint', '/warden/complaints', 1, '-1 day');

      // Notifications for Admin (Chief Administrative Officer - user_id: 1)
      insNotif.run(1, 'Staff Message from Dr. Rajesh Verma', 'Electrical audit report for Himalaya Wing A & B submitted for review.', 'message', '/admin/messages', 0, '-30 minutes');
      insNotif.run(1, 'Overdue Fines Assessed', 'Automated fine assessment: 14 overdue student accounts identified and penalised.', 'fine', '/admin/students', 0, '-2 hours');
      insNotif.run(1, 'Revenue Milestone', 'Monthly Fee Revenue reached ₹28,80,000 across 77 verified student transactions.', 'fee', '/admin/analytics', 1, '-1 day');
    }

    // Check if any fines exist in fines table
    const fineCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM fines').get().count;
    if (fineCount === 0) {
      console.log('Seeding initial overdue late fees & disciplinary fines...');
      const insFine = sqliteDb.prepare(`
        INSERT INTO fines (student_id, fee_id, type, amount, reason, status, days_overdue, issued_by_user_id, issued_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Seed overdue fees for Student 2 (Rohan Patel) - 14 days @ ₹100/day = ₹1400
      const f2 = sqliteDb.prepare('SELECT id FROM fees WHERE student_id = 2').get();
      if (f2) {
        sqliteDb.prepare(`
          UPDATE fees 
          SET due_date = '2026-09-01', late_fine = 1400.0, days_overdue = 14, pending_amount = 46400.0, status = 'Overdue' 
          WHERE id = ?
        `).run(f2.id);
        insFine.run(2, f2.id, 'Late Fee', 1400.0, '14 days overdue for Semester 6 Hostel Fee (@ ₹100/day)', 'Unpaid', 14, 1, '2026-09-02');
      }

      // Seed overdue fees for Student 4 (Vikram Patel) - 10 days @ ₹100/day = ₹1000
      const f4 = sqliteDb.prepare('SELECT id FROM fees WHERE student_id = 4').get();
      if (f4) {
        sqliteDb.prepare(`
          UPDATE fees 
          SET due_date = '2026-09-05', late_fine = 1000.0, days_overdue = 10, pending_amount = 16000.0, status = 'Overdue' 
          WHERE id = ?
        `).run(f4.id);
        insFine.run(4, f4.id, 'Late Fee', 1000.0, '10 days overdue for Semester 2 Balance (@ ₹100/day)', 'Unpaid', 10, 1, '2026-09-06');
      }

      // Seed overdue fees for Student 5 (Karan Joshi) - 11 days @ ₹100/day = ₹1100
      const f5 = sqliteDb.prepare('SELECT id FROM fees WHERE student_id = 5').get();
      if (f5) {
        sqliteDb.prepare(`
          UPDATE fees 
          SET due_date = '2026-09-04', late_fine = 1100.0, days_overdue = 11, pending_amount = 46100.0, status = 'Overdue' 
          WHERE id = ?
        `).run(f5.id);
        insFine.run(5, f5.id, 'Late Fee', 1100.0, '11 days overdue for Semester 3 Hostel Fee (@ ₹100/day)', 'Unpaid', 11, 1, '2026-09-05');
      }

      // Disciplinary Curfew Fine for Student 7 (Aditya Rao)
      insFine.run(7, null, 'Curfew Violation', 250.0, 'Late night turnstile entry at 22:45 without prior approval', 'Unpaid', 0, 6, '2026-09-13');
    }
  } catch (err) {
    console.warn('Fines / Notifications seeding error:', err.message);
  }

  // Ensure meal_absences table exists & seed initial records for today/yesterday
  try {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS meal_absences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        date DATE NOT NULL,
        meal_type TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT 'Personal / Dining Out',
        rebate_amount REAL DEFAULT 65.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE(student_id, date, meal_type)
      );
    `);

    const countAbs = sqliteDb.prepare('SELECT COUNT(*) as count FROM meal_absences').get().count;
    if (countAbs === 0) {
      console.log('Seeding initial meal absences for Warden & Admin views...');
      const insAbs = sqliteDb.prepare(`
        INSERT OR IGNORE INTO meal_absences (student_id, date, meal_type, reason, rebate_amount, created_at)
        VALUES (?, date('now', ?), ?, ?, ?, datetime('now', ?))
      `);

      // Today's absences across various blocks and meals
      insAbs.run(1, '+0 days', 'Dinner', 'Dining Out with College Project Team', 65.0, '-2 hours');
      insAbs.run(2, '+0 days', 'Lunch', 'Attending Off-Campus Tech Seminar', 65.0, '-5 hours');
      insAbs.run(2, '+0 days', 'Dinner', 'Family Dinner in City', 65.0, '-4 hours');
      insAbs.run(3, '+0 days', 'Breakfast', 'Early Morning Laboratory Experiment', 40.0, '-8 hours');
      insAbs.run(4, '+0 days', 'Dinner', 'Personal Fasting / Religious Observance', 65.0, '-3 hours');
      insAbs.run(5, '+0 days', 'Lunch', 'Visiting Family Relatives', 65.0, '-6 hours');
      insAbs.run(6, '+0 days', 'Dinner', 'GATE Exam Coaching Class', 65.0, '-1 hour');
      insAbs.run(8, '+0 days', 'Dinner', 'Outing Gate Pass Approved', 65.0, '-2 hours');
      insAbs.run(9, '+0 days', 'Breakfast', 'Medical Appointment Checkup', 40.0, '-9 hours');
      insAbs.run(11, '+0 days', 'Lunch', 'IEEE Conference Presentation', 65.0, '-4 hours');
      insAbs.run(14, '+0 days', 'Dinner', 'Dining with Family', 65.0, '-1 hour');
      insAbs.run(16, '+0 days', 'Dinner', 'Hackathon Final Round Off-Campus', 65.0, '-3 hours');

      // Yesterday's absences
      insAbs.run(1, '-1 days', 'Lunch', 'Campus Placement Drive in Main Auditorium', 65.0, '-1 day');
      insAbs.run(2, '-1 days', 'Dinner', 'Weekend Outing with Parents', 65.0, '-1 day');
      insAbs.run(5, '-1 days', 'Dinner', 'Personal Outing', 65.0, '-1 day');
      insAbs.run(7, '-1 days', 'Breakfast', 'Late Night Study Rest', 40.0, '-1 day');
      insAbs.run(10, '-1 days', 'Dinner', 'Dining Out', 65.0, '-1 day');
    }
  } catch (err) {
    console.warn('Meal absences migration error:', err.message);
  }

  // Ensure marketplace_items auto-seeding
  try {
    const countItems = sqliteDb.prepare('SELECT COUNT(*) as count FROM marketplace_items').get().count;
    if (countItems === 0) {
      console.log('Seeding initial campus marketplace items across all 8 categories...');
      const insertMarketItem = sqliteDb.prepare(`
        INSERT INTO marketplace_items (id, student_id, title, category, price, condition, description, image_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertMarketItem.run(1, 1, 'Casio FX-991EX ClassWiz Scientific Calculator', 'Calculators & Gadgets', 850.0, 'Like New', 'Original dual-power solar/battery calculator with 552 functions. Perfect for GATE and semester exams.', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=400', 'Available');
      insertMarketItem.run(2, 2, 'Hero Sprint 21-Speed Gear Mountain Cycle', 'Cycles & Mobility', 2800.0, 'Good', 'Sturdy 26T frame, front suspension fork, shimano gear shifters. Serviced last month at campus cycle shop.', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400', 'Available');
      insertMarketItem.run(3, 3, 'Higher Engineering Mathematics (B.S. Grewal) + GATE Notes', 'Books & Notes', 350.0, 'Good', '44th Edition in great condition with handwritten CSE GATE previous 10-year solved formula booklet.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', 'Available');
      insertMarketItem.run(4, 1, 'Wipro 10W Rechargeable Touch LED Study Table Lamp', 'Table Lamps & Lighting', 250.0, 'Like New', '3-color dimmable modes, built-in 2000mAh battery backup for power cuts in hostel.', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', 'Available');
      insertMarketItem.run(5, 2, 'Symphony Personal Room Cooler 12L + Mosquito Net', 'Room Appliances', 1500.0, 'Good', 'Compact honeycomb cooling pads personal cooler. Super low power consumption, ideal for room B-204.', 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400', 'Available');
      insertMarketItem.run(6, 3, 'Portronics Folding Wooden Bed Study Table with Cup Holder', 'Furniture & Storage', 300.0, 'Like New', 'Solid engineered wood top with tablet/phone slot & Anti-skid L-shaped legs.', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400', 'Available');
      insertMarketItem.run(7, 1, 'Yonex Muscle Power 29 Badminton Racket + Full Cover', 'Sports & Fitness', 450.0, 'Good', 'Isometric head frame, strung at 24 lbs. Comes with Yonex thermal padded cover.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 'Available');
    }
  } catch (err) {
    console.warn('Marketplace seeding error:', err.message);
  }

  // Ensure caretakers table is seeded with all 15 block/floor caretakers
  try {
    const countCaretakers = sqliteDb.prepare('SELECT COUNT(*) as count FROM caretakers').get().count;
    if (countCaretakers === 0) {
      console.log('Seeding initial 15 hostel caretakers across all blocks and shifts...');
      const insertCaretaker = sqliteDb.prepare(`
        INSERT INTO caretakers (id, name, staff_id, phone, email, shift, assigned_block, floor, duty_role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const defaultCaretakers = [
        [1, 'Ramesh Kumar', 'CT-101', '+91-9876511001', 'ramesh.caretaker@hostel.com', 'Morning Shift (6 AM - 2 PM)', 'Block A (Aryabhata)', 'Ground Floor & 1st Floor', 'Senior Hostel Caretaker'],
        [2, 'Sunita Devi', 'CT-102', '+91-9876511002', 'sunita.caretaker@hostel.com', 'Morning Shift (6 AM - 2 PM)', 'Block A (Gargi)', 'Ground Floor & 1st Floor', 'Girls Wing Resident Caretaker'],
        [3, 'Mohan Singh', 'CT-103', '+91-9876511003', 'mohan.caretaker@hostel.com', 'Evening Shift (2 PM - 10 PM)', 'Block B (Bhaskara)', '1st & 2nd Floor', 'Facility & Room Support Caretaker'],
        [4, 'Anil Sharma', 'CT-104', '+91-9876511004', 'anil.caretaker@hostel.com', 'Night Shift (10 PM - 6 AM)', 'Block A (Aryabhata)', 'All Floors', 'Night Duty Caretaker & Security'],
        [5, 'Suresh Yadav', 'CT-105', '+91-9876511005', 'suresh.caretaker@hostel.com', 'Morning Shift (6 AM - 2 PM)', 'Block C (Charaka)', 'Ground & 1st Floor', 'Resident Block Caretaker'],
        [6, 'Anita Verma', 'CT-106', '+91-9876511006', 'anita.caretaker@hostel.com', 'Evening Shift (2 PM - 10 PM)', 'Block B (Maitreyi)', 'All Floors', 'Girls Hostel Caretaker'],
        [7, 'Rajendra Prasad', 'CT-107', '+91-9876511007', 'rajendra.caretaker@hostel.com', 'Full Time', 'Block D (Ramanujan)', 'Ground & 1st Floor', 'Block Supervisor Caretaker'],
        [8, 'Geeta Rani', 'CT-108', '+91-9876511008', 'geeta.caretaker@hostel.com', 'Full Time', 'Block C (Sarojini)', 'All Floors', 'Senior Girls Hostel Caretaker'],
        [9, 'Vikramjit Singh', 'CT-109', '+91-9876511009', 'vikramjit.caretaker@hostel.com', 'Morning Shift (6 AM - 2 PM)', 'Block B (Bhaskara)', 'Ground Floor', 'Maintenance & Key Caretaker'],
        [10, 'Pooja Sharma', 'CT-110', '+91-9876511010', 'pooja.caretaker@hostel.com', 'Evening Shift (2 PM - 10 PM)', 'Block A (Gargi)', '2nd & 3rd Floor', 'Floor Support Caretaker'],
        [11, 'Dharmendra Pal', 'CT-111', '+91-9876511011', 'dharmendra.caretaker@hostel.com', 'Night Shift (10 PM - 6 AM)', 'Block C (Charaka)', 'All Floors', 'Night Escort Caretaker'],
        [12, 'Meena Devi', 'CT-112', '+91-9876511012', 'meena.caretaker@hostel.com', 'Morning Shift (6 AM - 2 PM)', 'Block B (Maitreyi)', 'Ground Floor', 'Sanitation & Welfare Caretaker'],
        [13, 'Santosh Kumar', 'CT-113', '+91-9876511013', 'santosh.caretaker@hostel.com', 'Evening Shift (2 PM - 10 PM)', 'Block D (Ramanujan)', '2nd Floor', 'Facility Caretaker'],
        [14, 'Sarita Joshi', 'CT-114', '+91-9876511014', 'sarita.caretaker@hostel.com', 'Full Time', 'Block C (Sarojini)', '1st & 2nd Floor', 'Resident Assistant Caretaker'],
        [15, 'Harish Chandra', 'CT-115', '+91-9876511015', 'harish.caretaker@hostel.com', 'Morning Shift (6 AM - 2 PM)', 'Block A (Aryabhata)', '2nd & 3rd Floor', 'Senior Resident Caretaker']
      ];
      for (const row of defaultCaretakers) {
        insertCaretaker.run(...row);
      }
    }
  } catch (err) {
    console.warn('Caretakers seeding error:', err.message);
  }

  // Ensure any students with NULL caretaker_id are automatically mapped to their block & floor caretaker
  try {
    const unassignedCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM students WHERE caretaker_id IS NULL').get().count;
    if (unassignedCount > 0) {
      console.log(`Auto-assigning realistic caretakers to ${unassignedCount} students...`);
      const unassignedStudents = sqliteDb.prepare(`
        SELECT s.id as student_id, s.gender, blk.name as block_name, r.floor
        FROM students s
        LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
        LEFT JOIN beds bd ON ra.bed_id = bd.id
        LEFT JOIN rooms r ON bd.room_id = r.id
        LEFT JOIN blocks blk ON r.block_id = blk.id
        WHERE s.caretaker_id IS NULL
      `).all();

      const updateCaretaker = sqliteDb.prepare('UPDATE students SET caretaker_id = ? WHERE id = ?');
      for (const st of unassignedStudents) {
        let cid = 1;
        if (st.block_name === 'Block A (Aryabhata)') {
          cid = st.floor === 1 ? 1 : (st.floor <= 3 ? 15 : 4);
        } else if (st.block_name === 'Block A (Gargi)') {
          cid = st.floor <= 2 ? 2 : 10;
        } else if (st.block_name === 'Block B (Bhaskara)') {
          cid = st.floor <= 2 ? 9 : 3;
        } else if (st.block_name === 'Block B (Maitreyi)') {
          cid = st.floor <= 2 ? 12 : 6;
        } else if (st.block_name === 'Block C (Charaka)') {
          cid = st.floor <= 2 ? 5 : 11;
        } else if (st.block_name === 'Block C (Sarojini)') {
          cid = st.floor <= 2 ? 14 : 8;
        } else if (st.block_name === 'Block D (Ramanujan)') {
          cid = st.floor <= 2 ? 7 : 13;
        } else {
          cid = (st.gender === 'Female' || st.gender === 'female') ? 2 : 1;
        }
        updateCaretaker.run(cid, st.student_id);
      }
    }
  } catch (err) {
    console.warn('Student caretaker auto-assignment error:', err.message);
  }
}

function seedSqliteData(db) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return; // Already seeded

  console.log('Seeding initial demo data into SQLite...');
  
  // Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(1, 'Aarav Sharma', 'student@hostel.com', '$2a$10$8M7RoA3gp64u30UfKaZANOHmqwgcZBNuiYDnGBxwNWZJKQTDnHQsi', 'student', '+91 98765 43210', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
  insertUser.run(2, 'Rohan Patel', 'rohan@hostel.com', '$2a$10$8M7RoA3gp64u30UfKaZANOHmqwgcZBNuiYDnGBxwNWZJKQTDnHQsi', 'student', '+91 98765 43211', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150');
  insertUser.run(3, 'Priya Nair', 'priya@hostel.com', '$2a$10$8M7RoA3gp64u30UfKaZANOHmqwgcZBNuiYDnGBxwNWZJKQTDnHQsi', 'student', '+91 98765 43212', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
  insertUser.run(4, 'Dr. Rajesh Verma', 'warden@hostel.com', '$2a$10$fNLiQvL3hVbT7cys4SWbmuQB0ytzmjs/MctdNp02fy03iFFtGB60y', 'warden', '+91 98112 34567', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
  insertUser.run(5, 'Chief Warden Admin', 'admin@hostel.com', '$2a$10$Azhcmvh.BCQfsnJq8E/gQeJ1nAfpgqdALFj7l/3UTmhb9sOXCTuCW', 'admin', '+91 98223 34455', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150');

  // Insert Hostels
  const insertHostel = db.prepare(`INSERT INTO hostels (id, name, type, total_blocks, address, contact_phone) VALUES (?, ?, ?, ?, ?, ?)`);
  insertHostel.run(1, 'Himalaya Boys Hostel', 'boys', 3, 'North Campus, Apex Institute of Technology', '+91 11 2766 8001');
  insertHostel.run(2, 'Nilgiri Girls Hostel', 'girls', 2, 'South Campus, Apex Institute of Technology', '+91 11 2766 8002');

  // Blocks
  const insertBlock = db.prepare(`INSERT INTO blocks (id, hostel_id, name, floors_count) VALUES (?, ?, ?, ?)`);
  insertBlock.run(1, 1, 'Block A (Aryabhata)', 3);
  insertBlock.run(2, 1, 'Block B (Bhaskara)', 3);
  insertBlock.run(3, 1, 'Block C (Charaka)', 3);
  insertBlock.run(4, 2, 'Block A (Gargi)', 3);

  // Rooms
  const insertRoom = db.prepare(`INSERT INTO rooms (id, block_id, room_number, floor, capacity, room_type, fee_per_semester, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  insertRoom.run(1, 2, 'B-201', 2, 2, 'AC', 42000.0, 'full');
  insertRoom.run(2, 2, 'B-202', 2, 2, 'Non-AC', 35000.0, 'available');
  insertRoom.run(3, 2, 'B-203', 2, 3, 'Non-AC', 30000.0, 'available');
  insertRoom.run(4, 2, 'B-204', 2, 2, 'AC', 42000.0, 'full');
  insertRoom.run(5, 2, 'B-205', 2, 2, 'Deluxe', 48000.0, 'available');
  insertRoom.run(6, 1, 'A-101', 1, 2, 'AC', 42000.0, 'available');
  insertRoom.run(7, 1, 'A-102', 1, 2, 'Non-AC', 35000.0, 'full');
  insertRoom.run(8, 1, 'A-103', 1, 2, 'Non-AC', 35000.0, 'maintenance');
  insertRoom.run(9, 3, 'C-301', 3, 3, 'Non-AC', 30000.0, 'available');
  insertRoom.run(10, 4, 'G-102', 1, 2, 'AC', 42000.0, 'available');

  // Beds
  const insertBed = db.prepare(`INSERT INTO beds (id, room_id, bed_number, status) VALUES (?, ?, ?, ?)`);
  const bedsData = [
    [1, 4, 'Bed-1', 'occupied'], [2, 4, 'Bed-2', 'occupied'],
    [3, 1, 'Bed-1', 'occupied'], [4, 1, 'Bed-2', 'occupied'],
    [5, 2, 'Bed-1', 'vacant'],   [6, 2, 'Bed-2', 'vacant'],
    [7, 3, 'Bed-1', 'occupied'], [8, 3, 'Bed-2', 'vacant'], [9, 3, 'Bed-3', 'vacant'],
    [10, 5, 'Bed-1', 'vacant'],  [11, 5, 'Bed-2', 'vacant'],
    [12, 6, 'Bed-1', 'vacant'],  [13, 6, 'Bed-2', 'occupied'],
    [14, 7, 'Bed-1', 'occupied'],[15, 7, 'Bed-2', 'occupied'],
    [16, 8, 'Bed-1', 'maintenance'], [17, 8, 'Bed-2', 'maintenance'],
    [18, 9, 'Bed-1', 'vacant'],  [19, 9, 'Bed-2', 'vacant'], [20, 9, 'Bed-3', 'vacant'],
    [21, 10, 'Bed-1', 'occupied'], [22, 10, 'Bed-2', 'vacant']
  ];
  for (const b of bedsData) {
    insertBed.run(...b);
  }

  // Students
  const insertStudent = db.prepare(`
    INSERT INTO students (id, user_id, roll_number, course, branch, year, semester, blood_group, parent_name, parent_phone, emergency_contact, checkin_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStudent.run(1, 1, '21BCSE104', 'B.Tech', 'Computer Science & Engineering', 3, 6, 'O+', 'Sunil Sharma', '+91 94123 45678', '+91 94123 45678', '2024-08-01', 'active');
  insertStudent.run(2, 2, '21BCSE105', 'B.Tech', 'Computer Science & Engineering', 3, 6, 'B+', 'Mahesh Patel', '+91 94123 88776', '+91 94123 88776', '2024-08-01', 'active');
  insertStudent.run(3, 3, '21BECE210', 'B.Tech', 'Electronics & Comm. Engg', 3, 6, 'A+', 'K. Narayanan Nair', '+91 94123 11223', '+91 94123 11223', '2024-08-01', 'active');

  // Wardens
  const insertWarden = db.prepare(`
    INSERT INTO wardens (id, user_id, employee_id, assigned_hostel_id, department, office_location)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertWarden.run(1, 4, 'EMP-WRD-042', 1, 'Chief Warden Office - Boys Wings', 'Ground Floor Admin Wing, Block A');

  // Room Allocations
  const insertAllocation = db.prepare(`
    INSERT INTO room_allocations (id, student_id, bed_id, allocated_from, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAllocation.run(1, 1, 1, '2024-08-01', 'active');
  insertAllocation.run(2, 2, 2, '2024-08-01', 'active');
  insertAllocation.run(3, 3, 21, '2024-08-01', 'active');

  // Complaints
  const insertComplaint = db.prepare(`
    INSERT INTO complaints (id, student_id, title, description, category, location, priority, department, status, assigned_to, resolution_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertComplaint.run(1, 1, 'Ceiling fan regulator vibrating with high noise', 'The ceiling fan in Room B-204 is making an abnormal rattling sound at speed 3 and above, disturbing study hours.', 'Electrical', 'Room B-204', 'Medium', 'Electrical Maintenance', 'In Progress', 'Suresh Kumar (Electrician)', 'Inspected capacitor and bearings. Replacement scheduled for today afternoon.', '2026-09-12 10:15:00');
  insertComplaint.run(2, 1, 'Wi-Fi 5GHz AP disconnecting intermittently', 'Wi-Fi access point in Block B 2nd floor corridor drops packets every 10 minutes during evening peak study hours.', 'Internet', 'Block B - 2nd Floor Corridor', 'High', 'IT & Network Operations', 'Assigned', 'NetLink Team', 'Firmware patch scheduled during maintenance window.', '2026-09-13 16:30:00');
  insertComplaint.run(3, 1, 'Bathroom tap leaking in common washroom', 'Tap 2 in 2nd floor north washroom does not close fully and drips continuously.', 'Plumbing', 'Block B - 2nd Floor Washroom', 'Low', 'Sanitary Maintenance', 'Resolved', 'Ramesh Plumber', 'Washer replaced. Flow restored to normal.', '2026-09-08 09:00:00');
  insertComplaint.run(4, 2, 'Door lock latch sticking', 'Main door lock latch gets jammed when shutting from outside.', 'Furniture', 'Room B-204', 'Medium', 'Carpentry', 'Resolved', 'Jagdish Carpenter', 'Lubricated and realigned striker plate.', '2026-09-05 14:00:00');

  // Complaint Updates
  const insertUpdate = db.prepare(`
    INSERT INTO complaint_updates (id, complaint_id, updated_by_user_id, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertUpdate.run(1, 1, 1, 'Pending', 'Complaint registered by student Aarav Sharma', '2026-09-12 10:15:00');
  insertUpdate.run(2, 1, 4, 'Assigned', 'Assigned to Suresh Kumar (Electrical Dept)', '2026-09-12 11:30:00');
  insertUpdate.run(3, 1, 4, 'In Progress', 'Electrician visited site and ordered replacement ball-bearing', '2026-09-13 14:00:00');

  // Mess Menu
  const insertMenu = db.prepare(`
    INSERT INTO mess_menu (id, day_of_week, breakfast, lunch, snacks, dinner, special_item, dietary_tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMenu.run(1, 'Monday', 'Masala Dosa, Sambar, Coconut Chutney, Boiled Eggs, Tea/Coffee', 'Rajma Masala, Steamed Basmati Rice, Jeera Aloo, Curd, Mixed Salad, Roti', 'Samosa, Mint Chutney, Ginger Tea', 'Paneer Butter Masala / Chicken Curry, Dal Tadka, Phulka Roti, Gulab Jamun', 'Gulab Jamun (2 pcs)', 'Veg / Non-Veg options');
  insertMenu.run(2, 'Tuesday', 'Poha with Roasted Peanuts, Sprouted Moong Salad, Banana, Tea/Coffee', 'Kadhi Pakora, Steamed Rice, Bhindi Do Pyaza, Boondi Raita, Chapati', 'Veg Cutlet, Tomato Sauce, Lemon Tea', 'Dal Makhani, Mix Veg Sabzi, Tandoori Roti, Jeera Rice, Fruit Custard', 'Fruit Custard', 'Pure Veg');
  insertMenu.run(3, 'Wednesday', 'Idli, Medu Vada, Sambar, Tomato Chutney, Tea/Coffee', 'Chole Bhature / Steamed Rice, Yellow Dal, Sirka Onion Salad, Fresh Buttermilk', 'Onion Pakoda, Masala Chai', 'Matar Mushroom / Egg Curry, Dal Fry, Roti, Pulao, Rasgulla', 'Rasgulla', 'Veg / Non-Veg options');
  insertMenu.run(4, 'Thursday', 'Aloo Paratha with White Butter, Pickle, Curd, Tea/Coffee', 'Kashmiri Dum Aloo, Dal Palak, Steamed Rice, Roti, Cucumber Raita', 'Sweet Corn Chaat, Filter Coffee', 'Shahi Paneer, Dal Tadka, Missi Roti, Steamed Rice, Moong Dal Halwa', 'Moong Dal Halwa', 'Pure Veg');
  insertMenu.run(5, 'Friday', 'Upma with Vegetables, Sev, Coconut Chutney, Boiled Eggs, Tea/Coffee', 'Amritsari Dal, Seasonal Subzi, Steamed Rice, Roti, Fresh Curd, Papad', 'Bread Pakoda with Green Chutney, Masala Chai', 'Veg Biryani / Hyderabadi Chicken Biryani, Mirchi Ka Salan, Raita, Ice Cream', 'Special Biryani & Ice Cream', 'High-Protein Feast');
  insertMenu.run(6, 'Saturday', 'Methi Thepla, Chhundo, Boiled Sprouts, Banana, Tea/Coffee', 'Pav Bhaji with Butter Pav, Jeera Pulao, Curd, Lemon Salad', 'Biscuits & Roasted Chana, Green Tea / Chai', 'Malai Kofta, Dal Kolhapuri, Garlic Naan / Chapati, Steamed Rice, Sewaiyan Kheer', 'Sewaiyan Kheer', 'Deluxe Feast');
  insertMenu.run(7, 'Sunday', 'Chole Puri with Halwa, Fresh Fruit Juice, Tea/Coffee', 'Special Sunday Thali: Paneer Lababdar / Mutton Curry, Dal Maharani, Rice, Roti, Papad', 'Cold Coffee, Veg Sandwich', 'Light Khichdi / Pulao, Aloo Gobi, Roti, Kadhi, Sweet Lassi', 'Sunday Special Thali & Lassi', 'Chef Special');

  // Mess Feedback
  const insertFeedback = db.prepare(`
    INSERT INTO mess_feedback (id, student_id, meal_type, rating, taste_rating, quality_rating, cleanliness_rating, comments, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertFeedback.run(1, 1, 'Dinner', 5, 5, 5, 4, 'Friday Hyderabadi Biryani was outstanding! Chicken was tender and aroma was authentic.', '2026-09-11');
  insertFeedback.run(2, 2, 'Lunch', 4, 4, 4, 5, 'Rajma chawal taste was very good and served piping hot.', '2026-09-12');
  insertFeedback.run(3, 3, 'Breakfast', 4, 4, 5, 4, 'South Indian breakfast sambar consistency was very good.', '2026-09-13');

  // Notices
  const insertNotice = db.prepare(`
    INSERT INTO notices (id, title, description, category, priority, published_by_user_id, target_audience, date, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotice.run(1, 'Hostel Room Safety & Electrical Equipment Inspection', 'Annual mandatory room safety audit will be conducted by the Chief Warden and Technical Team on 18th Sept between 10:00 AM - 02:00 PM. High-wattage heating coils are strictly prohibited.', 'Inspection', 'Urgent', 4, 'all', '2026-09-14', '2026-09-20');
  insertNotice.run(2, 'Core Switch Network Maintenance - Block B & C', 'Campus Network Operations Centre will upgrade the fiber backbone switches in Block B & C on Saturday midnight (1:00 AM - 4:00 AM). Internet will be briefly intermittent.', 'Maintenance', 'Normal', 5, 'students', '2026-09-13', '2026-09-19');
  insertNotice.run(3, 'Night Gate Curfew & Biometric Attendance Reminder', 'All hostel residents are reminded that main campus entry gate closes at 09:30 PM sharp. Night biometric check-in is mandatory between 09:30 PM - 10:15 PM.', 'Discipline', 'High', 4, 'students', '2026-09-10', '2026-10-31');
  insertNotice.run(4, 'Annual Inter-Hostel Sports & Cultural Meet 2026', 'Registrations are open for Badminton, Table Tennis, Chess, and E-Sports representing Himalaya and Nilgiri Hostels. Contact sports secretary before 22nd Sept.', 'Event', 'Normal', 4, 'all', '2026-09-12', '2026-09-22');

  // Fees
  const insertFee = db.prepare(`
    INSERT INTO fees (id, student_id, semester, total_amount, paid_amount, pending_amount, due_date, status, receipt_number, last_payment_date, transaction_id, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertFee.run(1, 1, 6, 45000.0, 30000.0, 15000.0, '2026-09-30', 'Partial', 'RCPT-2026-08912', '2026-08-15 11:24:00', 'TXN_APEX_89234710', 'UPI - GPay');
  insertFee.run(2, 2, 6, 42000.0, 42000.0, 0.0, '2026-09-30', 'Paid', 'RCPT-2026-08913', '2026-08-10 16:40:00', 'TXN_APEX_89234711', 'Net Banking - HDFC');
  insertFee.run(3, 3, 6, 45000.0, 0.0, 45000.0, '2026-09-30', 'Pending', null, null, null, null);

  // Room Change Requests
  const insertRoomReq = db.prepare(`
    INSERT INTO room_change_requests (id, student_id, current_bed_id, preferred_block, preferred_room_type, reason, status, warden_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRoomReq.run(1, 2, 2, 'Block B', 'Deluxe', 'Require quiet corner room for GATE preparation', 'Pending', 'Under review subject to vacancy in B-205.', '2026-09-14 11:00:00');

  // Block Cleanliness Inspections (Leaderboard)
  const insertInspection = db.prepare(`
    INSERT INTO block_inspections (id, block_id, warden_id, cleanliness_score, remarks, inspected_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertInspection.run(1, 2, 2, 9.8, 'Block B (Bhaskara) spotless corridors, pristine common rooms, zero litter.', '2026-09-15 10:00:00');
  insertInspection.run(2, 1, 1, 9.4, 'Block A (Aryabhata) immaculate lounge, green recycling drive active.', '2026-09-15 10:30:00');
  insertInspection.run(3, 3, 3, 9.1, 'Block C (Charaka) clean stairwells, minor dust on top floor window sills.', '2026-09-15 11:00:00');
  insertInspection.run(4, 4, 4, 8.8, 'Block D (Ramanujan) well maintained study area, trash bins emptied.', '2026-09-14 15:00:00');
  insertInspection.run(5, 5, 5, 8.7, 'Block A (Gargi) excellent courtyard maintenance and hygiene.', '2026-09-14 16:00:00');

  // Hostel Mini Marketplace Seed Items
  const insertMarketItem = db.prepare(`
    INSERT INTO marketplace_items (id, student_id, title, category, price, condition, description, image_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMarketItem.run(1, 1, 'Casio FX-991EX ClassWiz Scientific Calculator', 'Calculators & Gadgets', 850.0, 'Like New', 'Original dual-power solar/battery calculator with 552 functions. Perfect for GATE and semester exams.', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=400', 'Available');
  insertMarketItem.run(2, 2, 'Hero Sprint 21-Speed Gear Mountain Cycle', 'Cycles & Mobility', 2800.0, 'Good', 'Sturdy 26T frame, front suspension fork, shimano gear shifters. Serviced last month at campus cycle shop.', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400', 'Available');
  insertMarketItem.run(3, 3, 'Higher Engineering Mathematics (B.S. Grewal) + GATE Notes', 'Books & Notes', 350.0, 'Good', '44th Edition in great condition with handwritten CSE GATE previous 10-year solved formula booklet.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', 'Available');
  insertMarketItem.run(4, 1, 'Wipro 10W Rechargeable Touch LED Study Table Lamp', 'Table Lamps & Lighting', 250.0, 'Like New', '3-color dimmable modes, built-in 2000mAh battery backup for power cuts in hostel.', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', 'Available');
  insertMarketItem.run(5, 2, 'Symphony Personal Room Cooler 12L + Mosquito Net', 'Room Appliances', 1500.0, 'Good', 'Compact honeycomb cooling pads personal cooler. Super low power consumption, ideal for room B-204.', 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400', 'Available');
  insertMarketItem.run(6, 3, 'Portronics Folding Wooden Bed Study Table with Cup Holder', 'Furniture & Storage', 300.0, 'Like New', 'Solid engineered wood top with tablet/phone slot & Anti-skid L-shaped legs.', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400', 'Available');
  insertMarketItem.run(7, 1, 'Yonex Muscle Power 29 Badminton Racket + Full Cover', 'Sports & Fitness', 450.0, 'Good', 'Isometric head frame, strung at 24 lbs. Comes with Yonex thermal padded cover.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 'Available');
  insertMarketItem.run(8, 2, 'Milton Thermosteel 1L Flask + Prestige 1.5L Electric Kettle', 'Hostel Essentials', 400.0, 'Like New', 'Boils water in 2 minutes. Stainless steel double-wall vacuum flask keeps tea hot for 18 hours.', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400', 'Available');



  // Gate Passes
  const insertGatePass = db.prepare(`
    INSERT INTO gate_passes (id, student_id, pass_type, destination, reason, departure_time, expected_return, status, qr_token, approved_by_user_id, warden_remarks, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertGatePass.run(1, 1, 'Night Out', 'Family Residence, Vasant Kunj, New Delhi', 'Attending sister wedding ceremony and weekend family event', '2026-09-19 16:00:00', '2026-09-21 20:00:00', 'Approved', 'GP-2026-78491-AARAV', 4, 'Parent confirmation call verified. Return before 8 PM Sunday.', '2026-09-13 14:20:00');
  insertGatePass.run(2, 1, 'Day Outing', 'Connaught Place / Central Library', 'Book purchase and semester reference material study', '2026-09-16 14:00:00', '2026-09-16 20:30:00', 'Pending', 'GP-2026-78492-AARAV', null, null, '2026-09-15 09:00:00');

  // Attendance
  const insertAttendance = db.prepare(`INSERT INTO attendance (student_id, date, status, remarks) VALUES (?, ?, ?, ?)`);
  const attendanceDates = [
    ['2026-09-05', 'Present', 'Biometric Check-in 21:42'],
    ['2026-09-06', 'Present', 'Biometric Check-in 21:55'],
    ['2026-09-07', 'Present', 'Biometric Check-in 21:38'],
    ['2026-09-08', 'Present', 'Biometric Check-in 22:01'],
    ['2026-09-09', 'Present', 'Biometric Check-in 21:45'],
    ['2026-09-10', 'Present', 'Biometric Check-in 21:50'],
    ['2026-09-11', 'Present', 'Biometric Check-in 21:40'],
    ['2026-09-12', 'Present', 'Biometric Check-in 21:52'],
    ['2026-09-13', 'Present', 'Biometric Check-in 22:04'],
    ['2026-09-14', 'Present', 'Biometric Check-in 21:47'],
  ];
  for (const a of attendanceDates) {
    insertAttendance.run(1, a[0], a[1], a[2]);
  }
}

// Unified Query Interface
export async function query(sql, params = []) {
  if (activeEngine === 'mysql') {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows;
  } else {
    // SQLite
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      const stmt = sqliteDb.prepare(sql);
      return stmt.all(...params);
    } else {
      const stmt = sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return {
        insertId: info.lastInsertRowid,
        affectedRows: info.changes,
      };
    }
  }
}

export async function get(sql, params = []) {
  if (activeEngine === 'mysql') {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows[0] || null;
  } else {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...params) || null;
  }
}

export async function all(sql, params = []) {
  return query(sql, params);
}

export async function run(sql, params = []) {
  if (activeEngine === 'mysql') {
    const [result] = await mysqlPool.execute(sql, params);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
    };
  } else {
    const stmt = sqliteDb.prepare(sql);
    const info = stmt.run(...params);
    return {
      insertId: info.lastInsertRowid,
      affectedRows: info.changes,
    };
  }
}

export function getEngine() {
  return activeEngine;
}
