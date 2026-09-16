const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/layout/Navbar.jsx', 'utf8');

code = code.replace(
  "if (role === 'student') navigate('/student');",
  "if (role === 'student') navigate('/student/dashboard');"
);
code = code.replace(
  "else if (role === 'warden') navigate('/warden');",
  "else if (role === 'warden') navigate('/warden/dashboard');"
);
code = code.replace(
  "else if (role === 'admin') navigate('/admin');",
  "else if (role === 'admin') navigate('/admin/dashboard');"
);

fs.writeFileSync('frontend/src/components/layout/Navbar.jsx', code);
console.log('Fixed navbar routing');
