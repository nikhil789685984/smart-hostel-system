const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminComplaintDetails.jsx', 'utf8');

code = code.replace(
  "setData(prev => ({ ...prev, updates: res.updates }));",
  "setData(prev => ({ ...prev, complaint: { ...prev.complaint, updates: res.updates } }));"
);

fs.writeFileSync('frontend/src/pages/admin/AdminComplaintDetails.jsx', code);
console.log('Fixed state update');
