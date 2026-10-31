import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { get, run, all } from '../database/db.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check and try again.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Fetch extra role details
    let studentData = null;
    let wardenData = null;

    if (user.role === 'student') {
      studentData = await get(`
        SELECT s.*, 
               r.room_number, r.floor, r.room_type, r.fee_per_semester,
               b.bed_number, blk.name as block_name, h.name as hostel_name,
               ct.name as caretaker_name, ct.phone as caretaker_phone, ct.email as caretaker_email,
               ct.staff_id as caretaker_staff_id, ct.shift as caretaker_shift, ct.duty_role as caretaker_role,
               ct.assigned_block as caretaker_block, ct.floor as caretaker_floor,
               (SELECT wu.name FROM wardens w JOIN users wu ON wu.id = w.user_id WHERE w.assigned_hostel_id = h.id LIMIT 1) as warden_name
        FROM students s
        LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
        LEFT JOIN beds b ON b.id = ra.bed_id
        LEFT JOIN rooms r ON r.id = b.room_id
        LEFT JOIN blocks blk ON blk.id = r.block_id
        LEFT JOIN hostels h ON h.id = blk.hostel_id
        LEFT JOIN caretakers ct ON ct.id = s.caretaker_id
        WHERE s.user_id = ?
      `, [user.id]);
    } else if (user.role === 'warden') {
      wardenData = await get(`
        SELECT w.*, h.name as hostel_name
        FROM wardens w
        LEFT JOIN hostels h ON h.id = w.assigned_hostel_id
        WHERE w.user_id = ?
      `, [user.id]);
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url,
        student: studentData,
        warden: wardenData,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, phone, roll_number, course, branch, year, parent_name, parent_phone } = req.body;

    if (!name || !email || !password || !roll_number) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and roll number are required.' });
    }

    // Check duplicate
    const existing = await get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userResult = await run(
      `INSERT INTO users (name, email, password_hash, role, phone, avatar_url) VALUES (?, ?, ?, 'student', ?, ?)`,
      [name, email.trim().toLowerCase(), password_hash, phone || null, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150']
    );

    const userId = userResult.insertId;

    const studentResult = await run(`
      INSERT INTO students (user_id, roll_number, course, branch, year, semester, blood_group, parent_name, parent_phone, emergency_contact, checkin_date, status)
      VALUES (?, ?, ?, ?, ?, 1, 'B+', ?, ?, ?, CURRENT_DATE, 'active')
    `, [
      userId,
      roll_number.toUpperCase(),
      course || 'B.Tech',
      branch || 'Computer Science & Engineering',
      parseInt(year || '1', 10),
      parent_name || 'Guardian',
      parent_phone || phone || '+91 90000 00000',
      parent_phone || phone || '+91 90000 00000'
    ]);

    // Create initial fee invoice
    await run(`
      INSERT INTO fees (student_id, semester, total_amount, paid_amount, pending_amount, due_date, status)
      VALUES (?, 1, 45000.0, 0.0, 45000.0, date('now', '+30 days'), 'Pending')
    `, [studentResult.insertId]);

    const token = jwt.sign(
      { id: userId, email: email.toLowerCase(), role: 'student' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      token,
      user: {
        id: userId,
        name,
        email,
        role: 'student',
        phone,
        student: {
          id: studentResult.insertId,
          roll_number,
          course: course || 'B.Tech',
          branch: branch || 'Computer Science & Engineering',
          year: parseInt(year || '1', 10)
        }
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error while registering student: ' + err.message });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await get('SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let student = null;
    let warden = null;

    if (user.role === 'student') {
      student = await get(`
        SELECT s.*, 
               r.id as room_id, r.room_number, r.floor, r.room_type, r.fee_per_semester,
               b.id as bed_id, b.bed_number, blk.name as block_name, h.name as hostel_name
        FROM students s
        LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
        LEFT JOIN beds b ON b.id = ra.bed_id
        LEFT JOIN rooms r ON r.id = b.room_id
        LEFT JOIN blocks blk ON blk.id = r.block_id
        LEFT JOIN hostels h ON h.id = blk.hostel_id
        WHERE s.user_id = ?
      `, [user.id]);
    } else if (user.role === 'warden') {
      warden = await get(`
        SELECT w.*, h.name as hostel_name
        FROM wardens w
        LEFT JOIN hostels h ON h.id = w.assigned_hostel_id
        WHERE w.user_id = ?
      `, [user.id]);
    }

    res.json({
      success: true,
      user: {
        ...user,
        student,
        warden
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  
  // For demo/viva purposes, return simulated password reset link
  res.json({
    success: true,
    message: `Password reset verification instructions sent to ${email}. For local testing, your password remains active.`
  });
}
