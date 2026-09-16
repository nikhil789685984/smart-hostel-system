const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentFees.jsx', 'utf8');

const rzpLoader = `  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // OFFICIAL RAZORPAY STANDARD CHECKOUT POPUP`;

code = code.replace('  // OFFICIAL RAZORPAY STANDARD CHECKOUT POPUP', rzpLoader);

const rzpLogic = `      // 2. Open standard Razorpay Checkout if window.Razorpay is available
      const isLoaded = await loadRazorpaySDK();
      if (isLoaded && window.Razorpay) {`;

code = code.replace("      // 2. Open standard Razorpay Checkout if window.Razorpay is available\n      if (typeof window !== 'undefined' && window.Razorpay) {", rzpLogic);

fs.writeFileSync('frontend/src/pages/student/StudentFees.jsx', code);
console.log('Razorpay dynamic load injected.');
