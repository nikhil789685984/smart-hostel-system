const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentComplaints.jsx', 'utf8');

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
  code = code.replace(
    "UserCheck",
    "UserCheck, ArrowRight"
  );
}

// Add a big button at the bottom of the complaint card
const target = `                {c.resolution_notes && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block mb-0.5">Technician Remarks / Action Taken:</strong>
                      {c.resolution_notes}
                    </div>
                  </div>
                )}`;

const replacement = `                {c.resolution_notes && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block mb-0.5">Technician Remarks / Action Taken:</strong>
                      {c.resolution_notes}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <Link to={\`/student/complaints/\${c.id}\`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-black text-[11px] uppercase tracking-wider rounded-xl transition shadow-sm border border-indigo-100">
                    <MessageSquare className="w-3.5 h-3.5" />
                    View Ticket Chat
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('frontend/src/pages/student/StudentComplaints.jsx', code);
console.log('Added View Ticket Chat button to StudentComplaints.jsx');
