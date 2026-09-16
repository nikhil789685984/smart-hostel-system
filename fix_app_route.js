const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetStr = '<Route path="/student/complaints" element={<StudentComplaints />} />';
const newStr = '<Route path="/student/complaints" element={<StudentComplaints />} />\n            <Route path="/student/report-warden" element={<ReportWarden />} />';

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log('App.jsx successfully patched with new route.');
} else {
  console.log('Failed to find target string in App.jsx.');
}
