const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.jsx', 'utf8');

// 1. Add state
code = code.replace(
  'const [loading, setLoading] = useState(true);',
  'const [loading, setLoading] = useState(true);\n  const [wardenComplaints, setWardenComplaints] = useState([]);'
);

// 2. Fetch warden complaints
const loadDataReplace = `    async function loadData() {
      try {
        const [res, messRes, wcRes] = await Promise.all([
          api.getHostelAnalytics(),
          api.getAdminMessAnalytics().catch(() => ({ analytics: null })),
          api.getAdminWardenComplaints().catch(() => ({ complaints: [] }))
        ]);
        setAnalytics(res);
        setMessAnalytics(messRes?.analytics);
        if(wcRes?.complaints) setWardenComplaints(wcRes.complaints);
      } catch (err) {`;
code = code.replace(/    async function loadData\(\) \{\n      try \{\n        const \[res, messRes\] = await Promise\.all\(\[\n          api\.getHostelAnalytics\(\),\n          api\.getAdminMessAnalytics\(\)\.catch\(\(\) => \(\{ analytics: null \}\)\),\n        \]\);\n        setAnalytics\(res\);\n        setMessAnalytics\(messRes\?\.analytics\);\n      \} catch \(err\) \{/s, loadDataReplace);

// 3. Add UI Block at the end before motion.div closes
const complaintsUI = `
      {/* Warden Escalations */}
      {wardenComplaints.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-rose-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> Warden Escalations
              </h2>
              <p className="text-xs text-slate-500 font-medium">Confidential student reports against wardens</p>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase rounded-full">
              {wardenComplaints.length} Escalations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">Warden</th>
                  <th className="pb-3 pr-4">Subject</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wardenComplaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{c.student_name}</p>
                      <p className="text-xs text-slate-500">{c.roll_number}</p>
                    </td>
                    <td className="py-4 pr-4 font-bold text-slate-700">{c.warden_name}</td>
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{c.subject}</p>
                      <p className="text-xs text-slate-500 max-w-xs truncate">{c.description}</p>
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

code = code.replace(/    <\/motion\.div>/s, complaintsUI + '\n    </motion.div>');

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.jsx', code);
