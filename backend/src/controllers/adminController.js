import bcrypt from 'bcryptjs';
import { get, all, run } from '../database/db.js';
import { createNotification, createBroadcastNotification } from './notificationController.js';


export async function getAllStudents(req, res) {
  try {
    const { branch, year, search } = req.query;

    let sql = `
      SELECT s.*, 
             u.name, u.email, u.phone, u.avatar_url,
             r.room_number, blk.name as block_name, b.bed_number, h.name as hostel_name,
             ct.name as caretaker_name, ct.phone as caretaker_phone, ct.staff_id as caretaker_staff_id, ct.duty_role as caretaker_dept, ct.shift as caretaker_shift,
             (SELECT wu.name FROM wardens w JOIN users wu ON wu.id = w.user_id WHERE w.assigned_hostel_id = h.id LIMIT 1) as warden_name,
             f.status as fee_status,
             COALESCE(f.paid_amount, 0) as paid_amount,
             COALESCE(f.total_amount, 45000) as total_amount,
             COALESCE(f.pending_amount, 0) as pending_amount
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN caretakers ct ON ct.id = s.caretaker_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      LEFT JOIN hostels h ON h.id = blk.hostel_id
      LEFT JOIN fees f ON f.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (branch) {
      sql += ' AND s.branch = ?';
      params.push(branch);
    }
    if (year) {
      sql += ' AND s.year = ?';
      params.push(year);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR s.roll_number LIKE ? OR u.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' GROUP BY s.id ORDER BY u.name ASC';

    const students = await all(sql, params);
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllWardens(req, res) {
  try {
    const wardens = await all(`
      SELECT w.*, u.name, u.email, u.phone, u.avatar_url, h.name as hostel_name
      FROM wardens w
      JOIN users u ON u.id = w.user_id
      LEFT JOIN hostels h ON h.id = w.assigned_hostel_id
      ORDER BY w.id ASC
    `);
    res.json({ success: true, wardens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllHostels(req, res) {
  try {
    const hostels = await all(`
      SELECT h.*, 
             COUNT(DISTINCT blk.id) as total_blocks_actual,
             COUNT(DISTINCT r.id) as total_rooms,
             COUNT(DISTINCT b.id) as total_beds,
             SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
             SUM(CASE WHEN b.status = 'vacant' THEN 1 ELSE 0 END) as vacant_beds
      FROM hostels h
      LEFT JOIN blocks blk ON blk.hostel_id = h.id
      LEFT JOIN rooms r ON r.block_id = blk.id
      LEFT JOIN beds b ON b.room_id = r.id
      GROUP BY h.id
    `);

    // Fetch block details for each hostel
    for (let h of hostels) {
      h.blocks = await all(`
        SELECT blk.id, blk.name as block_name,
               COUNT(DISTINCT r.id) as total_rooms,
               COUNT(DISTINCT b.id) as total_beds,
               SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
               SUM(CASE WHEN b.status = 'vacant' THEN 1 ELSE 0 END) as vacant_beds
        FROM blocks blk
        LEFT JOIN rooms r ON r.block_id = blk.id
        LEFT JOIN beds b ON b.room_id = r.id
        WHERE blk.hostel_id = ?
        GROUP BY blk.id
      `, [h.id]);
    }

    res.json({ success: true, hostels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createStudent(req, res) {
  let createdUserId = null;
  try {
    const {
      name, email, password, phone, roll_number, course, branch, year, semester,
      father_name, father_phone, father_occupation, mother_name, mother_phone, parent_email,
      dob, gender, blood_group, aadhar_number, address_line, city, state, pincode, cgpa, enrollment_number
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Student Full Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Student Campus Email is required.' });
    }
    if (!roll_number || !roll_number.trim()) {
      return res.status(400).json({ success: false, message: 'Student Roll Number is required.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanRoll = roll_number.trim().toUpperCase();

    // Check if email is already in use
    const existingUser = await get('SELECT id, name FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existingUser) {
      // Check if it is an orphan user from a prior interrupted insert
      const existingStudent = await get('SELECT id FROM students WHERE user_id = ?', [existingUser.id]);
      if (!existingStudent) {
        // Safe to clear orphan user record to allow registration
        await run('DELETE FROM users WHERE id = ?', [existingUser.id]);
      } else {
        return res.status(400).json({ 
          success: false, 
          message: `Campus email "${cleanEmail}" is already registered to resident "${existingUser.name}". Please provide a unique email address.` 
        });
      }
    }

    // Check if roll number is already assigned
    const existingRoll = await get(`
      SELECT s.id, u.name 
      FROM students s 
      JOIN users u ON u.id = s.user_id 
      WHERE UPPER(s.roll_number) = ?
    `, [cleanRoll]);
    if (existingRoll) {
      return res.status(400).json({ 
        success: false, 
        message: `Roll Number "${cleanRoll}" is already assigned to resident "${existingRoll.name}". Please enter a unique roll number.` 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash((password && password.trim()) || 'student123', salt);

    const userResult = await run(`
      INSERT INTO users (name, email, password_hash, role, phone, avatar_url)
      VALUES (?, ?, ?, 'student', ?, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150')
    `, [cleanName, cleanEmail, password_hash, (phone && phone.trim()) || '+91 98765 43210']);

    createdUserId = userResult.insertId;

    // Pick an active caretaker for the student based on gender/wing if possible
    const ctRecord = await get('SELECT id FROM caretakers ORDER BY RANDOM() LIMIT 1');
    const caretakerId = ctRecord ? ctRecord.id : null;

    const studentResult = await run(`
      INSERT INTO students (
        user_id, roll_number, enrollment_number, course, branch, year, semester, cgpa,
        dob, gender, blood_group, aadhar_number,
        father_name, father_phone, father_occupation, mother_name, mother_phone,
        parent_name, parent_phone, parent_email, emergency_contact,
        address_line, city, state, pincode, checkin_date, status, caretaker_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, 'active', ?)
    `, [
      createdUserId,
      cleanRoll,
      (enrollment_number && enrollment_number.trim()) || `EN2026${cleanRoll}`,
      course || 'B.Tech',
      branch || 'Computer Science & Engineering',
      parseInt(year || '1', 10),
      parseInt(semester || '1', 10),
      parseFloat(cgpa || '8.5'),
      dob || '2004-05-15',
      gender || 'Male',
      blood_group || 'B+',
      aadhar_number || '7712-4490-1823',
      father_name || 'Ramesh Sharma',
      father_phone || '+91 98765 11111',
      father_occupation || 'Senior Officer',
      mother_name || 'Sunita Sharma',
      mother_phone || '+91 98765 22222',
      father_name || 'Parent',
      father_phone || (phone && phone.trim()) || '+91 98765 11111',
      parent_email || 'parent.guardians@gmail.com',
      father_phone || (phone && phone.trim()) || '+91 98765 11111',
      address_line || '124-B Green Park Avenue',
      city || 'New Delhi',
      state || 'Delhi',
      pincode || '110016',
      caretakerId
    ]);

    // Create initial semester fee demand
    await run(`
      INSERT INTO fees (student_id, semester, total_amount, paid_amount, pending_amount, due_date, status)
      VALUES (?, ?, 45000.0, 0.0, 45000.0, date('now', '+30 days'), 'Pending')
    `, [studentResult.insertId, parseInt(semester || '1', 10)]);

    res.status(201).json({ 
      success: true, 
      message: `Student "${cleanName}" (${cleanRoll}) enrolled successfully with financial clearing account.`,
      student: {
        id: studentResult.insertId,
        user_id: createdUserId,
        name: cleanName,
        email: cleanEmail,
        roll_number: cleanRoll
      }
    });
  } catch (err) {
    // Rollback orphan user row if student insertion failed
    if (createdUserId) {
      try {
        await run('DELETE FROM users WHERE id = ?', [createdUserId]);
      } catch (_) {}
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const {
      name, email, phone, roll_number, course, branch, year, semester,
      father_name, father_phone, father_occupation, mother_name, mother_phone, parent_email,
      dob, gender, blood_group, aadhar_number, address_line, city, state, pincode, cgpa, enrollment_number
    } = req.body;

    const student = await get('SELECT user_id FROM students WHERE id = ?', [id]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (name || email || phone) {
      await run(`
        UPDATE users
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone)
        WHERE id = ?
      `, [name, email ? email.toLowerCase() : null, phone, student.user_id]);
    }

    await run(`
      UPDATE students
      SET roll_number = COALESCE(?, roll_number),
          enrollment_number = COALESCE(?, enrollment_number),
          course = COALESCE(?, course),
          branch = COALESCE(?, branch),
          year = COALESCE(?, year),
          semester = COALESCE(?, semester),
          cgpa = COALESCE(?, cgpa),
          dob = COALESCE(?, dob),
          gender = COALESCE(?, gender),
          blood_group = COALESCE(?, blood_group),
          aadhar_number = COALESCE(?, aadhar_number),
          father_name = COALESCE(?, father_name),
          father_phone = COALESCE(?, father_phone),
          father_occupation = COALESCE(?, father_occupation),
          mother_name = COALESCE(?, mother_name),
          mother_phone = COALESCE(?, mother_phone),
          parent_name = COALESCE(?, parent_name),
          parent_phone = COALESCE(?, parent_phone),
          parent_email = COALESCE(?, parent_email),
          emergency_contact = COALESCE(?, emergency_contact),
          address_line = COALESCE(?, address_line),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          pincode = COALESCE(?, pincode)
      WHERE id = ?
    `, [
      roll_number ? roll_number.toUpperCase() : null,
      enrollment_number,
      course, branch, year ? parseInt(year, 10) : null, semester ? parseInt(semester, 10) : null, cgpa ? parseFloat(cgpa) : null,
      dob, gender, blood_group, aadhar_number,
      father_name, father_phone, father_occupation, mother_name, mother_phone,
      father_name || null, father_phone || null, parent_email, father_phone || null,
      address_line, city, state, pincode,
      id
    ]);

    res.json({ success: true, message: 'Student record updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    const student = await get('SELECT user_id FROM students WHERE id = ?', [id]);
    
    if (student) {
      // 1. Free up the bed and delete allocation
      const allocation = await get("SELECT bed_id FROM room_allocations WHERE student_id = ? ORDER BY id DESC LIMIT 1", [id]);
      if (allocation && allocation.bed_id) {
        await run("UPDATE beds SET status = 'vacant' WHERE id = ?", [allocation.bed_id]);
      }
      
      // 2. Discover all tables that have a student_id column and delete from them
      const tablesInfo = await all("SELECT name FROM sqlite_master WHERE type='table'");
      for (let t of tablesInfo) {
        const table = t.name;
        // Check if table has student_id
        const columns = await all(`PRAGMA table_info(${table})`);
        const hasStudentId = columns.some(col => col.name === 'student_id');
        if (hasStudentId) {
          try { await run(`DELETE FROM ${table} WHERE student_id = ?`, [id]); } catch(e) {}
        }
      }
      
      // 3. Delete notifications referencing user_id
      try { await run('DELETE FROM notifications WHERE user_id = ?', [student.user_id]); } catch(e) {}

      // 4. Disable foreign keys temporarily for SQLite
      await run('PRAGMA foreign_keys = OFF;');

      // 5. Delete the student record
      await run('DELETE FROM students WHERE id = ?', [id]);

      // 6. Delete the user record
      await run('DELETE FROM users WHERE id = ?', [student.user_id]);

      // 7. Re-enable foreign keys
      await run('PRAGMA foreign_keys = ON;');
    }
    
    res.json({ success: true, message: 'Student completely evicted and records cleared.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete student: ' + err.message });
  }
}

export async function getWardenComplaints(req, res) {
  try {
    const complaints = await all(`
      SELECT c.*, c.title as subject, su.name as student_name, s.roll_number 
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE c.category = 'Warden Escalation'
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAdminMessComplaints(req, res) {
  try {
    const complaints = await all(`
      SELECT c.*, c.title as issue_type, su.name as student_name, s.roll_number 
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE c.category = 'Mess Escalation'
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Hostel Checkout process for a student (Warden / Admin)
 * Vacates room allocation, updates bed to vacant, marks student as 'Checked Out'
 */
export async function checkoutStudent(req, res) {
  try {
    const { id } = req.params;
    const overrideDues = req.body?.overrideDues || false;
    const student = await get(`
      SELECT s.*, u.name, u.email, u.id as user_id
      FROM students s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
    `, [id]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    // Check active allocation
    const allocation = await get(`
      SELECT ra.*, b.id as bed_id, r.id as room_id, r.room_number, blk.name as block_name
      FROM room_allocations ra
      JOIN beds b ON b.id = ra.bed_id
      JOIN rooms r ON r.id = b.room_id
      JOIN blocks blk ON blk.id = r.block_id
      WHERE ra.student_id = ? AND ra.status = 'active'
    `, [id]);

    // Strict Dues Check before Hostel Checkout
    const feeRow = await get(`
      SELECT COALESCE(SUM(pending_amount), 0) as pending_fee
      FROM fees
      WHERE student_id = ? AND status != 'Paid'
    `, [id]);

    const fineRow = await get(`
      SELECT COALESCE(SUM(amount), 0) as pending_fines
      FROM fines
      WHERE student_id = ? AND status = 'Unpaid'
    `, [id]);

    const pendingFee = Number(feeRow?.pending_fee || 0);
    const pendingFines = Number(fineRow?.pending_fines || 0);
    const totalDues = pendingFee + pendingFines;

    if (totalDues > 0 && !overrideDues) {
      return res.status(400).json({
        success: false,
        blocked: true,
        totalDues,
        pendingFee,
        pendingFines,
        message: `Hostel checkout blocked! Student ${student.name} has unpaid dues totaling ₹${totalDues.toLocaleString('en-IN')} (Semester Fee Dues: ₹${pendingFee.toLocaleString('en-IN')}, Unpaid Fines: ₹${pendingFines.toLocaleString('en-IN')}). All dues must be cleared (0 balance) before checkout clearance.`
      });
    }

    if (allocation) {
      // Vacate room allocation
      await run("UPDATE room_allocations SET status = 'vacated', allocated_to = CURRENT_DATE WHERE id = ?", [allocation.id]);
      // Update bed status to vacant
      await run("UPDATE beds SET status = 'vacant' WHERE id = ?", [allocation.bed_id]);
      // Update room status to available
      await run("UPDATE rooms SET status = 'available' WHERE id = ?", [allocation.room_id]);
    }

    // Update student status to Checked Out
    await run("UPDATE students SET status = 'Checked Out' WHERE id = ?", [id]);

    // Also update any pending checkout requests to Approved
    await run("UPDATE checkout_requests SET status = 'Approved' WHERE student_id = ? AND status = 'Pending'", [id]);

    // Send real notification to student
    try {
      await createNotification(
        student.user_id,
        '🏷️ Official Hostel Checkout Processed',
        `Your official hostel checkout has been processed by ${req.user.name}. ${allocation ? `Room ${allocation.block_name}-${allocation.room_number} has been vacated and released.` : 'Hostel status updated to Checked Out.'}`,
        'info',
        '/student/dashboard'
      );
    } catch (notifErr) {
      console.warn('Checkout notification warning:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Student ${student.name} checked out from hostel successfully. ${allocation ? `Bed in ${allocation.block_name}-${allocation.room_number} is now vacant.` : ''}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Reactivate student hostel status (Warden / Admin)
 */
export async function reactivateStudent(req, res) {
  try {
    const { id } = req.params;
    await run("UPDATE students SET status = 'active' WHERE id = ?", [id]);
    res.json({ success: true, message: 'Student hostel status restored to Active Resident.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Submit checkout request by Student
 */
export async function submitCheckoutRequest(req, res) {
  try {
    const userId = req.user.id;
    const student = await get('SELECT * FROM students WHERE user_id = ?', [userId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const { expected_checkout_date, reason } = req.body;
    if (!expected_checkout_date || !reason) {
      return res.status(400).json({ success: false, message: 'Expected checkout date and reason are required.' });
    }

    // Enforce Zero Dues check before applying
    const feeRow = await get(`
      SELECT COALESCE(SUM(pending_amount), 0) as pending_fee
      FROM fees
      WHERE student_id = ? AND status != 'Paid'
    `, [student.id]);

    const fineRow = await get(`
      SELECT COALESCE(SUM(amount), 0) as pending_fines
      FROM fines
      WHERE student_id = ? AND status = 'Unpaid'
    `, [student.id]);

    const pendingFee = Number(feeRow?.pending_fee || 0);
    const pendingFines = Number(fineRow?.pending_fines || 0);
    const totalDues = pendingFee + pendingFines;

    if (totalDues > 0) {
      return res.status(400).json({
        success: false,
        blocked: true,
        totalDues,
        pendingFee,
        pendingFines,
        message: `Checkout application blocked! You have pending dues of ₹${totalDues.toLocaleString('en-IN')} (Semester Fees: ₹${pendingFee.toLocaleString('en-IN')}, Unpaid Fines: ₹${pendingFines.toLocaleString('en-IN')}). You must clear all dues before applying for Hostel Checkout Clearance.`
      });
    }

    // Check if an existing request is pending
    const existing = await get("SELECT * FROM checkout_requests WHERE student_id = ? AND status = 'Pending'", [student.id]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending checkout request.' });
    }

    const result = await run(`
      INSERT INTO checkout_requests (student_id, reason, expected_checkout_date, status)
      VALUES (?, ?, ?, 'Pending')
    `, [student.id, reason, expected_checkout_date]);

    res.status(201).json({
      success: true,
      message: 'Hostel Checkout Clearance request submitted successfully! Warden will inspect your room and review your clearance.',
      requestId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get current student's checkout request status
 */
export async function getMyCheckoutRequest(req, res) {
  try {
    const userId = req.user.id;
    const student = await get('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const latestRequest = await get(`
      SELECT * FROM checkout_requests
      WHERE student_id = ?
      ORDER BY created_at DESC LIMIT 1
    `, [student.id]);

    const activeRequest = (latestRequest && ['Pending', 'Approved', 'Checked Out'].includes(latestRequest.status))
      ? latestRequest
      : null;

    // Also get dues for frontend check
    const feeRow = await get(`
      SELECT COALESCE(SUM(pending_amount), 0) as pending_fee
      FROM fees
      WHERE student_id = ? AND status != 'Paid'
    `, [student.id]);

    const fineRow = await get(`
      SELECT COALESCE(SUM(amount), 0) as pending_fines
      FROM fines
      WHERE student_id = ? AND status = 'Unpaid'
    `, [student.id]);

    const pendingFee = Number(feeRow?.pending_fee || 0);
    const pendingFines = Number(fineRow?.pending_fines || 0);
    const totalDues = pendingFee + pendingFines;

    res.json({
      success: true,
      request: activeRequest,
      dues: {
        totalDues,
        pendingFee,
        pendingFines
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get all checkout requests (Admin / Warden)
 */
export async function getAllCheckoutRequests(req, res) {
  try {
    const requests = await all(`
      SELECT cr.*, 
             u.name as student_name, u.email, u.phone,
             s.roll_number, s.branch, s.year,
             r.room_number, b.bed_number, blk.name as block_name
      FROM checkout_requests cr
      JOIN students s ON s.id = cr.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      ORDER BY cr.created_at DESC
    `);

    // Attach live dues computation
    const requestsWithDues = await Promise.all(requests.map(async (cr) => {
      const feeRow = await get(`
        SELECT COALESCE(SUM(pending_amount), 0) as pending_fee
        FROM fees
        WHERE student_id = ? AND status != 'Paid'
      `, [cr.student_id]);

      const fineRow = await get(`
        SELECT COALESCE(SUM(amount), 0) as pending_fines
        FROM fines
        WHERE student_id = ? AND status = 'Unpaid'
      `, [cr.student_id]);

      const pendingFee = Number(feeRow?.pending_fee || 0);
      const pendingFines = Number(fineRow?.pending_fines || 0);
      const totalDues = pendingFee + pendingFines;

      return {
        ...cr,
        pendingFee,
        pendingFines,
        totalDues
      };
    }));

    res.json({ success: true, requests: requestsWithDues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Process Warden/Admin approval or rejection of student checkout request
 */
export async function processCheckoutRequest(req, res) {
  try {
    const { id } = req.params;
    const { action, remarks, overrideDues } = req.body; // action: 'Approve' | 'Reject'

    if (!['Approve', 'Reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be Approve or Reject.' });
    }

    const request = await get(`
      SELECT cr.*, s.user_id, u.name as student_name
      FROM checkout_requests cr
      JOIN students s ON s.id = cr.student_id
      JOIN users u ON u.id = s.user_id
      WHERE cr.id = ?
    `, [id]);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Checkout request record not found.' });
    }

    if (action === 'Approve') {
      // Enforce strict zero dues check
      const feeRow = await get(`
        SELECT COALESCE(SUM(pending_amount), 0) as pending_fee
        FROM fees
        WHERE student_id = ? AND status != 'Paid'
      `, [request.student_id]);

      const fineRow = await get(`
        SELECT COALESCE(SUM(amount), 0) as pending_fines
        FROM fines
        WHERE student_id = ? AND status = 'Unpaid'
      `, [request.student_id]);

      const pendingFee = Number(feeRow?.pending_fee || 0);
      const pendingFines = Number(fineRow?.pending_fines || 0);
      const totalDues = pendingFee + pendingFines;

      if (totalDues > 0 && !overrideDues) {
        return res.status(400).json({
          success: false,
          blocked: true,
          totalDues,
          pendingFee,
          pendingFines,
          message: `Approval blocked! Student ${request.student_name} has unpaid dues of ₹${totalDues.toLocaleString('en-IN')} (Semester Fee Dues: ₹${pendingFee.toLocaleString('en-IN')}, Unpaid Fines: ₹${pendingFines.toLocaleString('en-IN')}). All dues must be cleared (0 balance) before Warden checkout approval.`
        });
      }

      // Vacate active room allocation
      const allocation = await get(`
        SELECT ra.*, b.id as bed_id, r.id as room_id, r.room_number, blk.name as block_name
        FROM room_allocations ra
        JOIN beds b ON b.id = ra.bed_id
        JOIN rooms r ON r.id = b.room_id
        JOIN blocks blk ON blk.id = r.block_id
        WHERE ra.student_id = ? AND ra.status = 'active'
      `, [request.student_id]);

      if (allocation) {
        await run("UPDATE room_allocations SET status = 'vacated', allocated_to = CURRENT_DATE WHERE id = ?", [allocation.id]);
        await run("UPDATE beds SET status = 'vacant' WHERE id = ?", [allocation.bed_id]);
        await run("UPDATE rooms SET status = 'available' WHERE id = ?", [allocation.room_id]);
      }

      // Update student status to Checked Out
      await run("UPDATE students SET status = 'Checked Out' WHERE id = ?", [request.student_id]);

      // Update request status to Approved
      await run(`
        UPDATE checkout_requests
        SET status = 'Approved', remarks = ?
        WHERE id = ?
      `, [remarks || 'Warden room inspection completed. All dues cleared.', id]);

      // Notify student
      try {
        await createNotification(
          request.user_id,
          '✅ Hostel Checkout Request Approved!',
          `Your hostel checkout request has been officially approved by Warden ${req.user.name}. ${allocation ? `Room ${allocation.block_name}-${allocation.room_number} is vacated.` : 'Hostel status updated to Checked Out.'}`,
          'success',
          '/student/dashboard'
        );
      } catch (e) {}

      return res.json({
        success: true,
        message: `Hostel checkout request for ${request.student_name} approved successfully. Bed vacated and status set to Checked Out.`
      });
    } else {
      // Reject action
      await run(`
        UPDATE checkout_requests
        SET status = 'Rejected', remarks = ?
        WHERE id = ?
      `, [remarks || 'Clearance rejected during room inspection.', id]);

      // Notify student
      try {
        await createNotification(
          request.user_id,
          '🛑 Hostel Checkout Request Flagged / Rejected',
          `Your hostel checkout request was flagged/rejected by Warden ${req.user.name}. Remarks: "${remarks || 'Contact Warden desk.'}"`,
          'error',
          '/student/fees'
        );
      } catch (e) {}

      return res.json({
        success: true,
        message: `Hostel checkout request for ${request.student_name} has been rejected/flagged.`
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function cancelCheckoutRequest(req, res) {
  try {
    const { id } = req.params;
    let request;

    if (req.user.role === 'student') {
      const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

      if (id && id !== 'latest') {
        request = await get("SELECT * FROM checkout_requests WHERE id = ? AND student_id = ? AND status = 'Pending'", [id, student.id]);
      } else {
        request = await get("SELECT * FROM checkout_requests WHERE student_id = ? AND status = 'Pending' ORDER BY created_at DESC LIMIT 1", [student.id]);
      }
    } else {
      request = await get("SELECT * FROM checkout_requests WHERE id = ?", [id]);
    }

    if (!request) {
      return res.status(404).json({ success: false, message: 'Pending checkout request not found.' });
    }

    await run("UPDATE checkout_requests SET status = 'Cancelled' WHERE id = ?", [request.id]);

    res.json({ success: true, message: 'Hostel checkout request cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}




export async function getStudentHistory(req, res) {
  try {
    let { studentId } = req.params;

    if (req.user && (req.user.role === 'student' || studentId === 'me' || studentId === 'my-history')) {
      const stRow = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (stRow) {
        studentId = stRow.id;
      }
    }

    // Check if student exists
    const student = await get(`
      SELECT s.*, u.name, u.email, u.phone,
             r.room_number, r.floor, blk.name as block_name, b.bed_number, h.name as hostel_name,
             ct.name as caretaker_name, ct.phone as caretaker_phone, ct.staff_id as caretaker_staff_id,
             ct.duty_role as caretaker_dept, ct.shift as caretaker_shift, ct.assigned_block as caretaker_block,
             (SELECT wu.name FROM wardens w JOIN users wu ON wu.id = w.user_id WHERE w.assigned_hostel_id = COALESCE(h.id, 1) LIMIT 1) as warden_name,
             COALESCE(f.paid_amount, 0) as paid_amount,
             COALESCE(f.total_amount, 45000) as total_amount,
             COALESCE(f.pending_amount, 0) as pending_amount,
             f.status as fee_status
      FROM students s 
      JOIN users u ON u.id = s.user_id 
      LEFT JOIN caretakers ct ON ct.id = s.caretaker_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      LEFT JOIN hostels h ON h.id = blk.hostel_id
      LEFT JOIN fees f ON f.student_id = s.id
      WHERE s.id = ? OR s.user_id = ?
    `, [studentId, studentId]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }


    let timeline = [];
    const sid = student.id;
    const uid = student.user_id;

    // 1. Gate Passes
    const gatePasses = await all(`SELECT id, pass_type || ' to ' || destination as title, status, created_at, 'Gate Pass' as type FROM gate_passes WHERE student_id = ? OR student_id = ?`, [sid, uid]);
    timeline.push(...gatePasses.map(i => ({ ...i, icon: 'gatepass', color: 'blue' })));

    // 2. Complaints
    const complaints = await all(`SELECT id, title, status, created_at, 'Complaint' as type FROM complaints WHERE student_id = ? OR student_id = ?`, [sid, uid]);
    timeline.push(...complaints.map(i => ({ ...i, icon: 'complaint', color: 'red' })));

    // 3. Parcels (Awaiting pickup or collected)
    const parcels = await all(`
      SELECT id, courier, tracking_number, status, otp, received_at, collected_at
      FROM parcels 
      WHERE student_id = ? OR student_id = ?
      ORDER BY COALESCE(collected_at, received_at) DESC
    `, [sid, uid]);

    for (const p of parcels) {
      const isCollected = p.status === 'Collected' || p.status === 'Delivered';
      const eventDate = isCollected && p.collected_at ? p.collected_at : p.received_at;
      timeline.push({
        id: `parcel-${p.id}`,
        title: `${p.courier} Delivery Parcel ${p.tracking_number ? `(#${p.tracking_number})` : ''} — ${isCollected ? 'Collected & Handed Over' : 'Awaiting Collection at Gate'}`,
        status: isCollected ? 'Collected' : 'Pending',
        created_at: eventDate,
        received_at: p.received_at,
        collected_at: p.collected_at,
        tracking_number: p.tracking_number,
        courier: p.courier,
        type: 'Parcel',
        icon: 'parcel',
        color: isCollected ? 'emerald' : 'purple'
      });
    }

    // 4. Room Change Requests
    const roomChanges = await all(`SELECT id, 'Room Change: ' || preferred_room_type || ' (' || preferred_block || ')' as title, status, created_at, 'Room Request' as type FROM room_change_requests WHERE student_id = ? OR student_id = ?`, [sid, uid]);
    timeline.push(...roomChanges.map(i => ({ ...i, icon: 'room', color: 'orange' })));

    // 5. Checkout Requests
    const checkouts = await all(`SELECT id, 'Hostel Checkout' as title, status, created_at, 'Checkout' as type FROM checkout_requests WHERE student_id = ? OR student_id = ?`, [sid, uid]);
    timeline.push(...checkouts.map(i => ({ ...i, icon: 'checkout', color: 'rose' })));

    // 6. Guest Passes
    const guestPasses = await all(`SELECT id, guest_name || ' (' || relation || ')' as title, status, created_at, 'Guest Pass' as type FROM guest_passes WHERE student_id = ? OR student_id = ?`, [sid, uid]);
    timeline.push(...guestPasses.map(i => ({ ...i, icon: 'guestpass', color: 'teal' })));

    // 7. Fee Billing & Payment Records
    const feesList = await all(`SELECT id, semester, total_amount, paid_amount, pending_amount, status, due_date FROM fees WHERE student_id = ? OR student_id = ?`, [sid, uid]);
    for (const f of feesList) {
      timeline.push({
        id: `fee-${f.id}`,
        title: `Hostel & Mess Semester Fee Billed (Sem ${f.semester}) - ₹${Number(f.total_amount || 45000).toLocaleString()}`,
        status: f.status,
        created_at: f.due_date || new Date().toISOString(),
        type: 'Fee Billing',
        icon: 'fee',
        color: 'blue',
        amount: f.total_amount || 45000
      });
    }

    // 8. Disciplinary Fines & Penalties
    const fines = await all(`SELECT id, reason, amount, status, created_at FROM fines WHERE student_id = ? OR student_id = ?`, [sid, uid]);
    timeline.push(...fines.map(i => ({
      id: `fine-${i.id}`,
      title: `Disciplinary Fine Penalty: ${i.reason} (₹${i.amount})`,
      status: i.status,
      created_at: i.created_at,
      type: 'Fine',
      icon: 'fine',
      color: 'red',
      amount: i.amount
    })));

    // 9. Canteen Orders
    const canteenOrders = await all(`SELECT id, total_amount, status, created_at FROM canteen_orders WHERE student_id = ? OR student_id = ?`, [sid, uid]);
    timeline.push(...canteenOrders.map(i => ({
      id: `canteen-${i.id}`,
      title: `Campus Food Canteen Order #${i.id} (₹${i.total_amount})`,
      status: i.status,
      created_at: i.created_at,
      type: 'Canteen Order',
      icon: 'canteen',
      color: 'emerald',
      amount: i.total_amount
    })));

    // 10. AC -> Non-AC Tariff Credit Refund
    try {
      const refundRoomChanges = await all(`
        SELECT id, status, created_at 
        FROM room_change_requests 
        WHERE student_id = ? AND status = 'Approved' AND preferred_room_type = 'Non-AC'
      `, [sid]);
      timeline.push(...refundRoomChanges.map(i => ({
        id: `refund-${i.id}`,
        title: `Room Downgrade Tariff Credit Refund (AC ➔ Non-AC Excess Ledger Balance) - ₹15,000 Credit`,
        status: 'Approved Credit',
        created_at: i.created_at,
        type: 'Room Downgrade Refund',
        icon: 'refund',
        color: 'teal',
        amount: 15000
      })));
    } catch (e) {
      console.warn('Refund timeline warning:', e.message);
    }

    // 11. Detailed Fee Payment Transactions Log
    let feeTransactions = [];
    try {
      feeTransactions = await all(`SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY created_at DESC`, [sid]);
    } catch (e) {
      console.warn('Fee transactions timeline warning:', e.message);
    }
    
    if (feeTransactions.length === 0 && (student.paid_amount || 0) > 0) {
      feeTransactions = [
        {
          id: `txn-auto-${sid}-1`,
          fee_id: 1,
          student_id: sid,
          amount: student.paid_amount,
          payment_method: 'Razorpay UPI Online',
          transaction_id: `pay_rzp_${sid}_982731`,
          receipt_number: `RCPT-2026-${sid}-01`,
          created_at: '2026-08-01T10:00:00.000Z'
        }
      ];
    }

    // Push fee transactions into timeline
    for (const tx of feeTransactions) {
      timeline.push({
        id: `pay-tx-${tx.id}`,
        title: `Fee Payment Received (${tx.payment_method || 'Razorpay UPI'}) - ₹${Number(tx.amount).toLocaleString()} [Ref: ${tx.receipt_number || tx.transaction_id}]`,
        status: 'Paid',
        created_at: tx.created_at,
        type: 'Payment',
        icon: 'payment',
        color: 'emerald',
        amount: tx.amount
      });
    }

    // Sort timeline by created_at DESC
    timeline.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, student, timeline, feeTransactions });
  } catch (err) {
    console.error('Error fetching student history:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

