import { get, all, run } from '../database/db.js';
import { createBroadcastNotification } from './notificationController.js';

export async function getMarketplaceItems(req, res) {
  try {
    const { category, search, status } = req.query;

    let sql = `
      SELECT m.*,
             u.id as seller_user_id, u.name as seller_name, u.email as seller_email, u.phone as seller_phone, u.avatar_url as seller_avatar,
             s.id as student_id, s.roll_number, s.branch, s.year,
             r.room_number, blk.name as block_name, h.name as hostel_name
      FROM marketplace_items m
      JOIN students s ON s.id = m.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      LEFT JOIN hostels h ON h.id = blk.hostel_id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      sql += ' AND m.category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND m.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (m.title LIKE ? OR m.description LIKE ? OR u.name LIKE ? OR s.roll_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY m.created_at DESC';

    const items = await all(sql, params);

    res.json({
      success: true,
      items: items.map(item => ({
        ...item,
        is_verified_resident: Boolean(item.room_number || item.block_name),
        location_badge: item.room_number ? `${item.block_name || 'Block B'} • Room ${item.room_number}` : 'Verified Resident'
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createMarketplaceItem(req, res) {
  try {
    const { title, category, price, condition, description, image_url } = req.body;

    if (!title || !category || price === undefined || !description) {
      return res.status(400).json({ success: false, message: 'Title, category, price, and description are required.' });
    }

    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) {
      return res.status(403).json({ success: false, message: 'Only verified hostel resident students can post items for sale.' });
    }

    const defaultImages = {
      'Books & Notes': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      'Calculators & Gadgets': 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=400',
      'Cycles & Mobility': 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
      'Table Lamps & Lighting': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
      'Room Appliances': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400',
      'Furniture & Storage': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
      'Sports & Fitness': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400',
      'Hostel Essentials': 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400'
    };

    const finalImg = image_url || defaultImages[category] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400';

    const result = await run(`
      INSERT INTO marketplace_items (student_id, title, category, price, condition, description, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Available')
    `, [
      student.id,
      title,
      category,
      parseFloat(price),
      condition || 'Good',
      description,
      finalImg
    ]);

    
    try {
      await createBroadcastNotification(
        ['all'],
        '🛒 New Marketplace Item',
        `${req.user.name} just listed a ${title} for ₹${price}. Check it out!`,
        'success',
        '/student/marketplace',
        req.user.id
      );
    } catch(e) {}
    res.status(201).json({
      success: true,
      message: 'Item listed successfully on Hostel Mini Marketplace!',
      itemId: result.insertId
    });
  
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateMarketplaceItemStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Available', 'Sold', 'Reserved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Available, Sold, or Reserved.' });
    }

    const item = await get('SELECT * FROM marketplace_items WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item listing not found.' });
    }

    // Verify student owns the item or user is warden/admin
    if (req.user.role === 'student') {
      const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (!student || student.id !== item.student_id) {
        return res.status(403).json({ success: false, message: 'You can only manage your own listings.' });
      }
    }

    await run('UPDATE marketplace_items SET status = ? WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: `Listing status updated to ${status}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteMarketplaceItem(req, res) {
  try {
    const { id } = req.params;

    const item = await get('SELECT * FROM marketplace_items WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (req.user.role === 'student') {
      const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (!student || student.id !== item.student_id) {
        return res.status(403).json({ success: false, message: 'You can only delete your own listings.' });
      }
    }

    await run('DELETE FROM marketplace_items WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Marketplace listing deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
