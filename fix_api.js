const fs = require('fs');
let code = fs.readFileSync('frontend/src/services/api.js', 'utf8');

const target = `  updateComplaintStatus: (id, data) => request(\`/complaints/\${id}/status\`, { method: 'PATCH', body: data }),`;
const injection = `  updateComplaintStatus: (id, data) => request(\`/complaints/\${id}/status\`, { method: 'PATCH', body: data }),
  getWardensList: () => request('/complaints/wardens-list'),
  submitWardenComplaint: (data) => request('/complaints/warden-escalation', { method: 'POST', body: data }),
  getMyWardenComplaints: () => request('/complaints/warden-escalation'),
  getAdminWardenComplaints: () => request('/admin/warden-complaints'),`;

code = code.replace(target, injection);
fs.writeFileSync('frontend/src/services/api.js', code);
console.log('Fixed API functions');
