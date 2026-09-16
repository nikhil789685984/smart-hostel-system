const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/warden/ComplaintManagement.jsx', 'utf8');

// We need user role from useAuth!
if (!code.includes('useAuth')) {
  code = code.replace(
    "import { Link } from 'react-router-dom';",
    "import { Link } from 'react-router-dom';\nimport { useAuth } from '../../context/AuthContext';"
  );
}

// Inside the component
code = code.replace(
  "export default function ComplaintManagement() {",
  "export default function ComplaintManagement() {\n  const { user } = useAuth();"
);

// Fix the link
code = code.replace(
  /to=\{\`\/admin\/complaints\/\$\{c\.id\}\`\}/g,
  "to={`/${user?.role === 'admin' ? 'admin' : 'warden'}/complaints/${c.id}`}"
);

fs.writeFileSync('frontend/src/pages/warden/ComplaintManagement.jsx', code);
