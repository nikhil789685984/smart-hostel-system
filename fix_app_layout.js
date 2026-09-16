const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Revert the container padding
code = code.replace(
  '<div className="flex-1 flex flex-col w-full min-w-0 relative z-10 transition-all duration-300 lg:pl-64">',
  '<div className="flex-1 flex flex-col w-full min-w-0 relative z-10 transition-all duration-300">'
);

// Apply padding only to main
code = code.replace(
  '<main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">',
  '<main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth lg:pl-64">'
);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Fixed main layout padding separation');
