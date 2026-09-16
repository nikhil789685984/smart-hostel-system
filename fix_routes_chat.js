const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/complaintRoutes.js', 'utf8');

code = code.replace(
  "router.post('/:id/updates', requireRole(['admin', 'warden']), addComplaintUpdate);",
  "router.post('/:id/updates', requireRole(['admin', 'warden', 'student']), addComplaintUpdate);"
);

fs.writeFileSync('backend/src/routes/complaintRoutes.js', code);
console.log('Fixed routing for chat');
