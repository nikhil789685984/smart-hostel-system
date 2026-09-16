const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/complaintController.js', 'utf8');

const newFuncs = `
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
      'INSERT INTO mess_complaints (student_id, issue_type, description) VALUES (?, ?, ?)',
      [student.id, issue_type, description]
    );

    try {
      const { createBroadcastNotification } = await import('./notificationController.js');
      await createBroadcastNotification(['admin'], '🍽️ Mess Complaint', \`A student reported a mess issue: \${issue_type}\`, 'alert', '/admin');
    } catch(e) {}

    res.json({ success: true, message: 'Mess report submitted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
`;

code = code + newFuncs;
fs.writeFileSync('backend/src/controllers/complaintController.js', code);
console.log('Mess complaint controllers added.');
