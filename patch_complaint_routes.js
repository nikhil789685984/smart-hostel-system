const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/complaintRoutes.js', 'utf8');

code = code.replace(
  'updateComplaintStatus,',
  'updateComplaintStatus,\n  addComplaintUpdate,'
);

code = code.replace(
  "export default router;",
  "router.post('/:id/updates', requireRole(['admin', 'warden']), addComplaintUpdate);\n\nexport default router;"
);

fs.writeFileSync('backend/src/routes/complaintRoutes.js', code);
