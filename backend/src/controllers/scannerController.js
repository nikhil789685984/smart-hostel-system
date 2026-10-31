import { get, run } from '../database/db.js';

export async function verifyPass(req, res) {
  try {
    const { type, id } = req.query; // type: 'GATE' or 'GUEST'
    
    if (!type || !id) return res.status(400).json({ success: false, message: 'Missing type or id' });

    let pass = null;

    if (type === 'GATE') {
      pass = await get(`
        SELECT g.*, u.name as student_name, s.roll_number, r.room_number 
        FROM gate_passes g
        JOIN students s ON g.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
        LEFT JOIN beds b ON ra.bed_id = b.id
        LEFT JOIN rooms r ON b.room_id = r.id
        WHERE g.id = ?
      `, [id]);
    } else if (type === 'GUEST') {
      pass = await get(`
        SELECT g.*, u.name as student_name, s.roll_number
        FROM guest_passes g
        JOIN students s ON g.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE g.id = ?
      `, [id]);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid pass type' });
    }

    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    res.json({ success: true, pass, type });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function processScanAction(req, res) {
  try {
    const { type, id, action } = req.body; 
    // action: 'MARK_DEPARTED', 'MARK_RETURNED' (for gate pass)
    // 'MARK_CHECKIN', 'MARK_CHECKOUT' (for guest pass)
    
    if (type === 'GATE') {
      let newStatus = '';
      if (action === 'MARK_DEPARTED') newStatus = 'Active'; // They left the hostel
      if (action === 'MARK_RETURNED') newStatus = 'Completed'; // They came back
      
      if (newStatus) {
        await run("UPDATE gate_passes SET status = ? WHERE id = ?", [newStatus, id]);
        return res.json({ success: true, message: `Gate Pass marked as ${newStatus}` });
      }
    } else if (type === 'GUEST') {
      let newStatus = '';
      if (action === 'MARK_CHECKIN') newStatus = 'Active'; // Guest checked in
      if (action === 'MARK_CHECKOUT') newStatus = 'Completed'; // Guest checked out
      
      if (newStatus) {
        await run("UPDATE guest_passes SET status = ? WHERE id = ?", [newStatus, id]);
        return res.json({ success: true, message: `Guest Pass marked as ${newStatus}` });
      }
    }
    
    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
