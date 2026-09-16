const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentFees.jsx', 'utf8');

// I will just replace the entire function to be safe.
const targetFuncStart = '  const handleRazorpayCheckout = async () => {';
const targetFuncEndRegex = /  \};\n\n  \/\/ Step 3: Verify OTP and commit to DB/s;

// Find the block
const match = code.match(/  const handleRazorpayCheckout = async \(\) => \{[\s\S]*?\};\n\n  \/\/ Step 3/);
if (match) {
  const newFunc = `  const handleRazorpayCheckout = async () => {
    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setProcessingPayment(true);
    try {
      // 1. Create Razorpay order on backend
      const orderRes = await api.createRazorpayOrder({
        amount: numAmount,
        fee_id: feeData?.fee?.id,
        fine_id: targetFine?.id,
        payment_for: paymentTarget
      });

      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.message || 'Failed to initialize Razorpay transaction order');
      }

      // 2. Bypass SDK entirely and force-open the local React Simulated Razorpay UI!
      setShowRazorpayMock(true);
      setRzpStatus('init');
      setProcessingPayment(false);
      
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      alert(err.message || 'Could not launch Razorpay.');
      setProcessingPayment(false);
    }
  };

  // Step 3`;

  code = code.replace(match[0], newFunc);
  fs.writeFileSync('frontend/src/pages/student/StudentFees.jsx', code);
  console.log('Fixed handleRazorpayCheckout');
} else {
  console.log('Failed to match handleRazorpayCheckout block');
}
