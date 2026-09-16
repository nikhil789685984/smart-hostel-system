const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.jsx', 'utf8');

// Add to state
code = code.replace(
  'const [messComplaints, setMessComplaints] = useState([]);',
  'const [messComplaints, setMessComplaints] = useState([]);\n  const [fines, setFines] = useState([]);'
);

// Add to loadData Promise.all
code = code.replace(
  'api.getAdminMessComplaints().catch(() => ({ complaints: [] }))',
  'api.getAdminMessComplaints().catch(() => ({ complaints: [] })),\n          api.getAllFines().catch(() => ({ fines: [] }))'
);

// Extract fines from response
code = code.replace(
  'if(mcRes?.complaints) setMessComplaints(mcRes.complaints);',
  'if(mcRes?.complaints) setMessComplaints(mcRes.complaints);\n        const finesRes = res[4];\n        if(finesRes?.fines) setFines(finesRes.fines);'
);

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.jsx', code);
console.log('Patched AdminDashboard state');
