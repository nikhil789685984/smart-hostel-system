const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/ReportWarden.jsx', 'utf8');

const warningBanner = `          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex gap-3 shadow-sm">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-black text-rose-800 uppercase mb-1 tracking-wider">Strict Disciplinary Warning</h4>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                Filing a fake, baseless, or malicious complaint against a warden is a severe violation. Strict disciplinary action will be taken against any student found misusing this escalation channel.
              </p>
            </div>
          </div>
          
          <form`;

code = code.replace('<form', warningBanner);

fs.writeFileSync('frontend/src/pages/student/ReportWarden.jsx', code);
console.log('Warning banner added.');
