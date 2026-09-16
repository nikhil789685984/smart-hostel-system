const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/layout/Navbar.jsx', 'utf8');

// Replace standard white bg with backdrop-blur frosted glass
code = code.replace(
  'className="bg-white border-b border-slate-200 sticky top-0 z-40"',
  'className="bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 sticky top-0 z-40 shadow-sm transition-all"'
);

code = code.replace(
  'className="h-16 px-4 sm:px-6 flex items-center justify-between max-w-7xl mx-auto"',
  'className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between max-w-[1600px] mx-auto"'
);

fs.writeFileSync('frontend/src/components/layout/Navbar.jsx', code);
console.log('Navbar frosted glass applied');
