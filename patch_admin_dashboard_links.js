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

// 1. Mess Escalations table - add a column header
code = code.replace(
  '<th className="pb-3 pr-4 font-bold text-slate-400">Target Dept</th>',
  '<th className="pb-3 pr-4 font-bold text-slate-400">Target Dept</th>\n                  <th className="pb-3 text-right font-bold text-slate-400">Action</th>'
);

// Add the link to the Mess Escalations table row
const messRowEnd = `<td className="py-4 pr-4">
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black uppercase">
                        {c.department}
                      </span>
                    </td>`;

const messRowEndNew = `<td className="py-4 pr-4">
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black uppercase">
                        {c.department}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link to={\`/admin/complaints/\${c.id}\`} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>`;
code = code.replace(messRowEnd, messRowEndNew);

// 2. Warden Escalations table - add a column header
code = code.replace(
  '<th className="pb-3 pr-4 font-bold text-slate-400">Escalated To</th>',
  '<th className="pb-3 pr-4 font-bold text-slate-400">Escalated To</th>\n                  <th className="pb-3 text-right font-bold text-slate-400">Action</th>'
);

// Add the link to the Warden Escalations table row
const wardenRowEnd = `<td className="py-4 pr-4">
                      <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black uppercase">
                        {c.department}
                      </span>
                    </td>`;

const wardenRowEndNew = `<td className="py-4 pr-4">
                      <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black uppercase">
                        {c.department}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link to={\`/admin/complaints/\${c.id}\`} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>`;
code = code.replace(wardenRowEnd, wardenRowEndNew);

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.jsx', code);
console.log("AdminDashboard patched.");
