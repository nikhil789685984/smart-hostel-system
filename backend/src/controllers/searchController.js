import { all } from '../database/db.js';

export async function globalSearch(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) return res.json({ success: true, data: [] });
    
    const term = "%" + q + "%";
    const results = [];
    
    // Search Students
    const students = await all('SELECT u.name, s.roll_number, s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.name LIKE ? OR s.roll_number LIKE ? LIMIT 5', [term, term]);
    students.forEach(s => results.push({ type: 'Student', title: s.name, subtitle: `Roll: ${s.roll_number}`, link: '/admin/students' }));
    
    // Search Complaints
    const complaints = await all('SELECT id, title, status FROM complaints WHERE title LIKE ? OR description LIKE ? LIMIT 5', [term, term]);
    complaints.forEach(c => results.push({ type: 'Complaint', title: c.title, subtitle: `Status: ${c.status}`, link: '/admin/complaints' }));

    // Search Marketplace
    const market = await all('SELECT id, title, category FROM marketplace_items WHERE title LIKE ? LIMIT 5', [term]);
    market.forEach(m => results.push({ type: 'Marketplace', title: m.title, subtitle: `Category: ${m.category}`, link: '/marketplace' }));

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
