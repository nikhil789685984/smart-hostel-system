import { get, all, run } from '../database/db.js';
import { classifyComplaint } from '../services/aiService.js';
import { createNotification, createBroadcastNotification } from './notificationController.js';

export async function aiTriage(req, res) {
  try {
    const { title, description } = req.body;
    if (!description && !title) {
      return res.status(400).json({ success: false, message: 'Title or description is required for AI triage.' });
    }

    const suggestion = await classifyComplaint(title, description);
    res.json({ success: true, suggestion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createComplaint(req, res) {
  try {
    const { title, description, category, location, priority, department, image_url } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ success: false, message: 'Title, description, and location are required.' });
    }

    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const result = await run(`
      INSERT INTO complaints (student_id, title, description, category, location, priority, department, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [
      student.id,
      title,
      description,
      category || 'Other',
      location,
      priority || 'Medium',
      department || 'Maintenance',
      image_url || null
    ]);

    const complaintId = result.insertId;

    // Log initial update
    await run(`
      INSERT INTO complaint_updates (complaint_id, updated_by_user_id, status, notes)
      VALUES (?, ?, 'Pending', 'Complaint submitted by student.')
    `, [complaintId, req.user.id]);

    // 1. Notify Student Confirmation
    try {
      await createNotification(
        req.user.id,
        `🔧 Complaint #${complaintId} Registered`,
        `Your ${category || 'Maintenance'} ticket "${title}" was received and assigned to ${department || 'Maintenance'}.`,
        'complaint',
        '/student/complaints'
      );
    } catch (e) {}

    // 2. Notify All Wardens & Admins
    try {
      await createBroadcastNotification(
        ['warden', 'admin'],
        `🔧 New Complaint: ${category || 'Maintenance'} (${priority || 'Medium'})`,
        `${req.user.name} reported "${title}" at ${location}. Ticket #${complaintId}.`,
        'complaint',
        '/warden/complaints'
      );
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Complaint registered successfully.',
      complaintId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getComplaints(req, res) {
  try {
    const { category, status, priority, search } = req.query;
    let sql = `
      SELECT c.*, 
             u.name as student_name, u.phone as student_phone, u.avatar_url as student_avatar,
             s.roll_number, s.branch,
             r.room_number, blk.name as block_name
      FROM complaints c
      JOIN students s ON s.id = c.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      WHERE 1=1
    `;
    const params = [];

    // If student, only fetch their own complaints
    if (req.user.role === 'student') {
      const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (student) {
        sql += ' AND c.student_id = ?';
        params.push(student.id);
      }
    }

    if (category && category !== 'All') {
      sql += ' AND c.category = ?';
      params.push(category);
    }
    if (status && status !== 'All') {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    if (priority && priority !== 'All') {
      sql += ' AND c.priority = ?';
      params.push(priority);
    }
    if (search) {
      sql += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.location LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY c.created_at DESC';

    const complaints = await all(sql, params);

    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getComplaintDetails(req, res) {
  try {
    const { id } = req.params;

    const complaint = await get(`
      SELECT c.*, 
             u.name as student_name, u.phone as student_phone, u.email as student_email,
             s.roll_number, s.branch,
             r.room_number, blk.name as block_name
      FROM complaints c
      JOIN students s ON s.id = c.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      WHERE c.id = ?
    `, [id]);

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const updates = await all(`
      SELECT cu.*, cu.notes as update_text, u.name as updater_name, u.role as updater_role
      FROM complaint_updates cu
      JOIN users u ON u.id = cu.updated_by_user_id
      WHERE cu.complaint_id = ?
      ORDER BY cu.created_at ASC
    `, [id]);

    res.json({
      success: true,
      complaint: {
        ...complaint,
        updates
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, assigned_to, resolution_notes, notes } = req.body;

    const validStatuses = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const complaint = await get('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const newStatus = status || complaint.status;
    const newAssigned = assigned_to !== undefined ? assigned_to : complaint.assigned_to;
    const newNotes = resolution_notes !== undefined ? resolution_notes : complaint.resolution_notes;
    const resolvedAt = newStatus === 'Resolved' ? new Date().toISOString() : null;

    await run(`
      UPDATE complaints
      SET status = ?, assigned_to = ?, resolution_notes = ?, resolved_at = COALESCE(?, resolved_at), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, newAssigned, newNotes, resolvedAt, id]);

    // Insert update audit trail
    await run(`
      INSERT INTO complaint_updates (complaint_id, updated_by_user_id, status, notes)
      VALUES (?, ?, ?, ?)
    `, [id, req.user.id, newStatus, notes || resolution_notes || `Status changed to ${newStatus}`]);

    // Send notification to student
    try {
      const student = await get('SELECT s.user_id FROM students s WHERE s.id = ?', [complaint.student_id]);
      if (student) {
        await createNotification(
          student.user_id,
          `🔧 Complaint #${id} ${newStatus}`,
          `Your ticket "${complaint.title}" is now ${newStatus}.${newAssigned ? ' Assigned to: ' + newAssigned : ''}`,
          newStatus === 'Resolved' ? 'success' : 'complaint',
          '/student/complaints'
        );
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch complaint notification:', notifErr.message);
    }

    res.json({ success: true, message: `Complaint updated to ${newStatus}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// WARDEN ESCALATION COMPLAINTS
export async function getWardensList(req, res) {
  try {
    console.log("Hitting getWardensList");
    const wardens = await all('SELECT id, name, email FROM users WHERE role = ?', ['warden']);
    res.json({ success: true, wardens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function submitWardenComplaint(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const { warden_user_id, subject, description } = req.body;
    if (!warden_user_id || !subject || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const warden = await get('SELECT name FROM users WHERE id = ?', [warden_user_id]);
    const wName = warden ? warden.name : 'Unknown';
    await run(
      'INSERT INTO complaints (student_id, title, description, category, location, priority, department, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student.id, `Warden Escalation: ${wName} - ${subject}`, description, 'Warden Escalation', 'Hostel', 'High', 'Admin Only', 'Pending']
    );
    
    // Notify Admin
    try {
      const { createBroadcastNotification } = await import('./notificationController.js');
      await createBroadcastNotification(['admin'], '🚨 New Warden Escalation', `A student has filed a complaint against a warden: ${subject}`, 'alert', '/admin');
    } catch(e) {}

    res.json({ success: true, message: 'Complaint securely submitted to the Admin.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMyWardenComplaints(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const complaints = await all(`
      SELECT c.*, c.title as subject 
      FROM complaints c
      WHERE c.student_id = ? AND c.category = 'Warden Escalation'
      ORDER BY c.created_at DESC
    `, [student.id]);
    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMyMessComplaints(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const complaints = await all('SELECT * FROM mess_complaints WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function submitMessComplaint(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const { issue_type, description } = req.body;
    if (!issue_type || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    await run(
      'INSERT INTO complaints (student_id, title, description, category, location, priority, department, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student.id, `Mess Issue: ${issue_type}`, description, 'Mess Escalation', 'Mess', 'High', 'Mess', 'Pending']
    );

    try {
      const { createBroadcastNotification } = await import('./notificationController.js');
      await createBroadcastNotification(['admin'], '🍽️ Mess Complaint', `A student reported a mess issue: ${issue_type}`, 'alert', '/admin');
    } catch(e) {}

    res.json({ success: true, message: 'Mess report submitted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}


export async function addComplaintUpdate(req, res) {
  try {
    const { id } = req.params;
    const { update_text } = req.body;
    if (!update_text) return res.status(400).json({ success: false, message: 'Message is required' });

    const complaintForStatus = await get('SELECT status FROM complaints WHERE id = ?', [id]);
    const currentStatus = complaintForStatus ? complaintForStatus.status : 'Pending';
    await run('INSERT INTO complaint_updates (complaint_id, updated_by_user_id, status, notes) VALUES (?, ?, ?, ?)', [id, req.user.id, currentStatus, update_text]);
    
    // Notify the other party
    const complaint = await get('SELECT student_id, title FROM complaints WHERE id = ?', [id]);
    if (complaint) {
      const student = await get('SELECT user_id, id FROM students WHERE id = ?', [complaint.student_id]);
      
      const { createNotification, createBroadcastNotification } = await import('./notificationController.js');
      
      if (req.user.role === 'admin' || req.user.role === 'warden') {
        // Admin replied, notify student
        if (student) {
          await createNotification(student.user_id, 'Message from Admin/Warden', `Reply on ticket "${complaint.title}": ${update_text}`, 'message', `/student/complaints/${id}`);
        }
      } else if (req.user.role === 'student' && student && student.user_id === req.user.id) {
        // Student replied, notify admins and wardens
        await createBroadcastNotification(['admin', 'warden'], 'Student Replied to Ticket', `Student replied to ticket "${complaint.title}": ${update_text}`, 'message', `/admin/complaints/${id}`);
      }
    }

    const updates = await all(`
      SELECT cu.*, cu.notes as update_text, u.name as updater_name, u.role as updater_role
      FROM complaint_updates cu
      JOIN users u ON u.id = cu.updated_by_user_id
      WHERE cu.complaint_id = ?
      ORDER BY cu.created_at ASC
    `, [id]);
    
    res.json({ success: true, updates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
