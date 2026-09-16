const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/layout/Sidebar.jsx', 'utf8');

code = code.replace(
  "to: '/student/assistant'",
  "to: '/student/ai-assistant'"
);

fs.writeFileSync('frontend/src/components/layout/Sidebar.jsx', code);
console.log('Fixed Sidebar assistant link');
