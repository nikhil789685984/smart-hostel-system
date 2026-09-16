const fs = require('fs');

function patchFile(filename, linkPathPrefix) {
  if (!fs.existsSync(filename)) return;
  let code = fs.readFileSync(filename, 'utf8');

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
      "AlertCircle,",
      "AlertCircle, ArrowRight,"
    );
  }

  const target = `                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    Logged: {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>`;

  const replacement = `                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    Logged: {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <Link to={\`/student/complaints/\${c.id}\`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-black text-[11px] uppercase tracking-wider rounded-xl transition shadow-sm border border-indigo-100">
                    View Ticket Chat
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>`;

  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(filename, code);
    console.log('Patched', filename);
  } else {
    console.log('Target not found in', filename);
  }
}

patchFile('frontend/src/pages/student/ReportWarden.jsx', '/student/complaints');
patchFile('frontend/src/pages/student/ReportMess.jsx', '/student/complaints');
