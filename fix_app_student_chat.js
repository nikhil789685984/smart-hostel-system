const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const target = '<Route path="/student/complaints" element={<StudentComplaints />} />';
code = code.replace(
  target,
  target + '\n            <Route path="/student/complaints/:id" element={<AdminComplaintDetails />} />'
);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Added route for student complaint chat');
