const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.jsx', 'utf8');

// Add ArrowRight icon and Link import
if (!code.includes('import { Link }')) {
  code = code.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { Link } from 'react-router-dom';"
  );
}

if (!code.includes('ArrowRight')) {
  code = code.replace(
    "CheckCircle2, XCircle,",
    "CheckCircle2, XCircle, ArrowRight,"
  );
}

// 1. Mess Escalations table
code = code.replace(
  '<th className="pb-3">Date</th>',
  '<th className="pb-3">Date</th>\n                  <th className="pb-3 text-right">Action</th>'
);

const messRowEnd = `<td className="py-4 text-xs font-bold text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>`;
const messRowEndNew = `<td className="py-4 text-xs font-bold text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <Link to={\`/admin/complaints/\${c.id}\`} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition border border-blue-200">
                        View Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>`;
code = code.replace(messRowEnd, messRowEndNew);

// 2. Warden Escalations table (it has Date column too)
code = code.replace(
  '<th className="pb-3">Date</th>',
  '<th className="pb-3">Date</th>\n                  <th className="pb-3 text-right">Action</th>'
);

const wardenRowEnd = `<td className="py-4 text-xs font-bold text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>`;
const wardenRowEndNew = `<td className="py-4 text-xs font-bold text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <Link to={\`/admin/complaints/\${c.id}\`} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition border border-blue-200">
                        View Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>`;
// Since both have the exact same Date cell HTML, replacing the second occurrence (or doing replace with global regex) will work.
code = code.replace(wardenRowEnd, wardenRowEndNew);

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.jsx', code);
console.log("AdminDashboard really patched.");
