import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

const names = [
  'Aarav Sharma', 'Aditi Verma', 'Rohan Desai', 'Priya Singh',
  'Kabir Das', 'Ananya Iyer', 'Vikram Malhotra', 'Neha Gupta',
  'Arjun Nair', 'Sanya Kapoor', 'Rahul Khanna', 'Pooja Reddy',
  'Dev Joshi', 'Kavya Menon', 'Ishaan Bhatt', 'Riya Sen',
  'Aditya Rao', 'Tara Chauhan', 'Karan Mehta', 'Zara Khan'
];
const branches = ['Computer Science', 'Mechanical', 'Electrical', 'Civil', 'Electronics'];

async function seed() {
  const db = await open({
    filename: 'backend/src/database/hostel.db',
    driver: sqlite3.Database
  });
  
  const passwordHash = await bcrypt.hash('password123', 10);
  
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const email = name.toLowerCase().replace(' ', '.') + '@university.edu';
    const phone = '98765' + Math.floor(10000 + Math.random() * 90000);
    const branch = branches[Math.floor(Math.random() * branches.length)];
    const roll_number = 'B24' + branch.substring(0, 2).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
    
    // Insert User
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, 'student', phone]
    );
    const userId = result.lastID;
    
    // Insert Student
    const studentRes = await db.run(
      'INSERT INTO students (user_id, roll_number, branch, year) VALUES (?, ?, ?, ?)',
      [userId, roll_number, branch, 1]
    );
    const studentId = studentRes.lastID;
    
    // Assign a bed if possible
    const bed = await db.get("SELECT id FROM beds WHERE status = 'vacant' LIMIT 1");
    if (bed) {
      await db.run("UPDATE beds SET status = 'occupied' WHERE id = ?", [bed.id]);
      await db.run(
        "INSERT INTO room_allocations (student_id, bed_id, status) VALUES (?, ?, 'active')",
        [studentId, bed.id]
      );
    }
    
    // Insert Fee
    await db.run(
      "INSERT INTO fees (student_id, semester, total_amount, paid_amount, pending_amount, due_date, status) VALUES (?, 1, 45000.0, 0.0, 45000.0, date('now', '+30 days'), 'Pending')",
      [studentId]
    );
    console.log(`Added student: ${name}`);
  }
  
  await db.close();
  console.log('Seeding complete.');
}

seed().catch(console.error);
