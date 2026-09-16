const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.jsx', 'utf8');

// Add state
code = code.replace(
  'const [loading, setLoading] = useState(true);',
  'const [loading, setLoading] = useState(true);\n  const [runningPayroll, setRunningPayroll] = useState(false);'
);

// Add payroll function
const func = `  const handleRunPayroll = async () => {
    if(!window.confirm('Execute monthly payroll for all wardens and staff?')) return;
    setRunningPayroll(true);
    try {
      const res = await api.processGlobalSalary();
      if(res.success) alert('Payroll processed successfully!');
    } catch(err) {
      alert(err.message || 'Error processing payroll');
    } finally {
      setRunningPayroll(false);
    }
  };

  const loadData = async () => {`;
code = code.replace('  const loadData = async () => {', func);

// Inject button in quick actions
const btnUI = `<button
            onClick={handleRunPayroll}
            disabled={runningPayroll}
            className="flex flex-col items-center justify-center p-4 rounded-3xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 transition-all group shadow-sm disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="text-xl">💰</span>
            </div>
            <span className="text-xs font-black text-slate-800">Run Payroll</span>
            <span className="text-[10px] text-slate-500 font-medium">Credit Staff Salary</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/students')}
            className="flex flex-col`;
code = code.replace(/<button\n\s*onClick=\{\(\) => navigate\('\/admin\/students'\)\}\n\s*className="flex flex-col/s, btnUI);

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.jsx', code);
