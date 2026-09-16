const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(
  '<Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />',
  '<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />'
);

code = code.replace(
  '<Navbar toggleSidebar={() => setSidebarOpen(true)} />',
  '<Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />'
);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Fixed Sidebar and Navbar props in App.jsx');
