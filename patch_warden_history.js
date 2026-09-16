const fs = require('fs');

// 1. Controller
let ctrl = fs.readFileSync('backend/src/controllers/complaintController.js', 'utf8');
const historyFunc = `
export async function getMyWardenComplaints(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const complaints = await all(\`
      SELECT wc.*, u.name as warden_name 
      FROM warden_complaints wc
      JOIN users u ON wc.warden_user_id = u.id
      WHERE wc.student_id = ?
      ORDER BY wc.created_at DESC
    \`, [student.id]);
    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
`;
ctrl = ctrl + historyFunc;
fs.writeFileSync('backend/src/controllers/complaintController.js', ctrl);

// 2. Routes
let routes = fs.readFileSync('backend/src/routes/complaintRoutes.js', 'utf8');
routes = routes.replace(
  "import {",
  "import { getMyWardenComplaints,"
);
routes = routes.replace(
  "export default router;",
  "router.get('/warden-escalation', authenticate, requireRole(['student']), getMyWardenComplaints);\nexport default router;"
);
fs.writeFileSync('backend/src/routes/complaintRoutes.js', routes);

// 3. API
let api = fs.readFileSync('frontend/src/services/api.js', 'utf8');
api = api.replace(
  "submitWardenComplaint: (data) => request('/complaints/warden-escalation', { method: 'POST', body: data }),",
  "submitWardenComplaint: (data) => request('/complaints/warden-escalation', { method: 'POST', body: data }),\n  getMyWardenComplaints: () => request('/complaints/warden-escalation'),"
);
fs.writeFileSync('frontend/src/services/api.js', api);

console.log("Backend & API updated for Warden Escalation History.");
