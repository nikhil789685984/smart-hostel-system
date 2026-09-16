const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/ReportWarden.jsx', 'utf8');

if (!code.includes('import { Link }')) {
  code = code.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { Link } from 'react-router-dom';"
  );
}

if (!code.includes('ArrowRight')) {
  code = code.replace(
    "CheckCircle2,",
    "CheckCircle2, ArrowRight,"
  );
  code = code.replace(
    "import { AlertTriangle, User, History, ShieldAlert } from 'lucide-react';",
    "import { AlertTriangle, User, History, ShieldAlert, ArrowRight } from 'lucide-react';"
  );
}

const target = `                  <h3 className="text-sm font-bold text-slate-900 mb-1">{c.subject}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
                </div>`;

const replacement = `                  <h3 className="text-sm font-bold text-slate-900 mb-1">{c.subject || c.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
                  <div className="mt-3 flex justify-end">
                    <Link to={\`/student/complaints/\${c.id}\`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] uppercase rounded-lg transition border border-blue-100">
                      View Ticket Chat <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('frontend/src/pages/student/ReportWarden.jsx', code);
console.log('Fixed ReportWarden');

let messCode = fs.readFileSync('frontend/src/pages/student/ReportMess.jsx', 'utf8');
if (!messCode.includes('import { Link }')) {
  messCode = messCode.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { Link } from 'react-router-dom';"
  );
}

const messTarget = `                  <h3 className="text-sm font-bold text-slate-900 mb-1">{c.issue_type}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
                </div>`;

const messReplacement = `                  <h3 className="text-sm font-bold text-slate-900 mb-1">{c.issue_type || c.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
                  <div className="mt-3 flex justify-end">
                    <Link to={\`/student/complaints/\${c.id}\`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] uppercase rounded-lg transition border border-amber-100">
                      View Ticket Chat <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>`;
messCode = messCode.replace(messTarget, messReplacement);
fs.writeFileSync('frontend/src/pages/student/ReportMess.jsx', messCode);
console.log('Fixed ReportMess');
