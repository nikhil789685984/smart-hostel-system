const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.jsx', 'utf8');

// Add State
code = code.replace(
  'const [wardenComplaints, setWardenComplaints] = useState([]);',
  'const [wardenComplaints, setWardenComplaints] = useState([]);\n  const [messComplaints, setMessComplaints] = useState([]);'
);

// Add fetch in Promise.all
const loadDataReplace = `        const [res, messRes, wcRes, mcRes] = await Promise.all([
          api.getHostelAnalytics(),
          api.getAdminMessAnalytics().catch(() => ({ analytics: null })),
          api.getAdminWardenComplaints().catch(() => ({ complaints: [] })),
          api.getAdminMessComplaints().catch(() => ({ complaints: [] }))
        ]);
        setAnalytics(res);
        setMessAnalytics(messRes?.analytics);
        if(wcRes?.complaints) setWardenComplaints(wcRes.complaints);
        if(mcRes?.complaints) setMessComplaints(mcRes.complaints);`;

code = code.replace(/        const \[res, messRes, wcRes\] = await Promise.all\(\[\n          api.getHostelAnalytics\(\),\n          api.getAdminMessAnalytics\(\).catch\(\(\) => \(\{ analytics: null \}\)\),\n          api.getAdminWardenComplaints\(\).catch\(\(\) => \(\{ complaints: \[\] \}\)\)\n        \]\);\n        setAnalytics\(res\);\n        setMessAnalytics\(messRes\?\.analytics\);\n        if\(wcRes\?\.complaints\) setWardenComplaints\(wcRes.complaints\);/s, loadDataReplace);

// Inject UI before Warden Escalations
const messUI = `
      {/* Mess Escalations */}
      {messComplaints.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-amber-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-500" /> Mess & Hygiene Reports
              </h2>
              <p className="text-xs text-slate-500 font-medium">Direct student feedback on food quality and staff</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full">
              {messComplaints.length} Reports
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">Issue Type</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messComplaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{c.student_name}</p>
                      <p className="text-xs text-slate-500">{c.roll_number}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="px-2 py-1 rounded bg-amber-50 text-[10px] font-black text-amber-700 uppercase border border-amber-200">
                        {c.issue_type}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-xs text-slate-500 max-w-sm truncate">{c.description}</p>
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
`;

code = code.replace('{/* Warden Escalations */}', messUI + '\n      {/* Warden Escalations */}');

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.jsx', code);
