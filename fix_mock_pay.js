const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentFees.jsx', 'utf8');

code = code.replace(
  "razorpay_order_id: 'mock_order_123',",
  "razorpay_order_id: `mock_order_${Date.now()}`,"
);

code = code.replace(
  "razorpay_payment_id: 'mock_pay_123',",
  "razorpay_payment_id: `mock_pay_${Date.now()}`,"
);

code = code.replace(
  "razorpay_signature: 'mock_signature',",
  "razorpay_signature: `mock_sig_${Date.now()}`,"
);

fs.writeFileSync('frontend/src/pages/student/StudentFees.jsx', code);
console.log('Fixed mock payment IDs to be unique');
