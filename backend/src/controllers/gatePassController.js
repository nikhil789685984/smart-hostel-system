import { get, all, run } from '../database/db.js';
import { createNotification, createBroadcastNotification } from './notificationController.js';

export async function applyGatePass(req, res) {
  try {
    const { pass_type, destination, reason, departure_time, expected_return } = req.body;

    if (!destination || !reason || !departure_time || !expected_return) {
      return res.status(400).json({ success: false, message: 'Destination, reason, departure time, and return time are required.' });
    }

    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const qrToken = `GP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}-${req.user.name.split(' ')[0].toUpperCase()}`;

    const result = await run(`
      INSERT INTO gate_passes (student_id, pass_type, destination, reason, departure_time, expected_return, status, qr_token)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
    `, [
      student.id,
      pass_type || 'Day Outing',
      destination,
      reason,
      departure_time,
      expected_return,
      qrToken
    ]);

    // 1. Notify Student Confirmation
    try {
      await createNotification(
        req.user.id,
        '🎫 Gate Pass Request Submitted',
        `Your ${pass_type || 'Day Outing'} request to "${destination}" has been dispatched for Warden review. Token: ${qrToken}`,
        'gate_pass',
        '/student/gate-pass'
      );
    } catch (e) {}

    // 2. Notify All Wardens & Admins
    try {
      await createBroadcastNotification(
        ['warden', 'admin'],
        `🎫 New Gate Pass: ${req.user.name}`,
        `${req.user.name} applied for ${pass_type || 'Day Outing'} to "${destination}". Departure: ${departure_time}.`,
        'gate_pass',
        '/warden/gate-passes'
      );
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Gate pass request submitted for Warden approval.',
      passId: result.insertId,
      qrToken
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMyGatePasses(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const passes = await all(`
      SELECT gp.*, u.name as approved_by_name
      FROM gate_passes gp
      LEFT JOIN users u ON u.id = gp.approved_by_user_id
      WHERE gp.student_id = ?
      ORDER BY gp.created_at DESC
    `, [student.id]);

    res.json({ success: true, passes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllGatePasses(req, res) {
  try {
    const { status } = req.query;

    let sql = `
      SELECT gp.*, 
             u.name as student_name, u.phone as student_phone,
             s.roll_number, s.parent_phone, s.branch,
             r.room_number, blk.name as block_name
      FROM gate_passes gp
      JOIN students s ON s.id = gp.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND gp.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY gp.created_at DESC';

    const passes = await all(sql, params);
    res.json({ success: true, passes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateGatePassStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, warden_remarks } = req.body;

    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Departed', 'Returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid gate pass status.' });
    }

    await run(`
      UPDATE gate_passes
      SET status = ?, approved_by_user_id = ?, warden_remarks = ?
      WHERE id = ?
    `, [status, req.user.id, warden_remarks || null, id]);

    // Send notification to student
    try {
      const pass = await get(`
        SELECT gp.*, s.user_id 
        FROM gate_passes gp 
        JOIN students s ON s.id = gp.student_id 
        WHERE gp.id = ?
      `, [id]);
      if (pass) {
        await createNotification(
          pass.user_id,
          `🎫 Gate Pass ${status}: ${pass.pass_type}`,
          `Your ${pass.pass_type} request to "${pass.destination}" was marked ${status} by ${req.user.name}.${warden_remarks ? ' Remarks: ' + warden_remarks : ''}`,
          status === 'Approved' ? 'success' : status === 'Rejected' ? 'warning' : 'gate_pass',
          '/student/gate-pass'
        );

        if (status === 'Departed' || status === 'Returned') {
          const studentInfo = await get('SELECT u.name FROM users u WHERE u.id = ?', [pass.user_id]);
          await createBroadcastNotification(
            ['warden', 'admin'],
            `🚶 Turnstile ${status}: ${studentInfo?.name || 'Resident'}`,
            `${studentInfo?.name || 'Resident'} has ${status.toLowerCase()} for "${pass.destination}". Logged by ${req.user.name}.`,
            'gate_pass',
            '/warden/gate-passes',
            req.user.id
          );
        }
      }
    } catch (notifErr) {
      console.warn('Failed to send gate pass notification:', notifErr.message);
    }

    res.json({ success: true, message: `Gate pass marked as ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateMyGatePass(req, res) {
  try {
    const { id } = req.params;
    const { pass_type, destination, reason, departure_time, expected_return } = req.body;

    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const pass = await get('SELECT * FROM gate_passes WHERE id = ? AND student_id = ?', [id, student.id]);
    if (!pass) return res.status(404).json({ success: false, message: 'Gate pass not found.' });

    if (pass.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending gate passes can be modified.' });
    }

    await run(`
      UPDATE gate_passes
      SET pass_type = ?, destination = ?, reason = ?, departure_time = ?, expected_return = ?
      WHERE id = ? AND student_id = ?
    `, [
      pass_type || pass.pass_type,
      destination || pass.destination,
      reason || pass.reason,
      departure_time || pass.departure_time,
      expected_return || pass.expected_return,
      id,
      student.id
    ]);

    const updatedPass = await get('SELECT * FROM gate_passes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Gate pass updated successfully.',
      pass: updatedPass
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function cancelMyGatePass(req, res) {
  try {
    const { id } = req.params;

    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const pass = await get('SELECT * FROM gate_passes WHERE id = ? AND student_id = ?', [id, student.id]);
    if (!pass) return res.status(404).json({ success: false, message: 'Gate pass not found.' });

    if (pass.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending gate passes can be cancelled.' });
    }

    await run('DELETE FROM gate_passes WHERE id = ? AND student_id = ?', [id, student.id]);

    res.json({ success: true, message: 'Gate pass request withdrawn and deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

