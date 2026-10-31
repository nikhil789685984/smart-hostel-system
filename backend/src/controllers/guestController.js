import { get, all, run } from '../database/db.js';
import { createNotification, createBroadcastNotification } from './notificationController.js';

export async function initGuestDB() {
  await run(`
    CREATE TABLE IF NOT EXISTS guest_passes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      relation TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      days INTEGER NOT NULL,
      requires_room BOOLEAN DEFAULT 0,
      requires_meals BOOLEAN DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Pending', 
      payment_status TEXT DEFAULT 'Unpaid',
      allocated_room TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  try {
    await run("ALTER TABLE guest_passes ADD COLUMN allocated_room TEXT");
  } catch (e) {
    // Column might already exist, ignore
  }
}

const PRICING = {
  ROOM_AC_PER_DAY: 500,
  ROOM_NON_AC_PER_DAY: 300,
  MEALS_PER_DAY: 250
};

export async function bookPass(req, res) {
  try {
    await initGuestDB();
    const { guest_name, relation, start_date, end_date, requires_room, requires_meals } = req.body;
    
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    const diffTime = Math.abs(endDateObj - startDateObj);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

    const guest_room_type = req.body.guest_room_type || 'AC'; // 'AC' or 'Non-AC'

    let totalAmount = 0;
    if (requires_room) {
      if (guest_room_type === 'Non-AC') {
        totalAmount += (PRICING.ROOM_NON_AC_PER_DAY * days);
      } else {
        totalAmount += (PRICING.ROOM_AC_PER_DAY * days);
      }
    }
    if (requires_meals) totalAmount += (PRICING.MEALS_PER_DAY * days);
    
    // Add a base visitor fee for entry even if no room/meal
    if (!requires_room && !requires_meals) {
        totalAmount = 50 * days; // ₹50/day visitor pass
    }

    const info = await run(
      `INSERT INTO guest_passes 
      (student_id, guest_name, relation, start_date, end_date, days, requires_room, requires_meals, total_amount, guest_room_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student.id, guest_name, relation, start_date, end_date, days, requires_room ? 1 : 0, requires_meals ? 1 : 0, totalAmount, guest_room_type]
    );

    await createNotification(
      req.user.id,
      '🎟️ Guest Pass Requested',
      `Your guest pass for ${guest_name} has been requested. Pending Warden approval.`,
      'info',
      '/guest-pass'
    );

    // Notify wardens and admins
    await createBroadcastNotification(
      ['warden', 'admin'],
      '🚨 New Guest Pass Request',
      `A new guest pass request for ${guest_name} requires your approval.`,
      'warning',
      '/warden/guest-passes'
    );

    res.json({ success: true, message: 'Guest pass requested successfully!', passId: info.insertId });
  } catch (err) {
    console.error("GUEST POST ERR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMyPasses(req, res) {
  try {
    await initGuestDB();
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Auto-approve pending ones for demo purposes if older than 5 minutes
    await run(`
      UPDATE guest_passes 
      SET status = 'Approved' 
      WHERE status = 'Pending' 
      AND (julianday('now') - julianday(created_at)) * 24 * 60 >= 2
    `);

    // Auto-expire passes whose end_date has passed
    await run(`
      UPDATE guest_passes 
      SET status = 'Completed' 
      WHERE date(end_date) < date('now', 'localtime') AND status IN ('Approved', 'Active')
    `);

    const passes = await all("SELECT * FROM guest_passes WHERE student_id = ? ORDER BY created_at DESC", [student.id]);
    res.json({ success: true, passes, pricing: PRICING });
  } catch (err) {
    console.error("GUEST POST ERR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function payForPass(req, res) {
  try {
    await initGuestDB();
    const { id } = req.params;
    const { payment_method } = req.body;
    
    await run("UPDATE guest_passes SET payment_status = 'Paid', status = 'Active' WHERE id = ?", [id]);
    
    await createNotification(
      req.user.id,
      '✅ Payment Successful',
      `Payment for Guest Pass #${id} was successful! Please collect your official Guest Pass from the Warden Office.`,
      'success',
      '/guest-pass'
    );
    
    // Also send an automated chat message from the Admin (ID: 1) to the Student
    await run(`
      INSERT INTO staff_messages (sender_id, receiver_id, subject, message, priority, category)
      VALUES (1, ?, 'Guest Pass Payment Confirmation', ?, 'High', 'Guest Pass')
    `, [req.user.id, `Hello, your payment for Guest Pass #${id} via ${payment_method} has been received successfully. Please collect your official Guest Pass from the Warden Office during working hours.`]);

    
    res.json({ success: true, message: `Pass paid successfully via ${payment_method}` });
  } catch (err) {
    console.error("GUEST POST ERR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllPasses(req, res) {
  try {
    await initGuestDB();
    
    // Auto-expire passes whose end_date has passed
    await run(`
      UPDATE guest_passes 
      SET status = 'Completed' 
      WHERE date(end_date) < date('now', 'localtime') AND status IN ('Approved', 'Active')
    `);

    const passes = await all(`
      SELECT p.*, s.roll_number, u.name as student_name
      FROM guest_passes p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, passes });
  } catch (err) {
    console.error("GUEST POST ERR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updatePassStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, allocated_room } = req.body;
    
    if (allocated_room) {
      await run("UPDATE guest_passes SET status = ?, allocated_room = ? WHERE id = ?", [status, allocated_room, id]);
    } else {
      await run("UPDATE guest_passes SET status = ? WHERE id = ?", [status, id]);
    }
    
    // Notify student
    const pass = await get("SELECT student_id FROM guest_passes WHERE id = ?", [id]);
    if (pass) {
      const student = await get("SELECT user_id FROM students WHERE id = ?", [pass.student_id]);
      if (student) {
        let msg = `Your guest pass has been marked as ${status}.`;
        if (allocated_room) msg = `Your guest pass is Approved! Room Allocated: ${allocated_room}.`;
        
        await createNotification(
          student.user_id,
          '🎟️ Guest Pass Update',
          msg,
          status === 'Approved' ? 'success' : 'info',
          '/guest-pass'
        );
      }
    }
    
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    console.error("GUEST POST ERR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}
