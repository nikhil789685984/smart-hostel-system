const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// The main div should have lg:pl-64 to avoid getting hidden behind the fixed sidebar
code = code.replace(
  '<div className="flex-1 flex flex-col w-full min-w-0 relative z-10 transition-all duration-300">',
  '<div className="flex-1 flex flex-col w-full min-w-0 relative z-10 transition-all duration-300 lg:pl-64">'
);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Fixed App.jsx main layout padding');
