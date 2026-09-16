const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminComplaintDetails.jsx', 'utf8');

if (!code.includes('useAuth')) {
  code = code.replace(
    "import { useParams, Link } from 'react-router-dom';",
    "import { useParams, Link, useNavigate } from 'react-router-dom';\nimport { useAuth } from '../../context/AuthContext';"
  );
}

code = code.replace(
  "export default function AdminComplaintDetails() {",
  "export default function AdminComplaintDetails() {\n  const { user } = useAuth();\n  const navigate = useNavigate();\n  const basePath = user?.role === 'admin' ? '/admin/complaints' : '/warden/complaints';"
);

code = code.replace(
  '<Link to="/admin/complaints" className="text-blue-600 font-medium mt-4 inline-block hover:underline">Go Back</Link>',
  '<button onClick={() => navigate(-1)} className="text-blue-600 font-medium mt-4 inline-block hover:underline">Go Back</button>'
);

code = code.replace(
  '<Link to="/admin/complaints" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm">',
  '<button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm cursor-pointer">'
);
code = code.replace(
  '</Link>\n          <div>\n            <div className="flex items-center gap-3 mb-1">',
  '</button>\n          <div>\n            <div className="flex items-center gap-3 mb-1">'
);

fs.writeFileSync('frontend/src/pages/admin/AdminComplaintDetails.jsx', code);
