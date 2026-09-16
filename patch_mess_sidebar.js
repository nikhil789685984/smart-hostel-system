const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/layout/Sidebar.jsx', 'utf8');

const targetStr = "{ name: 'Mess Menu & Ratings', to: '/student/mess', icon: UtensilsCrossed },";
const newStr = "{ name: 'Mess Menu & Ratings', to: '/student/mess', icon: UtensilsCrossed },\n    { name: 'Report Mess/Food', to: '/student/report-mess', icon: AlertCircle },";

code = code.replace(targetStr, newStr);

fs.writeFileSync('frontend/src/components/layout/Sidebar.jsx', code);
