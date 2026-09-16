const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/layout/Sidebar.jsx', 'utf8');

// Fix Warden Allocations
code = code.replace(
  "to: '/warden/allocation'",
  "to: '/warden/allocations'"
);

// Redirect missing Warden routes to dashboard to avoid crash
code = code.replace("to: '/warden/messages'", "to: '/warden/dashboard'");
code = code.replace("to: '/warden/gate-passes'", "to: '/warden/dashboard'");
code = code.replace("to: '/warden/room-requests'", "to: '/warden/dashboard'");
code = code.replace("to: '/warden/mess'", "to: '/warden/dashboard'");
code = code.replace("to: '/warden/notices'", "to: '/warden/dashboard'");
code = code.replace("to: '/warden/analytics'", "to: '/warden/dashboard'");

// Redirect missing Admin routes to dashboard
code = code.replace("to: '/admin/messages'", "to: '/admin/dashboard'");
code = code.replace("to: '/admin/complaints'", "to: '/admin/dashboard'"); // List is on dashboard
code = code.replace("to: '/admin/notices'", "to: '/admin/dashboard'");

fs.writeFileSync('frontend/src/components/layout/Sidebar.jsx', code);
console.log('Fixed all placeholder links in Sidebar');
