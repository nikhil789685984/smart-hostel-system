const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/layout/Sidebar.jsx', 'utf8');

const targetStr = "{ name: 'Complaints & AI Triage', to: '/student/complaints', icon: AlertCircle },";
const newStr = "{ name: 'Complaints & AI Triage', to: '/student/complaints', icon: AlertCircle },\n    { name: 'Report Warden', to: '/student/report-warden', icon: ShieldAlert },";

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('frontend/src/components/layout/Sidebar.jsx', code);
  console.log('Sidebar successfully updated with Report Warden link.');
} else {
  console.log('Could not find target string in Sidebar.jsx');
}
