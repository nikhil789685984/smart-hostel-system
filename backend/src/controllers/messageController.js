import { all, get, run } from '../database/db.js';
import { createNotification } from './notificationController.js';

/**
 * Get all staff contacts for the logged-in user (Admin or Warden)
 * Along with last message and unread count
 */
export async function getStaffContacts(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // Fetch all other staff members (admin + wardens)
    const staffMembers = await all(`
      SELECT u.id, u.name, u.email, u.role, u.phone, u.avatar_url,
             w.employee_id, w.department, w.office_location, h.name as hostel_name
      FROM users u
      LEFT JOIN wardens w ON w.user_id = u.id
      LEFT JOIN hostels h ON h.id = w.assigned_hostel_id
      WHERE u.role IN ('admin', 'warden') AND u.id != ?
      ORDER BY 
        CASE WHEN u.role = 'admin' THEN 1 ELSE 2 END,
        u.id ASC
    `, [currentUserId]);

    // For each staff member, get unread count and latest message
    const contacts = await Promise.all(
      staffMembers.map(async (staff) => {
        // Unread messages sent by this staff to current user
        const unreadRow = await get(`
          SELECT COUNT(*) as count 
          FROM staff_messages 
          WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
        `, [staff.id, currentUserId]);

        // Latest message between current user and this staff
        const latestMsg = await get(`
          SELECT id, sender_id, receiver_id, subject, message, priority, category, created_at, is_read
          FROM staff_messages
          WHERE (sender_id = ? AND receiver_id = ?)
             OR (sender_id = ? AND receiver_id = ?)
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        `, [currentUserId, staff.id, staff.id, currentUserId]);

        return {
          ...staff,
          unread_count: unreadRow ? unreadRow.count : 0,
          latest_message: latestMsg || null
        };
      })
    );

    // Get broadcast channel info (messages where receiver_id IS NULL)
    const broadcastLatest = await get(`
      SELECT sm.id, sm.sender_id, sm.subject, sm.message, sm.priority, sm.category, sm.created_at, u.name as sender_name
      FROM staff_messages sm
      JOIN users u ON u.id = sm.sender_id
      WHERE sm.receiver_id IS NULL
      ORDER BY sm.created_at DESC, sm.id DESC
      LIMIT 1
    `);

    const broadcastUnread = await get(`
      SELECT COUNT(*) as count
      FROM staff_messages
      WHERE receiver_id IS NULL AND sender_id != ? AND is_read = 0
    `, [currentUserId]);

    const broadcastChannel = {
      id: 'broadcast',
      name: '📢 All-Warden Official Directives Channel',
      email: 'broadcast@hostel.internal',
      role: 'broadcast',
      department: 'Campus Central Administration',
      office_location: 'Central Control Board',
      hostel_name: 'All Residential Hostels',
      avatar_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=150',
      unread_count: broadcastUnread ? broadcastUnread.count : 0,
      latest_message: broadcastLatest || null
    };

    res.json({
      success: true,
      contacts: [broadcastChannel, ...contacts]
    });
  } catch (err) {
    console.error('Error fetching staff contacts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get conversation history between current user and target contact
 * Automatically marks target messages as read
 */
export async function getConversation(req, res) {
  try {
    const currentUserId = req.user.id;
    const { contactId } = req.params;

    let messages = [];

    if (contactId === 'broadcast') {
      // Fetch all broadcast messages
      messages = await all(`
        SELECT sm.*, 
               u.name as sender_name, u.role as sender_role, u.avatar_url as sender_avatar,
               w.department as sender_department
        FROM staff_messages sm
        JOIN users u ON u.id = sm.sender_id
        LEFT JOIN wardens w ON w.user_id = u.id
        WHERE sm.receiver_id IS NULL
        ORDER BY sm.created_at ASC, sm.id ASC
      `);

      // Mark unread broadcasts not sent by current user as read
      await run(`
        UPDATE staff_messages 
        SET is_read = 1 
        WHERE receiver_id IS NULL AND sender_id != ? AND is_read = 0
      `, [currentUserId]);
    } else {
      const targetUserId = parseInt(contactId, 10);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ success: false, message: 'Invalid contact ID' });
      }

      messages = await all(`
        SELECT sm.*, 
               u.name as sender_name, u.role as sender_role, u.avatar_url as sender_avatar,
               w.department as sender_department
        FROM staff_messages sm
        JOIN users u ON u.id = sm.sender_id
        LEFT JOIN wardens w ON w.user_id = u.id
        WHERE (sm.sender_id = ? AND sm.receiver_id = ?)
           OR (sm.sender_id = ? AND sm.receiver_id = ?)
        ORDER BY sm.created_at ASC, sm.id ASC
      `, [currentUserId, targetUserId, targetUserId, currentUserId]);

      // Mark incoming messages from target contact as read
      await run(`
        UPDATE staff_messages 
        SET is_read = 1 
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `, [targetUserId, currentUserId]);
    }

    res.json({
      success: true,
      messages
    });
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Send a message from logged-in staff member to another staff member or broadcast
 */
export async function sendMessage(req, res) {
  try {
    const senderId = req.user.id;
    let { receiver_id, subject, message, priority, category } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    // Handle broadcast
    let targetReceiverId = null;
    if (receiver_id && receiver_id !== 'broadcast' && receiver_id !== 'null') {
      targetReceiverId = parseInt(receiver_id, 10);
      if (isNaN(targetReceiverId)) {
        return res.status(400).json({ success: false, message: 'Invalid recipient ID' });
      }
    }

    // Allow all staff (Admin & Wardens) to broadcast announcements
    const msgPriority = priority || 'Normal';
    const msgCategory = category || 'General';
    const msgSubject = subject && subject.trim() ? subject.trim() : null;

    const result = await run(`
      INSERT INTO staff_messages (sender_id, receiver_id, subject, message, priority, category, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `, [senderId, targetReceiverId, msgSubject, message.trim(), msgPriority, msgCategory]);

    const createdMsg = await get(`
      SELECT sm.*, 
             u.name as sender_name, u.role as sender_role, u.avatar_url as sender_avatar,
             w.department as sender_department
      FROM staff_messages sm
      JOIN users u ON u.id = sm.sender_id
      LEFT JOIN wardens w ON w.user_id = u.id
      WHERE sm.id = ?
    `, [result.insertId]);

    // Dispatch real notification
    try {
      if (targetReceiverId) {
        await createNotification(
          targetReceiverId,
          `💬 Message from ${req.user.name}`,
          msgSubject ? `[${msgSubject}] ${message.slice(0, 80)}...` : `${message.slice(0, 90)}...`,
          'message',
          req.user.role === 'admin' ? '/warden/messages' : '/admin/messages'
        );
      } else {
        // Broadcast to all other staff members (both admin and wardens)
        const allStaff = await all("SELECT id, role FROM users WHERE role IN ('admin', 'warden') AND id != ?", [senderId]);
        for (const staff of allStaff) {
          await createNotification(
            staff.id,
            `📢 Staff Broadcast from ${req.user.name}`,
            msgSubject ? `[${msgSubject}] ${message.slice(0, 80)}...` : `${message.slice(0, 90)}...`,
            'message',
            staff.role === 'admin' ? '/admin/messages' : '/warden/messages'
          );
        }
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch staff message notification:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Message dispatched successfully',
      data: createdMsg
    });
  } catch (err) {
    console.error('Error sending staff message:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Mark a single message as read
 */
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    await run(`
      UPDATE staff_messages
      SET is_read = 1
      WHERE id = ? AND (receiver_id = ? OR receiver_id IS NULL)
    `, [id, currentUserId]);

    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
