const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/adminRoutes.js', 'utf8');

code = code.replace(
  'getWardenComplaints,',
  'getWardenComplaints,\n  getAdminMessComplaints,'
);

code = code.replace(
  "export default router;",
  "router.get('/mess-complaints', authenticate, requireRole(['admin']), getAdminMessComplaints);\n\nexport default router;"
);

fs.writeFileSync('backend/src/routes/adminRoutes.js', code);
