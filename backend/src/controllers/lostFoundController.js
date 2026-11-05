import { get, all, run } from '../database/db.js';
import { createNotification, createBroadcastNotification } from './notificationController.js';

export async function initLostFoundDB() {
  await run(`
    CREATE TABLE IF NOT EXISTS lost_found_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('LOST', 'FOUND')),
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      date_reported DATETIME DEFAULT CURRENT_TIMESTAMP,
      image_url TEXT,
      reported_by_user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Claim_Pending', 'Resolved')),
      claimed_by_student_id INTEGER,
      claim_proof TEXT,
      resolved_at DATETIME,
      FOREIGN KEY(reported_by_user_id) REFERENCES users(id),
      FOREIGN KEY(claimed_by_student_id) REFERENCES students(id)
    )
  `);
}

export async function getAllItems(req, res) {
  try {
    const { type, status } = req.query;
    let query = `
      SELECT lf.*, u.name as reporter_name, u.role as reporter_role, 
             s.name as claimer_name, st.roll_number as claimer_roll
      FROM lost_found_items lf
      JOIN users u ON lf.reported_by_user_id = u.id
      LEFT JOIN students st ON lf.claimed_by_student_id = st.id
      LEFT JOIN users s ON st.user_id = s.id
      WHERE 1=1
    `;
    const params = [];
    
    if (type) {
      query += ` AND lf.type = ?`;
      params.push(type);
    }
    if (status) {
      query += ` AND lf.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY lf.date_reported DESC`;
    
    const items = await all(query, params);
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let cleanUrl = url.trim();
  if (!cleanUrl) return null;

  // Handle Google Drive links
  // Converts to direct CDN viewable URL: https://lh3.googleusercontent.com/d/{id}
  const driveMatch = cleanUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  // Handle Dropbox links (force direct raw download)
  if (cleanUrl.includes('dropbox.com')) {
    cleanUrl = cleanUrl.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
    if (!cleanUrl.includes('raw=1')) {
      cleanUrl += cleanUrl.includes('?') ? '&raw=1' : '?raw=1';
    }
    return cleanUrl;
  }

  // Prepend https:// if protocol is missing
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/uploads/')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  return cleanUrl;
}

export async function reportItem(req, res) {
  try {
    const { type, item_name, category, description, location, image_url } = req.body;
    const reported_by_user_id = req.user.id;

    if (!type || !item_name || !category || !location) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const cleanImageUrl = normalizeImageUrl(image_url);

    await run(`
      INSERT INTO lost_found_items (type, item_name, category, description, location, image_url, reported_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [type, item_name, category, description, location, cleanImageUrl, reported_by_user_id]);

    
    try {
      await createBroadcastNotification(
        ['all'],
        type === 'LOST' ? `🔎 Item Lost: ${item_name}` : `💡 Item Found: ${item_name}`,
        `A new ${type.toLowerCase()} item was reported in ${location}. Category: ${category}.`,
        type === 'LOST' ? 'warning' : 'success',
        '/student/lost-found',
        reported_by_user_id
      );
    } catch(e) { console.error('LF Notif Error', e); }
    res.json({ success: true, message: `${type} item reported successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function claimItem(req, res) {
  try {
    const { id } = req.params;
    const { claim_proof } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can claim items.' });
    }
    
    if (!claim_proof) {
      return res.status(400).json({ success: false, message: 'Must provide proof/description to claim.' });
    }

    const item = await get(`SELECT status, type FROM lost_found_items WHERE id = ?`, [id]);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (item.type !== 'FOUND') return res.status(400).json({ success: false, message: 'Can only claim FOUND items.' });
    if (item.status !== 'Active') return res.status(400).json({ success: false, message: 'Item is not available for claiming.' });

    await run(`
      UPDATE lost_found_items 
      SET status = 'Claim_Pending', claimed_by_student_id = ?, claim_proof = ?
      WHERE id = ?
    `, [req.user.student_id, claim_proof, id]);

    
    try {
      await createBroadcastNotification(
        ['warden', 'admin'],
        `✋ Item Claim Request`,
        `A student has claimed a found item (ID: ${id}). Please verify the proof.`,
        'notice',
        '/warden/dashboard',
        req.user.id
      );
    } catch(e) {}
    res.json({ success: true, message: 'Claim submitted. A warden will verify your proof.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function resolveClaim(req, res) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'
    
    const item = await get(`SELECT status FROM lost_found_items WHERE id = ?`, [id]);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (item.status !== 'Claim_Pending') return res.status(400).json({ success: false, message: 'No pending claim to resolve.' });

    if (action === 'APPROVE') {
      await run(`
        UPDATE lost_found_items 
        SET status = 'Resolved', resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);
      
      try {
        const itemInfo = await get(`SELECT claimed_by_student_id FROM lost_found_items WHERE id = ?`, [id]);
        const claimer = await get(`SELECT user_id FROM students WHERE id = ?`, [itemInfo.claimed_by_student_id]);
        if(claimer) {
          await createNotification(claimer.user_id, '✅ Item Claim Approved', 'Your claim for the found item has been approved. You may collect it.', 'success', '/student/lost-found');
        }
      } catch(e) {}
      res.json({ success: true, message: 'Claim approved and item handed over.' });
    } else if (action === 'REJECT') {
      await run(`
        UPDATE lost_found_items 
        SET status = 'Active', claimed_by_student_id = NULL, claim_proof = NULL
        WHERE id = ?
      `, [id]);
      
      try {
        const itemInfo = await get(`SELECT claimed_by_student_id FROM lost_found_items WHERE id = ?`, [id]);
        if (itemInfo && itemInfo.claimed_by_student_id) {
          const claimer = await get(`SELECT user_id FROM students WHERE id = ?`, [itemInfo.claimed_by_student_id]);
          if(claimer) {
            await createNotification(claimer.user_id, '❌ Item Claim Rejected', 'Your claim for the found item was rejected due to insufficient proof.', 'error', '/student/lost-found');
          }
        }
      } catch(e) {}
      res.json({ success: true, message: 'Claim rejected. Item is available again.' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
