const fs = require('fs');
let code = fs.readFileSync('frontend/src/services/api.js', 'utf8');

const target = `  getAdminWardenComplaints: () => request('/admin/warden-complaints'),`;
const injection = `  getAdminWardenComplaints: () => request('/admin/warden-complaints'),
  submitMessComplaint: (data) => request('/complaints/mess', { method: 'POST', body: data }),
  getMyMessComplaints: () => request('/complaints/mess'),
  getAdminMessComplaints: () => request('/admin/mess-complaints'),`;

code = code.replace(target, injection);
fs.writeFileSync('frontend/src/services/api.js', code);
console.log('Fixed API functions for Mess');
