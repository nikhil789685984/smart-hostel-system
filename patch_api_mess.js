const fs = require('fs');
let code = fs.readFileSync('frontend/src/services/api.js', 'utf8');

code = code.replace(
  "getMyWardenComplaints: () => request('/complaints/warden-escalation'),",
  "getMyWardenComplaints: () => request('/complaints/warden-escalation'),\n  submitMessComplaint: (data) => request('/complaints/mess', { method: 'POST', body: data }),\n  getMyMessComplaints: () => request('/complaints/mess'),\n  getAdminMessComplaints: () => request('/admin/mess-complaints'),"
);

fs.writeFileSync('frontend/src/services/api.js', code);
console.log('API patched');
