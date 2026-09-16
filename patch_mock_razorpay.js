const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentFees.jsx', 'utf8');

// 1. Add state variable
code = code.replace(
  'const [otpStep, setOtpStep] = useState(false);',
  'const [otpStep, setOtpStep] = useState(false);\n  const [showRazorpayMock, setShowRazorpayMock] = useState(false);\n  const [rzpStatus, setRzpStatus] = useState("init"); // init, processing, success'
);

// 2. Change handleRazorpayCheckout
const newRzpLogic = `      // Simulate Razorpay Gateway locally for Demo
      setShowRazorpayMock(true);
      setRzpStatus('init');
      setProcessingPayment(false);`;

code = code.replace(/      \/\/ 2\. Open standard Razorpay Checkout if window\.Razorpay is available[\s\S]*?(?=      } catch \(err\) \{)/, newRzpLogic + '\n');

// 3. Inject the Mock Modal JSX right before the last closing div
const mockJSX = `
      {/* HIGH-FIDELITY RAZORPAY MOCK OVERLAY */}
      <AnimatePresence>
        {showRazorpayMock && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => rzpStatus === 'init' && setShowRazorpayMock(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[380px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
              style={{ height: '580px' }}
            >
              {/* RZP Header */}
              <div className="bg-[#3395FF] text-white p-4 flex flex-col justify-between" style={{ height: '140px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#3395FF] font-black text-xs shadow-sm">
                      AP
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-wide">APEX HOSTELS</h3>
                      <p className="text-[10px] opacity-80 uppercase tracking-wider">Test Environment</p>
                    </div>
                  </div>
                  {rzpStatus === 'init' && (
                    <button onClick={() => setShowRazorpayMock(false)} className="opacity-80 hover:opacity-100">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="white"/></svg>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 mt-auto">
                  <span className="text-xl font-medium opacity-90">₹</span>
                  <span className="text-3xl font-semibold tracking-tight">{Number(payAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Contact Info Bar */}
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span>student@hostel.com</span>
                </div>
                <span className="font-mono">9876543210</span>
              </div>

              {/* RZP Body Content */}
              <div className="flex-1 bg-white overflow-y-auto p-4 flex flex-col gap-4">
                {rzpStatus === 'init' ? (
                  <>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preferred Payment Methods</p>
                    
                    <button onClick={() => setRzpStatus('processing')} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#3395FF] hover:bg-[#3395FF]/5 transition flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">UPI / QR</p>
                          <p className="text-[10px] text-slate-400">Google Pay, PhonePe, Paytm</p>
                        </div>
                      </div>
                      <div className="w-4 h-4 border-2 border-slate-200 rounded-full group-hover:border-[#3395FF]"></div>
                    </button>

                    <button onClick={() => setRzpStatus('processing')} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#3395FF] hover:bg-[#3395FF]/5 transition flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Card</p>
                          <p className="text-[10px] text-slate-400">Visa, MasterCard, RuPay</p>
                        </div>
                      </div>
                      <div className="w-4 h-4 border-2 border-slate-200 rounded-full group-hover:border-[#3395FF]"></div>
                    </button>

                    <button onClick={() => setRzpStatus('processing')} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#3395FF] hover:bg-[#3395FF]/5 transition flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-purple-600">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Netbanking</p>
                          <p className="text-[10px] text-slate-400">All Indian Banks</p>
                        </div>
                      </div>
                      <div className="w-4 h-4 border-2 border-slate-200 rounded-full group-hover:border-[#3395FF]"></div>
                    </button>
                  </>
                ) : rzpStatus === 'processing' ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="w-12 h-12 border-4 border-[#3395FF]/20 border-t-[#3395FF] rounded-full animate-spin"></div>
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-slate-800">Processing Payment...</h4>
                      <p className="text-xs text-slate-500 mt-1">Please do not close this window</p>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        setRzpStatus('success');
                        setTimeout(async () => {
                          setShowRazorpayMock(false);
                          
                          // Proceed with actual payment verification backend logic
                          try {
                            const verifyRes = await api.verifyRazorpayPayment({
                              razorpay_order_id: 'mock_order_123',
                              razorpay_payment_id: 'mock_pay_123',
                              razorpay_signature: 'mock_signature',
                              amount: payAmount,
                              fee_id: feeData?.fee?.id,
                              fine_id: targetFine?.id,
                              payment_for: paymentTarget,
                              payment_method: 'Razorpay UI Checkout'
                            });
                            
                            if(verifyRes.success) {
                              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                              setPaymentSuccessData(verifyRes.transaction);
                              setActiveReceipt({
                                ...verifyRes.transaction,
                                studentName: feeData?.studentName,
                                semester: feeData?.fee?.semester || 6,
                                breakdown: feeData?.breakdown
                              });
                              setGatewayOpen(false);
                              setReceiptModalOpen(true);
                              fetchFees();
                            } else {
                              alert(verifyRes.message);
                            }
                          } catch(e) {
                            alert(e.message);
                          }
                        }, 1200);
                      }}
                      className="mt-6 px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-md hover:bg-emerald-100 transition"
                    >
                      (Dev: Auto-Complete Success)
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h4 className="text-lg font-black text-slate-800">Payment Successful</h4>
                    <p className="text-xs text-slate-500 text-center">Redirecting to merchant...</p>
                  </div>
                )}
              </div>

              {/* RZP Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-3 flex items-center justify-center gap-1.5 opacity-60">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                <span className="text-[10px] font-bold tracking-wide uppercase text-slate-600">Secured by Razorpay</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

code = code.replace('{/* END MAIN DIV */}', mockJSX + '\n    {/* END MAIN DIV */}');
// Wait, I don't have {/* END MAIN DIV */} in StudentFees.jsx. Let's find a safe spot to inject the modal.
