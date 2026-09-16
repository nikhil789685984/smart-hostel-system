const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/layout/Sidebar.jsx', 'utf8');

code = code.replace(
  'className="flex flex-col h-full bg-slate-900 text-white"',
  'className="flex flex-col h-full bg-slate-900/95 backdrop-blur-3xl text-white border-r border-slate-700/50 shadow-2xl"'
);

fs.writeFileSync('frontend/src/components/layout/Sidebar.jsx', code);
console.log('Sidebar frosted glass applied');
