const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/complaintController.js', 'utf8');

const newFunc = `
export async function addComplaintUpdate(req, res) {
  try {
    const { id } = req.params;
    const { update_text } = req.body;
    if (!update_text) return res.status(400).json({ success: false, message: 'Message is required' });

    await run('INSERT INTO complaint_updates (complaint_id, updated_by_user_id, update_text) VALUES (?, ?, ?)', [id, req.user.id, update_text]);
    
    // Notify the student!
    const complaint = await get('SELECT student_id, title FROM complaints WHERE id = ?', [id]);
    if (complaint) {
      const student = await get('SELECT user_id FROM students WHERE id = ?', [complaint.student_id]);
      if (student) {
        const { createNotification } = await import('./notificationController.js');
        await createNotification(student.user_id, 'Message from Admin', \`Admin replied to your ticket "\${complaint.title}": \${update_text}\`, 'message', '/student/complaints');
      }
    }

    const updates = await all(\`
      SELECT cu.*, u.name as updater_name, u.role as updater_role
      FROM complaint_updates cu
      JOIN users u ON u.id = cu.updated_by_user_id
      WHERE cu.complaint_id = ?
      ORDER BY cu.created_at ASC
    \`, [id]);
    
    res.json({ success: true, updates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
`;

code = code + '\n' + newFunc;
fs.writeFileSync('backend/src/controllers/complaintController.js', code);
