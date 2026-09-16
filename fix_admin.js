const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.jsx', 'utf8');

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

  useEffect(() => {`;

code = code.replace('  useEffect(() => {', func);

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.jsx', code);
console.log('Fixed AdminDashboard');
