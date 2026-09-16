const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/warden/WardenDashboard.jsx', 'utf8');

const loadDataReplace = `    async function loadData() {
      try {
        const [dashRes, salaryRes] = await Promise.all([
          api.getHostelAnalytics(),
          api.getStaffAccount().catch(() => null)
        ]);
        if (dashRes && dashRes.success !== false) {
           setAnalytics(dashRes);
        }
        if (salaryRes && salaryRes.success) {
           setSalaryInfo(salaryRes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }`;

code = code.replace(/    async function loadData\(\) \{\n      try \{\n        const res = await api\.getHostelAnalytics\(\);\n        setAnalytics\(res\);\n      \} catch \(err\) \{\n        console\.error\(err\);\n      \} finally \{\n        setLoading\(false\);\n      \}\n    \}/s, loadDataReplace);

fs.writeFileSync('frontend/src/pages/warden/WardenDashboard.jsx', code);
console.log('Fixed WardenDashboard');
