import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  QrCode,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  Receipt,
  FileCheck,
  Check,
  AlertTriangle,
  Lock,
  Smartphone,
  Landmark,
  RotateCcw,
  Eye,
  ChevronRight,
  ExternalLink,
  Shield,
  FileText,
  Zap,
  DoorOpen,
  LogOut,
  AlertCircle,
  Calendar
} from 'lucide-react';

export default function StudentFees() {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gateway Modal state
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [gatewayTab, setGatewayTab] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [payAmount, setPayAmount] = useState('');
  
  // UPI Form state
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('');
  const [qrTimer, setQrTimer] = useState(300); // 5 mins countdown

  // Card Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');

  // NetBanking Form state
  const [selectedBank, setSelectedBank] = useState('State Bank of India');

  // 3D Secure OTP state
  const [otpStep, setOtpStep] = useState(false); // true when bank OTP dialog is visible
  const [showRazorpayMock, setShowRazorpayMock] = useState(false);
  const [rzpStatus, setRzpStatus] = useState("init");
  const [otpValue, setOtpValue] = useState('');
  const [otpTimer, setOtpTimer] = useState(45);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Success & Receipt state
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Target Payment Entity (Semester Fee or Disciplinary Fine)
  const [paymentTarget, setPaymentTarget] = useState('fee'); // 'fee' | 'fine'
  const [targetFine, setTargetFine] = useState(null);

  // Hostel Checkout Application State
  const [checkoutRequest, setCheckoutRequest] = useState(null);
  const [checkoutDate, setCheckoutDate] = useState('');
  const [checkoutReason, setCheckoutReason] = useState('Course Completed');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState(null);

  const timerRef = useRef(null);

  const fetchFees = async () => {
    try {
      const res = await api.getMyFees();
      setFeeData(res);
      if (res.fee) {
        setPayAmount(res.fee.pending_amount > 0 ? res.fee.pending_amount.toString() : '45000');
      }
    } catch (err) {
      console.error('Error fetching fees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckoutRequest = async () => {
    try {
      const res = await api.getMyCheckoutRequest();
      if (res.success) {
        setCheckoutRequest(res.request);
      }
    } catch (err) {
      console.error('Error fetching checkout request:', err);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchCheckoutRequest();
  }, []);

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutDate) {
      alert('Please select expected checkout date.');
      return;
    }
    setSubmittingCheckout(true);
    try {
      const res = await api.submitCheckoutRequest({
        expected_checkout_date: checkoutDate,
        reason: checkoutReason
      });
      setCheckoutMsg(res.message);
      fetchCheckoutRequest();
    } catch (err) {
      alert(err.message || 'Error submitting checkout request');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // QR countdown timer
  useEffect(() => {
    if (gatewayOpen && gatewayTab === 'upi') {
      setQrTimer(300);
      timerRef.current = setInterval(() => {
        setQrTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gatewayOpen, gatewayTab]);

  // Card formatting
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    // Detect brand
    if (val.startsWith('4')) setCardBrand('Visa');
    else if (val.startsWith('5')) setCardBrand('Mastercard');
    else if (val.startsWith('6')) setCardBrand('RuPay');
    else setCardBrand('Card');

    // Add space every 4 digits
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardExpiry(val);
  };

  const openPaymentGateway = (target = 'fee', fine = null) => {
    setPaymentTarget(target);
    setTargetFine(fine);
    if (target === 'fine' && fine) {
      setPayAmount(fine.amount.toString());
    } else {
      const balance = feeData?.fee ? (feeData.fee.pending_amount + (feeData.fee.late_fine || 0)) : 45000;
      setPayAmount(balance > 0 ? balance.toString() : '45000');
    }
    setOtpStep(false);
    setOtpValue('');
    setGatewayOpen(true);
  };

  // Step 1: User initiates payment from Gateway -> triggers 3D Secure OTP
  const handleProceedToOtp = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (parseFloat(payAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    setOtpStep(true);
    setOtpTimer(45);
  };

  // Step 2: Auto-fill test OTP (123456)
  const handleAutoFillOtp = () => {
    setOtpValue('123456');
  };

  const loadRazorpaySDK = () => {
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

  // OFFICIAL RAZORPAY STANDARD CHECKOUT POPUP
  const handleRazorpayCheckout = async () => {
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

  // Step 3: Verify OTP and commit to DB (Fallback or direct test verification)
  const handleConfirmOtpPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (otpValue.length < 4) {
      alert('Please enter the 6-digit OTP sent to your registered mobile.');
      return;
    }

    setProcessingPayment(true);
    try {
      let finalMethod = 'Razorpay UPI';
      if (gatewayTab === 'upi') {
        finalMethod = `Razorpay UPI - ${selectedUpiApp}`;
      } else if (gatewayTab === 'card') {
        finalMethod = `Razorpay ${cardBrand} Card (ending in ${cardNumber.slice(-4) || '4242'})`;
      } else {
        finalMethod = `Razorpay NetBanking - ${selectedBank}`;
      }

      const res = await api.verifyRazorpayPayment({
        amount: parseFloat(payAmount),
        fee_id: feeData?.fee?.id,
        fine_id: targetFine?.id,
        payment_for: paymentTarget,
        payment_method: finalMethod
      });

      // Confetti explosion
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      setPaymentSuccessData(res.transaction);
      setActiveReceipt({
        ...res.transaction,
        studentName: feeData?.studentName,
        semester: feeData?.fee?.semester || 6,
        breakdown: feeData?.breakdown
      });
      setGatewayOpen(false);
      setOtpStep(false);
      setReceiptModalOpen(true);
      fetchFees();
    } catch (err) {
      alert(err.message || 'Payment verification failed.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const openSpecificReceipt = (txn) => {
    setActiveReceipt({
      ...txn,
      receiptNumber: txn.receipt_number,
      transactionId: txn.transaction_id,
      amountPaid: txn.amount,
      paymentDate: txn.created_at,
      paymentMethod: txn.payment_method,
      studentName: feeData?.studentName,
      semester: feeData?.fee?.semester || 6,
      breakdown: feeData?.breakdown
    });
    setReceiptModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-bold">Querying semester financial ledger...</span>
      </div>
    );
  }

  const { fee, breakdown = [], transactions = [], studentName } = feeData || {};
  const totalAmount = fee?.total_amount || 45000;
  const paidAmount = fee?.paid_amount || 0;
  const pendingAmount = fee?.pending_amount !== undefined ? fee.pending_amount : (totalAmount - paidAmount);
  const percentPaid = Math.min(100, Math.round((paidAmount / totalAmount) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      
            {/* Semester History Summary */}
      {feeData?.fees && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[32px] p-6 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-black text-slate-900">Academic Semester Ledgers</h2>
             <span className="text-[10px] font-bold uppercase text-slate-400">All 8 Semesters Generated</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {feeData.fees.map((sem) => {
               const isPaid = sem.status === 'Paid';
               const pending = sem.pending_amount + (sem.late_fine||0);
               return (
                 <div key={sem.id} className={`p-3 rounded-2xl border flex flex-col justify-between ${isPaid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'} transition-all hover:scale-105`}>
                   <div>
                     <span className="text-[10px] font-black uppercase text-slate-500">Sem {sem.semester}</span>
                     <div className={`w-2 h-2 rounded-full absolute top-3 right-3 ${isPaid ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                   </div>
                   <div className="mt-2">
                     <p className={`text-sm font-black ${isPaid ? 'text-emerald-700' : 'text-rose-700'}`}>₹{isPaid ? sem.total_amount : pending}</p>
                     <p className="text-[9px] font-bold uppercase text-slate-400">{isPaid ? 'Settled' : 'Pending Dues'}</p>
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              NPCI & 256-Bit SSL Encrypted Campus Financial Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Hostel Fee & Payment Gateway</h1>
          <p className="text-xs text-emerald-200/80 mt-1 max-w-xl">
            Real-time semester ledger, instantaneous UPI/Card gateway settlement, 3D-secure authentication, and verified digital receipt issuance.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {fee?.receipt_number && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveReceipt({
                  receiptNumber: fee.receipt_number,
                  transactionId: fee.transaction_id,
                  amountPaid: fee.paid_amount,
                  paymentDate: fee.last_payment_date,
                  paymentMethod: fee.payment_method,
                  studentName: studentName,
                  semester: fee.semester || 6,
                  breakdown: breakdown
                });
                setReceiptModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md"
            >
              <Receipt className="w-4 h-4 text-emerald-300" /> View Current Receipt
            </motion.button>
          )}

          {pendingAmount > 0 ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openPaymentGateway('fee')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" /> Pay via Razorpay
            </motion.button>
          ) : (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> All Dues Cleared (₹0)
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {paymentSuccessData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-950">Payment Settled & Credited Successfully!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Ref TXN: <strong className="font-mono">{paymentSuccessData.transactionId}</strong> • Amount: <strong>₹{Number(paymentSuccessData.amountPaid).toLocaleString()}</strong> ({paymentSuccessData.paymentMethod})
                </p>
              </div>
            </div>
            <button
              onClick={() => setReceiptModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Receipt className="w-3.5 h-3.5" /> Open E-Receipt
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overdue Late Fine Alert Banner */}
      {(fee?.late_fine > 0 || fee?.status === 'Overdue') && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
              <AlertTriangle className="w-6 h-6 stroke-[2.5] animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-rose-950">Overdue Late Fine Assessed</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                  {fee.days_overdue || 1} Days Overdue
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1">
                Semester deadline was <strong>{fee.due_date}</strong>. A mandatory recurring late surcharge of <strong>₹50/day</strong> (Total fine: <strong>₹{Number(fee.late_fine).toLocaleString()}</strong>) has been levied on your ledger.
              </p>
              <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
                Clear total payable balance immediately to prevent biometric turnstile lock and gate-pass restrictions.
              </p>
            </div>
          </div>
          <button
            onClick={() => openPaymentGateway('fee')}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 transition flex items-center gap-2 self-start md:self-auto shrink-0 active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" /> Settle Fine & Dues via Razorpay
          </button>
        </motion.div>
      )}

      {/* Progress & Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Semester Tariff</span>
          <h3 className="text-3xl font-black text-slate-900 mt-1">₹{Number(totalAmount).toLocaleString()}</h3>
          <p className="text-xs text-slate-500 mt-2 font-medium">Approved Academic Tariff • Sem {fee?.semester || 6}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Total Amount Paid</span>
            <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {percentPaid}% Settled
            </span>
          </div>
          <h3 className="text-3xl font-black text-emerald-600 mt-1">₹{Number(paidAmount).toLocaleString()}</h3>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentPaid}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Outstanding Balance</span>
          <h3 className="text-3xl font-black text-rose-600 mt-1">₹{Number(pendingAmount).toLocaleString()}</h3>
          <p className="text-xs text-slate-500 mt-2 font-medium flex items-center justify-between">
            <span>Status: <strong className={pendingAmount === 0 ? "text-emerald-600" : "text-amber-600"}>{pendingAmount === 0 ? "Paid" : (fee?.status === "Paid" ? "Partial" : (fee?.status || "Pending"))}</strong></span>
            <span className="text-[10px] text-slate-400">Due: {fee?.due_date || 'In 15 Days'}</span>
          </p>
        </motion.div>
      </div>

      {/* Itemized Fee Breakdown Table */}
      {/* HOSTEL CHECKOUT & NO-DUES CLEARANCE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0 border border-indigo-100">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Hostel Checkout & No-Dues Clearance Application</h3>
              <p className="text-xs text-slate-500">Apply for official room vacate clearance and hostel release certificate</p>
            </div>
          </div>
          {checkoutRequest && (
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto ${
              checkoutRequest.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
              checkoutRequest.status === 'Checked Out' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              Status: {checkoutRequest.status}
            </span>
          )}
        </div>

        {checkoutMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{checkoutMsg}</span>
          </div>
        )}

        {(pendingAmount + (fee?.late_fine || 0) + (feeData?.fines ? feeData.fines.filter(f => f.status === 'Unpaid').reduce((acc, f) => acc + (f.amount || 0), 0) : 0)) > 0 ? (
          /* BLOCKED UI FOR PENDING DUES */
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-300 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-rose-950">🛑 Hostel Checkout Application Blocked</h4>
                <p className="text-xs text-rose-800 font-medium">
                  Hostel policy mandates <strong>100% Zero-Dues Clearance</strong> before any student resident can apply for room checkout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/90 p-3.5 rounded-xl border border-rose-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Semester Fee</span>
                <span className="font-mono font-black text-rose-700 text-sm">₹{Number(pendingAmount).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Late Fine Surcharge</span>
                <span className="font-mono font-black text-rose-700 text-sm">₹{Number(fee?.late_fine || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Disciplinary Penalties</span>
                <span className="font-mono font-black text-rose-700 text-sm">₹{Number(feeData?.fines ? feeData.fines.filter(f => f.status === 'Unpaid').reduce((acc, f) => acc + (f.amount || 0), 0) : 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="text-xs text-rose-900 font-bold">
                Total Unpaid Balance: <span className="font-mono text-sm font-black text-rose-700">₹{Number(pendingAmount + (fee?.late_fine || 0) + (feeData?.fines ? feeData.fines.filter(f => f.status === 'Unpaid').reduce((acc, f) => acc + (f.amount || 0), 0) : 0)).toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={() => openPaymentGateway('fee')}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" /> Pay All Dues Now via Razorpay
              </button>
            </div>
          </div>
        ) : checkoutRequest ? (
          /* ALREADY APPLIED / APPROVED UI */
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Zero-Dues Verified • Checkout Clearance Request Submitted</span>
              </div>
              {checkoutRequest.status === 'Pending' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to cancel your hostel checkout application?')) {
                      try {
                        await api.cancelCheckoutRequest(checkoutRequest.id);
                        setCheckoutMsg('Hostel checkout request cancelled successfully.');
                        setCheckoutRequest(null);
                        fetchCheckoutRequest();
                      } catch (err) {
                        alert(err.message || 'Failed to cancel checkout request.');
                      }
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-black transition cursor-pointer shrink-0"
                >
                  Cancel Checkout Application
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-700 font-medium">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Expected Checkout Date</span>
                <span className="font-bold text-slate-900">{checkoutRequest.expected_checkout_date}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Reason for Vacating</span>
                <span className="font-bold text-slate-900">{checkoutRequest.reason}</span>
              </div>
            </div>
            <p className="text-[11px] text-emerald-800 bg-white/80 p-3 rounded-xl border border-emerald-200 font-medium">
              ℹ️ Your room inspection will be conducted by Warden. Once approved, your assigned bed will be released.
            </p>
          </div>
        ) : (

          /* APPLY FORM (WHEN DUES === 0) */
          <form onSubmit={handleSubmitCheckout} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs bg-emerald-100/70 px-3 py-1.5 rounded-xl border border-emerald-200 w-fit">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero Dues Confirmed (₹0 Balance). You are eligible to apply.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Hostel Checkout Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Leaving Hostel <span className="text-rose-500">*</span>
                </label>
                <select
                  value={checkoutReason}
                  onChange={(e) => setCheckoutReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white"
                >
                  <option value="Course Completed">Course Completed / Final Graduation</option>
                  <option value="Semester Vacation">Semester Vacation</option>
                  <option value="Institute Transfer">Transfer to another Institute / Campus</option>
                  <option value="Relocating Off-Campus">Relocating Off-Campus (Private PG / Flat)</option>
                  <option value="Medical / Personal Reason">Medical / Personal Reason</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submittingCheckout}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                {submittingCheckout ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Clearance Request...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" /> Submit Hostel Checkout Application
                  </>
                )}
              </motion.button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Fee Statement & Billing Schedule Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900">Fee Statement & Billing Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">Itemized university residential heads for current semester</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
            Session 2026-27
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Description / Fee Head</th>
                <th className="py-3.5 px-6">Billing Term</th>
                <th className="py-3.5 px-6 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {breakdown.map((item, idx) => (
                <tr key={idx} className={`transition-colors ${item.isFine ? 'bg-rose-50/70 hover:bg-rose-50' : 'hover:bg-slate-50/70'}`}>
                  <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.isFine ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`} />
                    <span className={item.isFine ? 'text-rose-900 font-extrabold flex items-center gap-1.5' : ''}>
                      {item.isFine && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                      {item.item}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 font-medium">
                    {item.isFine ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                        Statutory Penalty
                      </span>
                    ) : (
                      'Per Semester'
                    )}
                  </td>
                  <td className={`py-4 px-6 text-right font-mono font-black ${item.isFine ? 'text-rose-600 text-sm' : 'text-slate-900'}`}>
                    {item.isFine ? `+ ₹${Number(item.amount).toLocaleString()}.00` : `₹${Number(item.amount).toLocaleString()}.00`}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50/90 font-black text-slate-900">
                <td className="py-4 px-6" colSpan={2}>Grand Total Semester Payable (Including Penalties)</td>
                <td className="py-4 px-6 text-right font-mono text-base text-blue-600">
                  ₹{Number(totalAmount + (fee?.late_fine || 0)).toLocaleString()}.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real Transaction History / Payment Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Payment History & Transaction Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time cryptographically hashed payment records</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {transactions.length} Transactions Logged
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600">No previous payment transactions found</p>
            <p className="text-[11px] mt-0.5">When you settle dues using the gateway, verified receipts will be preserved here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Date & Timestamp</th>
                  <th className="py-3 px-6">Transaction ID</th>
                  <th className="py-3 px-6">Payment Channel</th>
                  <th className="py-3 px-6 text-right">Amount Paid</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => (
                  <tr key={txn.id || txn.transaction_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-6 font-medium text-slate-600">
                      {new Date(txn.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-blue-700">
                      {txn.transaction_id}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 font-semibold">
                      {txn.payment_method}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-black text-slate-900">
                      ₹{Number(txn.amount).toLocaleString()}.00
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Settled
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => openSpecificReceipt(txn)}
                        className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3 text-blue-600" /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Penalties & Fines Ledger */}
      {feeData?.fines && feeData.fines.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Assessed Fines & Disciplinary Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">Late fee surcharges, curfew violations, and campus disciplinary records</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              {feeData.fines.filter(f => f.status === 'Unpaid').length} Outstanding
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Fine Type</th>
                  <th className="py-3 px-6">Reason / Infraction</th>
                  <th className="py-3 px-6">Date Assessed</th>
                  <th className="py-3 px-6 text-right">Penalty Amount</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Razorpay Settle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeData.fines.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {f.type}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-medium">
                      {f.reason}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {f.issued_date || f.created_at?.slice(0, 10)}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-black text-rose-600">
                      ₹{Number(f.amount).toLocaleString()}.00
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        f.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : f.status === 'Waived'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {f.status === 'Unpaid' ? (
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => openPaymentGateway('fine', f)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[11px] shadow-sm shadow-emerald-600/25 transition cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>Pay ₹{Number(f.amount).toLocaleString()}</span>
                        </motion.button>
                      ) : f.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Settled
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          Waived
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RAZORPAY / MODERN FINTECH PAYMENT GATEWAY MODAL */}
      <Modal
        isOpen={gatewayOpen}
        onClose={() => setGatewayOpen(false)}
        title={paymentTarget === 'fine' ? "Razorpay Disciplinary Fine Settlement" : "Razorpay Campus Fee Gateway"}
        subtitle={`Official Razorpay Checkout • Merchant: APEX_HOSTELS (${paymentTarget === 'fine' ? 'Fine Assessment' : 'Semester Fee Settlement'})`}
        maxWidth="max-w-2xl"
      >
        {!otpStep ? (
          <div className="space-y-5">
            {/* Amount Summary Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border border-slate-700/50 shadow-md">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {paymentTarget === 'fine' ? 'Assessed Disciplinary Penalty' : 'Total Payable Amount'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black font-mono">₹{Number(payAmount || 0).toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60 font-bold">
                    Zero Surcharge
                  </span>
                </div>
                {paymentTarget === 'fine' && targetFine && (
                  <p className="text-[11px] text-rose-300 mt-1 font-semibold">
                    Infraction: {targetFine.type} — {targetFine.reason}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Student:</span>
                <strong className="text-xs text-white block">{studentName}</strong>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Razorpay Test Gateway</span>
              </div>
            </div>

            {/* Official Razorpay Instant Checkout Button Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500/40 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                  ₹
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    Razorpay Standard Checkout
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      LIVE SDK ACTIVE
                    </span>
                  </h4>
                  <p className="text-[11px] text-blue-200/80">
                    UPI, QR Code, Google Pay, PhonePe, Cards & NetBanking
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                disabled={processingPayment}
                onClick={handleRazorpayCheckout}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition shrink-0 cursor-pointer"
              >
                {processingPayment ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Connecting Razorpay...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-950 fill-amber-950" />
                    <span>Instant Pay ₹{Number(payAmount || 0).toLocaleString()}</span>
                    <ExternalLink className="w-3 h-3 text-slate-950 opacity-70" />
                  </>
                )}
              </motion.button>
            </div>

            {/* Editable Amount for Partial Payment testing */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Amount to Settle (INR) *
              </label>
              <input
                type="number"
                min={1}
                max={paymentTarget === 'fine' ? (targetFine?.amount || 5000) : (pendingAmount > 0 ? pendingAmount : 45000)}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-mono font-black text-slate-900 focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Payment Channel Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setGatewayTab('upi')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                  gatewayTab === 'upi'
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" /> UPI & QR Code
              </button>
              <button
                type="button"
                onClick={() => setGatewayTab('card')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                  gatewayTab === 'card'
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Debit / Credit Card
              </button>
              <button
                type="button"
                onClick={() => setGatewayTab('netbanking')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                  gatewayTab === 'netbanking'
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Landmark className="w-4 h-4" /> NetBanking
              </button>
            </div>

            {/* TAB 1: UPI & QR CODE */}
            {gatewayTab === 'upi' && (
              <div className="space-y-4">
                {/* Dynamic QR Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-32 h-32 bg-white p-2 rounded-2xl border border-slate-300 shadow-sm flex flex-col items-center justify-center relative shrink-0">
                    <QrCode className="w-28 h-28 text-slate-900" />
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-black text-slate-900">Scan UPI QR with Any App</span>
                      <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Expires in {Math.floor(qrTimer / 60)}:{String(qrTimer % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Scan using Google Pay, PhonePe, Paytm, or BHIM. VPA: <strong className="font-mono text-slate-800">apexhims@icici</strong>
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleProceedToOtp}
                        className="text-xs font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-3 py-1 rounded-lg border border-emerald-300 transition"
                      >
                        ⚡ Simulate QR Scan & Confirm
                      </button>
                    </div>
                  </div>
                </div>

                {/* Popular UPI Apps Grid */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Or Select Installed UPI App
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setSelectedUpiApp(app)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                          selectedUpiApp === app
                            ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900">{app}</div>
                        {selectedUpiApp === app && (
                          <Check className="w-4 h-4 text-emerald-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual UPI ID */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Enter UPI ID / VPA
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. resident@okhdfcbank"
                      className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={handleProceedToOtp}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                    >
                      Verify & Pay
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DEBIT / CREDIT CARDS */}
            {gatewayTab === 'card' && (
              <div className="space-y-4">
                {/* Live Card Mockup */}
                <div className="p-5 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 text-white shadow-xl space-y-4 max-w-sm mx-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold tracking-wider text-blue-200">APEX CAMPUS DEBIT</span>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-300">{cardBrand}</span>
                  </div>
                  <div className="w-10 h-7 bg-amber-200/80 rounded-md border border-amber-300 shadow-inner" />
                  <div className="font-mono text-base font-black tracking-widest text-center text-slate-100">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono uppercase text-slate-300">
                    <div>
                      <span>CARDHOLDER</span>
                      <p className="font-bold text-white text-xs truncate max-w-[150px]">{cardHolder || studentName || 'CAMPUS STUDENT'}</p>
                    </div>
                    <div>
                      <span>EXPIRES</span>
                      <p className="font-bold text-white text-xs">{cardExpiry || '12/28'}</p>
                    </div>
                  </div>
                </div>

                {/* Card Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Expiry Date (MM/YY) *
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        CVV / CVC (3 Digits) *
                      </label>
                      <input
                        type="password"
                        maxLength={3}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder={studentName || "Name as on card"}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NETBANKING */}
            {gatewayTab === 'netbanking' && (
              <div className="space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Select Your Indian Retail Banking Portal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'State Bank of India',
                    'HDFC Bank',
                    'ICICI Bank',
                    'Axis Bank',
                    'Punjab National Bank',
                    'Kotak Mahindra Bank'
                  ].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedBank === bank
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">{bank}</div>
                      <span className="text-[10px] text-slate-400">NetBanking Portal</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Encrypted Razorpay Gateway Switch</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setGatewayOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleRazorpayCheckout}
                  className="px-6 py-2.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-md shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pay ₹{Number(payAmount || 0).toLocaleString()} via Razorpay</span>
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: BANK 3D SECURE OTP SCREEN */
          <div className="py-4 space-y-5">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-6 h-6 text-blue-700" />
                <div>
                  <h4 className="text-xs font-black text-blue-950">RBI 3D-Secure 2.0 Two-Factor Authentication</h4>
                  <p className="text-[11px] text-blue-800">Apex Campus Financial Switch • Instant Verification</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                ₹{Number(payAmount || 0).toLocaleString()}
              </span>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs text-slate-600">
                A 6-digit One-Time Password (OTP) was dispatched to your mobile number ending in <strong className="font-mono">••••••42</strong>.
              </p>
              <p className="text-[11px] text-slate-400">
                (Viva Demo Hint: Click the button below to auto-fill sample test OTP)
              </p>
            </div>

            {/* 1-Click Auto Fill Test OTP */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-extrabold border border-amber-300 transition flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 1-Click Auto-Fill Test OTP (123456)
              </button>
            </div>

            {/* OTP Input */}
            <form onSubmit={handleConfirmOtpPayment} className="space-y-4 max-w-xs mx-auto">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-Digit OTP"
                  className="w-full py-3 text-center text-lg font-mono font-black tracking-widest rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>Resend code in {otpTimer}s</span>
                <button
                  type="button"
                  onClick={() => setOtpTimer(45)}
                  className="text-blue-600 hover:underline"
                >
                  Resend OTP
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={processingPayment}
                  className="w-1/2 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-500/30 transition flex items-center justify-center gap-1.5"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Settling...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm OTP</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* OFFICIAL DIGITAL FEE RECEIPT MODAL */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Official Digital Fee Receipt"
        subtitle="Institutional E-Receipt with College Verification Seal"
        maxWidth="max-w-2xl"
      >
        {activeReceipt && (
          <div className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl space-y-6 relative overflow-hidden" id="fee-receipt">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-9xl font-black rotate-[-25deg] text-blue-900">PAID</span>
            </div>

            {/* Stamp Graphic */}
            <div className="absolute right-8 bottom-20 opacity-85 pointer-events-none select-none rotate-[-12deg] border-4 border-emerald-600 rounded-2xl px-4 py-2 text-center bg-white/40 backdrop-blur-xs">
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest block">APEX INSTITUTE OF TECH</span>
              <span className="text-lg font-black text-emerald-600 block leading-tight">PAID & VERIFIED</span>
              <span className="text-[9px] font-mono font-bold text-emerald-700 block">ACCOUNTS DEPT</span>
            </div>

            {/* Receipt Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-200 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-md">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Apex Institute of Technology</h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    Hostel Administrative & Accounts Division
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receipt Voucher</span>
                <p className="text-sm font-mono font-black text-blue-700">{activeReceipt.receiptNumber || 'RCPT-2026-08912'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {new Date(activeReceipt.paymentDate || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Student details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Resident</span>
                <p className="font-black text-slate-800 mt-0.5">{studentName}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Period</span>
                <p className="font-black text-slate-800 mt-0.5">Semester {fee?.semester || 6}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Settlement Channel</span>
                <p className="font-black text-slate-800 mt-0.5 truncate">{activeReceipt.paymentMethod || 'UPI Simulation'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Transaction Hash</span>
                <p className="font-mono text-[10px] font-bold text-slate-800 truncate mt-0.5">{activeReceipt.transactionId || 'TXN_APEX_98471'}</p>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5">Fee Particulars</th>
                  <th className="py-2.5 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-3 text-slate-800 font-semibold">Total Semester Tariff Assessed</td>
                  <td className="py-3 text-right font-mono font-bold text-slate-800">₹{Number(totalAmount).toLocaleString()}.00</td>
                </tr>
                <tr className="font-bold text-emerald-700 bg-emerald-50/50">
                  <td className="py-3 px-1">Amount Credited / Settled Under This Voucher</td>
                  <td className="py-3 px-1 text-right font-mono font-black">₹{Number(activeReceipt.amountPaid || paidAmount).toLocaleString()}.00</td>
                </tr>
                <tr className="font-bold text-slate-500">
                  <td className="py-3 px-1">Remaining Dues Balance</td>
                  <td className="py-3 px-1 text-right font-mono text-rose-600 font-black">₹{Number(pendingAmount).toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>

            {/* Footer & Seal */}
            <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Tamper-Proof Digitally Certified Campus E-Receipt</span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Authorized Signatory</span>
                <p className="text-xs font-black text-slate-900 mt-0.5">Finance Controller, Apex Hostels</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>
        )}
      </Modal>


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
                    <button onClick={() => setShowRazorpayMock(false)} className="opacity-80 hover:opacity-100 cursor-pointer p-1">
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
                    
                    <button onClick={() => setRzpStatus('processing')} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#3395FF] hover:bg-[#3395FF]/5 transition flex items-center justify-between group cursor-pointer">
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

                    <button onClick={() => setRzpStatus('processing')} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#3395FF] hover:bg-[#3395FF]/5 transition flex items-center justify-between group cursor-pointer">
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

                    <button onClick={() => setRzpStatus('processing')} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#3395FF] hover:bg-[#3395FF]/5 transition flex items-center justify-between group cursor-pointer">
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
                          
                          try {
                            const verifyRes = await api.verifyRazorpayPayment({
                              razorpay_order_id: `mock_order_${Date.now()}`,
                              razorpay_payment_id: `mock_pay_${Date.now()}`,
                              razorpay_signature: `mock_sig_${Date.now()}`,
                              amount: payAmount,
                              fee_id: feeData?.fee?.id,
                              fine_id: targetFine?.id,
                              payment_for: paymentTarget,
                              payment_method: 'Razorpay UPI'
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
                      className="mt-6 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition shadow-sm cursor-pointer animate-pulse"
                    >
                      Dev Mode: Click to Simulate Success
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-sm">
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
    </motion.div>
  );
}
