const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.jsx', 'utf8');

const finesUI = `
      {/* Fines Section */}
      {fines.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-red-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" /> Disciplinary & Late Fines
              </h2>
              <p className="text-sm text-slate-500 font-medium">Overview of pending and collected fines</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 text-right">
                <p className="text-[10px] font-black uppercase text-red-500 mb-0.5">Total Collected</p>
                <p className="text-lg font-black text-red-700">
                  ₹{fines.filter(f => f.status === 'Paid').reduce((a, c) => a + c.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 text-right">
                <p className="text-[10px] font-black uppercase text-orange-500 mb-0.5">Total Pending</p>
                <p className="text-lg font-black text-orange-700">
                  ₹{fines.filter(f => f.status !== 'Paid').reduce((a, c) => a + c.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4 font-bold">Student</th>
                  <th className="pb-3 pr-4 font-bold">Fine Type</th>
                  <th className="pb-3 pr-4 font-bold">Amount</th>
                  <th className="pb-3 pr-4 font-bold">Status</th>
                  <th className="pb-3 font-bold">Date Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.slice(0, 5).map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{f.student_name}</p>
                      <p className="text-xs text-slate-500">{f.roll_number}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-black text-slate-700 uppercase">
                        {f.type}
                      </span>
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{f.reason}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="font-bold text-red-600">₹{f.amount}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={\`px-2 py-1 rounded text-[10px] font-black uppercase \${f.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}\`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-400">
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
`;

code = code.replace(
  '{/* Mess Escalations */}',
  finesUI + '\n      {/* Mess Escalations */}'
);

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.jsx', code);
console.log('Added Fines UI');
