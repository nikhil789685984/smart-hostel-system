const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentFees.jsx', 'utf8');

code = code.replace(
  '{fee?.status || (pendingAmount === 0 ? "Paid" : "Pending")}',
  '{pendingAmount === 0 ? "Paid" : (fee?.status === "Paid" ? "Partial" : (fee?.status || "Pending"))}'
);

fs.writeFileSync('frontend/src/pages/student/StudentFees.jsx', code);
console.log('Fixed UI Status Fallback');
