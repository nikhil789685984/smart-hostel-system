const fs = require('fs');
let code = fs.readFileSync('frontend/src/services/api.js', 'utf8');

code = code.replace(
  "addComplaintUpdate: (id, text) => request(`/complaints/${id}/updates`, { method: 'POST', body: { update_text: text } }),",
  "addComplaintUpdate: (id, text) => request(`/complaints/${id}/updates`, { method: 'POST', body: { update_text: text } }),\n  getWardensList: () => request('/complaints/wardens-list'),\n  submitWardenComplaint: (data) => request('/complaints/warden-escalation', { method: 'POST', body: data }),\n  getAdminWardenComplaints: () => request('/admin/warden-complaints'),"
);

fs.writeFileSync('frontend/src/services/api.js', code);
