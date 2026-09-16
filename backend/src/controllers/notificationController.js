import { all, get, run } from '../database/db.js';

/**
 * Utility function to create a persistent notification for any user
 */
export async function createNotification(userId, title, message, type = 'info', link = null) {
  try {
    const result = await run(`
      INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `, [userId, title, message, type, link]);
    return result;
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return null;
  }
}

/**
 * Utility function to broadcast notifications to groups of users (e.g. all wardens, all students, all staff)
 */
export async function createBroadcastNotification(targetRoles = ['all'], title, message, type = 'info', link = null, excludeUserId = null) {
  try {
    let sql = 'SELECT id FROM users WHERE 1=1';
    const params = [];

    if (!targetRoles.includes('all')) {
      const placeholders = targetRoles.map(() => '?').join(',');
      sql += ` AND role IN (${placeholders})`;
      params.push(...targetRoles);
    }

    if (excludeUserId) {
      sql += ' AND id != ?';
      params.push(excludeUserId);
    }

    const users = await all(sql, params);
    for (const u of users) {
      await createNotification(u.id, title, message, type, link);
    }
    return users.length;
  } catch (err) {
    console.error('Error in createBroadcastNotification:', err.message);
    return 0;
  }
}

/**
 * Get all notifications for logged-in user
 */
export async function getMyNotifications(req, res) {
  try {
    const userId = req.user.id;

    const notifications = await all(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 40
    `, [userId]);

    const unreadRow = await get(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    res.json({
      success: true,
      unreadCount: unreadRow ? unreadRow.count : 0,
      notifications
    });
  } catch (err) {
    console.error('Error getting notifications:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await run(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `, [id, userId]);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await run(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
    `, [userId]);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Delete / dismiss a notification
 */
export async function deleteNotification(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await run(`
      DELETE FROM notifications
      WHERE id = ? AND user_id = ?
    `, [id, userId]);

    res.json({ success: true, message: 'Notification dismissed' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
