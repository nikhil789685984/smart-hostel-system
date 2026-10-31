import { get, all, run } from '../database/db.js';
import crypto from 'crypto';
import { createNotification } from './notificationController.js';

export async function initParcelDB() {
  await run(`
    CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      courier TEXT NOT NULL,
      tracking_number TEXT,
      status TEXT DEFAULT 'Awaiting_Collection',
      otp TEXT NOT NULL,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      collected_at DATETIME,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);
}

// Generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function receiveParcel(req, res) {
  try {
    await initParcelDB();
    const { student_id, courier, tracking_number } = req.body;
    const otp = generateOTP();

    const result = await run(
      "INSERT INTO parcels (student_id, courier, tracking_number, otp) VALUES (?, ?, ?, ?)",
      [student_id, courier, tracking_number, otp]
    );

    // Fetch user_id for the student to send notification
    const studentUser = await get("SELECT user_id FROM students WHERE id = ?", [student_id]);
    if (studentUser && studentUser.user_id) {
      await createNotification(
        studentUser.user_id,
        '📦 New Parcel Arrived!',
        `You have received a new parcel via ${courier}. Please check the Mailroom for OTP.`,
        'success',
        '/student/parcels'
      );
    }

    res.json({ success: true, message: 'Parcel logged and notification sent.', parcelId: result.lastID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllParcels(req, res) {
  try {
    await initParcelDB();
    const parcels = await all(`
      SELECT p.*, s.roll_number, u.name as student_name 
      FROM parcels p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY p.received_at DESC
    `);
    res.json({ success: true, parcels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMyParcels(req, res) {
  try {
    await initParcelDB();
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const parcels = await all("SELECT * FROM parcels WHERE student_id = ? ORDER BY received_at DESC", [student.id]);
    res.json({ success: true, parcels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyAndCollectParcel(req, res) {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const parcel = await get("SELECT * FROM parcels WHERE id = ?", [id]);
    if (!parcel) return res.status(404).json({ success: false, message: 'Parcel not found' });
    if (parcel.status === 'Collected') return res.status(400).json({ success: false, message: 'Parcel already collected' });

    if (parcel.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Verification failed.' });
    }

    await run("UPDATE parcels SET status = 'Collected', collected_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    res.json({ success: true, message: 'OTP Verified! Parcel successfully handed over.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
