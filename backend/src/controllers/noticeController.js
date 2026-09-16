import { get, all, run } from '../database/db.js';
import { createNotification, createBroadcastNotification } from './notificationController.js';

export async function getNotices(req, res) {
  try {
    const { category, priority } = req.query;

    let sql = `
      SELECT n.*, u.name as publisher_name, u.role as publisher_role
      FROM notices n
      JOIN users u ON u.id = n.published_by_user_id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      sql += ' AND n.category = ?';
      params.push(category);
    }
    if (priority && priority !== 'All') {
      sql += ' AND n.priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY n.date DESC, n.id DESC';

    const notices = await all(sql, params);
    res.json({ success: true, notices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createNotice(req, res) {
  try {
    const { title, description, category, priority, target_audience, expires_at } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const result = await run(`
      INSERT INTO notices (title, description, category, priority, published_by_user_id, target_audience, date, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, ?)
    `, [
      title,
      description,
      category || 'General',
      priority || 'Normal',
      req.user.id,
      target_audience || 'all',
      expires_at || null
    ]);

    // Dispatch broadcast notifications to targeted audience
    try {
      let targetRoles = ['all'];
      if (target_audience === 'students') targetRoles = ['student'];
      else if (target_audience === 'wardens') targetRoles = ['warden', 'admin'];

      await createBroadcastNotification(
        targetRoles,
        `📢 Campus Notice: ${title}`,
        `${description.length > 120 ? description.slice(0, 117) + '...' : description} [Priority: ${priority || 'Normal'}]`,
        priority === 'Urgent' ? 'warning' : 'notice',
        '/student/dashboard',
        req.user.id
      );
    } catch (nErr) {
      console.warn('Failed to dispatch notice notification:', nErr.message);
    }

    res.status(201).json({ success: true, message: 'Notice published successfully.', noticeId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateNotice(req, res) {
  try {
    const { id } = req.params;
    const { title, description, category, priority, target_audience, expires_at } = req.body;

    await run(`
      UPDATE notices
      SET title = ?, description = ?, category = ?, priority = ?, target_audience = ?, expires_at = ?
      WHERE id = ?
    `, [title, description, category, priority, target_audience, expires_at || null, id]);

    try {
      await createBroadcastNotification(
        ['all'],
        `📢 Notice Updated: ${title}`,
        `Campus circular "${title}" has been revised by ${req.user.name}.`,
        'notice',
        '/student/dashboard',
        req.user.id
      );
    } catch (e) {}

    res.json({ success: true, message: 'Notice updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteNotice(req, res) {
  try {
    const { id } = req.params;
    await run('DELETE FROM notices WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notice deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
