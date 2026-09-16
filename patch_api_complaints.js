const fs = require('fs');
let code = fs.readFileSync('frontend/src/services/api.js', 'utf8');

const target = "updateComplaintStatus: (id, data) => request(`/complaints/${id}/status`, { method: 'PATCH', body: data }),";
const replacement = "updateComplaintStatus: (id, data) => request(`/complaints/${id}/status`, { method: 'PATCH', body: data }),\n  addComplaintUpdate: (id, text) => request(`/complaints/${id}/updates`, { method: 'POST', body: { update_text: text } }),";

code = code.replace(target, replacement);

fs.writeFileSync('frontend/src/services/api.js', code);
