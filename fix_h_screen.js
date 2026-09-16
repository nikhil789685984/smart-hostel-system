const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(
  '<div className="min-h-screen bg-slate-50/50 flex overflow-hidden font-sans relative">',
  '<div className="h-screen w-full bg-slate-50/50 flex overflow-hidden font-sans relative">'
);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Fixed viewport height constraint');
