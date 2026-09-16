const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/warden/WardenDashboard.jsx', 'utf8');

// 1. Add salary state
code = code.replace(
  'const [alertSent, setAlertSent] = useState(false);',
  'const [alertSent, setAlertSent] = useState(false);\n  const [salaryInfo, setSalaryInfo] = useState(null);'
);

// 2. Fetch salary data in fetchData
const fetchReplacement = `    const fetchData = async () => {
      try {
        const [dashRes, salaryRes] = await Promise.all([
          api.getWardenDashboard(),
          api.getStaffAccount().catch(() => null)
        ]);
        if (dashRes.success) {
          setAnalytics(dashRes.analytics);
          setRecentActivities(dashRes.recentActivities || []);
        }
        if (salaryRes && salaryRes.success) {
          setSalaryInfo(salaryRes);
        }
      } catch (err) {`;
code = code.replace(/    const fetchData = async \(\) => \{\n      try \{\n        const res = await api\.getWardenDashboard\(\);\n        if \(res\.success\) \{\n          setAnalytics\(res\.analytics\);\n          setRecentActivities\(res\.recentActivities \|\| \[\]\);\n        \}\n      \} catch \(err\) \{/s, fetchReplacement);

// 3. Inject Salary UI after stats
const salaryUI = `{/* Warden Salary Account Block */}
      {salaryInfo && salaryInfo.account && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-[32px] p-6 shadow-xl mb-6 text-white relative overflow-hidden">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Staff Salary Account</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-[9px] font-bold text-emerald-200">Active</span>
                 </div>
                 <h2 className="text-2xl font-black">₹{salaryInfo.account.current_balance.toLocaleString()}</h2>
                 <p className="text-xs text-emerald-200 font-medium mt-1">Available Payroll Balance</p>
              </div>
              <div className="flex gap-4">
                 <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
                   <p className="text-[10px] font-bold uppercase text-emerald-200">Base Salary</p>
                   <p className="text-sm font-black text-white mt-0.5">₹{salaryInfo.account.base_salary.toLocaleString()}/mo</p>
                 </div>
                 <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
                   <p className="text-[10px] font-bold uppercase text-emerald-200">Last Credited</p>
                   <p className="text-sm font-black text-white mt-0.5">{salaryInfo.account.last_credited_at ? new Date(salaryInfo.account.last_credited_at).toLocaleDateString() : 'N/A'}</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Quick Action Buttons */}`;

code = code.replace('{/* Quick Action Buttons */}', salaryUI);

fs.writeFileSync('frontend/src/pages/warden/WardenDashboard.jsx', code);
