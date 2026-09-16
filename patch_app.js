const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Add import if not present
if (!code.includes('AdminComplaintDetails')) {
  code = code.replace(
    "import ComplaintManagement from './pages/warden/ComplaintManagement';",
    "import ComplaintManagement from './pages/warden/ComplaintManagement';\nimport AdminComplaintDetails from './pages/admin/AdminComplaintDetails';"
  );

  // Add route inside admin routes block
  const target = '<Route path="/admin/complaints" element={<ComplaintManagement />} />';
  code = code.replace(
    target,
    `${target}\n          <Route path="/admin/complaints/:id" element={<AdminComplaintDetails />} />`
  );

  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log('Patched App.jsx');
}
