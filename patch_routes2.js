const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Remove from admin block
code = code.replace('<Route path="/admin/complaints/:id" element={<AdminComplaintDetails />} />', '');

// Insert it into Warden block (which allows both warden and admin)
const target = '<Route path="/warden/complaints" element={<ComplaintManagement />} />';
code = code.replace(
  target,
  target + '\n            <Route path="/warden/complaints/:id" element={<AdminComplaintDetails />} />'
);

// Admin block is fine, let's also add one for admin route so /admin/complaints/:id works for admin explicitly
const target2 = '<Route path="/admin/complaints" element={<ComplaintManagement />} />';
code = code.replace(
  target2,
  target2 + '\n            <Route path="/admin/complaints/:id" element={<AdminComplaintDetails />} />'
);

fs.writeFileSync('frontend/src/App.jsx', code);
