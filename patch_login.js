const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/LoginPage.jsx', 'utf8');

code = code.replace(
  "if (user.role === 'student') navigate('/student');",
  "if (user.role === 'student') navigate('/student/dashboard');"
);
code = code.replace(
  "else if (user.role === 'warden') navigate('/warden');",
  "else if (user.role === 'warden') navigate('/warden/dashboard');"
);
code = code.replace(
  "else if (user.role === 'admin') navigate('/admin');",
  "else if (user.role === 'admin') navigate('/admin/dashboard');"
);

fs.writeFileSync('frontend/src/pages/LoginPage.jsx', code);
console.log('Fixed login routing');
