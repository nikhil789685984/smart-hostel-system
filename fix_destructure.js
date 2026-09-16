const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminComplaintDetails.jsx', 'utf8');

code = code.replace(
  'const { complaint, updates } = data;',
  'const { complaint } = data;\n  const updates = complaint.updates || [];'
);

fs.writeFileSync('frontend/src/pages/admin/AdminComplaintDetails.jsx', code);
console.log('Fixed destructuring in AdminComplaintDetails.jsx');
