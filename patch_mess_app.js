const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(
  "import ReportWarden from './pages/student/ReportWarden';",
  "import ReportWarden from './pages/student/ReportWarden';\nimport ReportMess from './pages/student/ReportMess';"
);

code = code.replace(
  '<Route path="/student/report-warden" element={<ReportWarden />} />',
  '<Route path="/student/report-warden" element={<ReportWarden />} />\n            <Route path="/student/report-mess" element={<ReportMess />} />'
);

fs.writeFileSync('frontend/src/App.jsx', code);
