const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentFees.jsx', 'utf8');

const target = 'const [otpStep, setOtpStep] = useState(false); // true when bank OTP dialog is visible';
const injection = 'const [otpStep, setOtpStep] = useState(false); // true when bank OTP dialog is visible\n  const [showRazorpayMock, setShowRazorpayMock] = useState(false);\n  const [rzpStatus, setRzpStatus] = useState("init");';

if (code.includes(target)) {
  code = code.replace(target, injection);
  fs.writeFileSync('frontend/src/pages/student/StudentFees.jsx', code);
  console.log('State variables injected correctly.');
} else {
  console.log('Failed to find target line!');
}
