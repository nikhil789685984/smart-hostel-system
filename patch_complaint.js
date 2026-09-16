const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/complaintController.js', 'utf8');

const newFunctions = `
// WARDEN ESCALATION COMPLAINTS
export async function getWardensList(req, res) {
  try {
    const wardens = await all('SELECT id, name, email FROM users WHERE role = ?', ['warden']);
    res.json({ success: true, wardens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function submitWardenComplaint(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const { warden_user_id, subject, description } = req.body;
    if (!warden_user_id || !subject || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    await run(
      'INSERT INTO warden_complaints (student_id, warden_user_id, subject, description) VALUES (?, ?, ?, ?)',
      [student.id, warden_user_id, subject, description]
    );
    
    // Notify Admin
    try {
      const { createBroadcastNotification } = await import('./notificationController.js');
      await createBroadcastNotification(['admin'], '🚨 New Warden Escalation', \`A student has filed a complaint against a warden: \${subject}\`, 'alert', '/admin');
    } catch(e) {}

    res.json({ success: true, message: 'Complaint securely submitted to the Admin.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
`;

code = code + newFunctions;
fs.writeFileSync('backend/src/controllers/complaintController.js', code);
console.log('Patched complaintController');
