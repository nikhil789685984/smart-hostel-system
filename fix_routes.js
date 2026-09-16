const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/complaintRoutes.js', 'utf8');

code = code.replace(/import \{\n  getWardensList,\n  submitWardenComplaint,\nimport \{/g, 'import { getWardensList, submitWardenComplaint,');
fs.writeFileSync('backend/src/routes/complaintRoutes.js', code);
