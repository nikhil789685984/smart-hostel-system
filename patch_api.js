const fs = require('fs');
let code = fs.readFileSync('frontend/src/services/api.js', 'utf8');

code = code.replace(
  '  verifyRazorpayPayment: (data) => request(\'/fees/razorpay/verify-payment\', { method: \'POST\', body: data }),\n};\n\n  // Salary routes\n  getStaffAccount: async () => {\n    const res = await fetch(`${API_URL}/salary/my-account`, { headers: getHeaders() });\n    return res.json();\n  },\n  processGlobalSalary: async () => {\n    const res = await fetch(`${API_URL}/salary/process-all`, { method: \'POST\', headers: getHeaders() });\n    return res.json();\n  }\n};',
  '  verifyRazorpayPayment: (data) => request(\'/fees/razorpay/verify-payment\', { method: \'POST\', body: data }),\n\n  // Salary routes\n  getStaffAccount: () => request(\'/salary/my-account\'),\n  processGlobalSalary: () => request(\'/salary/process-all\', { method: \'POST\' })\n};'
);

fs.writeFileSync('frontend/src/services/api.js', code);
