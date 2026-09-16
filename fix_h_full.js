const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(
  '<div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 h-full">',
  '<div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 min-h-full">'
);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Fixed h-full to min-h-full');
