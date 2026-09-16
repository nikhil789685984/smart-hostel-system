import { get, all } from '../database/db.js';
import { classifyComplaint, chatWithHostelAssistant } from '../services/aiService.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function classify(req, res) {
  try {
    const { title, description } = req.body;
    if (!description && !title) {
      return res.status(400).json({ success: false, message: 'Description or title is required.' });
    }

    const triage = await classifyComplaint(title, description);
    res.json({ success: true, triage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function chat(req, res) {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Build rich database context for grounded responses
    let student = null;
    let room = null;
    let complaints = [];

    if (req.user) {
      student = await get('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
      if (student) {
        student.name = req.user.name;

        // Fetch room info
        room = await get(`
          SELECT r.room_number, r.floor, r.room_type, b.bed_number, blk.name as block_name
          FROM room_allocations ra
          JOIN beds b ON b.id = ra.bed_id
          JOIN rooms r ON r.id = b.room_id
          JOIN blocks blk ON blk.id = r.block_id
          WHERE ra.student_id = ? AND ra.status = 'active'
        `, [student.id]);

        if (room) {
          // Fetch roommates
          const roommates = await all(`
            SELECT u.name, u.phone
            FROM room_allocations ra
            JOIN beds b ON b.id = ra.bed_id
            JOIN rooms r ON r.id = b.room_id
            JOIN students s ON s.id = ra.student_id
            JOIN users u ON u.id = s.user_id
            WHERE r.room_number = ? AND s.id != ? AND ra.status = 'active'
          `, [room.room_number, student.id]);
          room.roommates = roommates;
        }

        // Fetch active complaints
        complaints = await all(`
          SELECT id, title, category, priority, status, department, assigned_to, resolution_notes
          FROM complaints
          WHERE student_id = ? AND status != 'Resolved'
        `, [student.id]);
      }
    }

    // Fetch today's mess menu
    const todayIndex = new Date().getDay();
    const todayDayName = DAYS[todayIndex];
    const todayMenu = await get('SELECT * FROM mess_menu WHERE day_of_week = ?', [todayDayName]);

    // Fetch active notices
    const notices = await all('SELECT title, description, priority, date FROM notices ORDER BY date DESC LIMIT 4');

    const result = await chatWithHostelAssistant(message, {
      student,
      room,
      complaints,
      todayMenu,
      notices
    });

    res.json({
      success: true,
      reply: result.reply,
      source: result.source
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
