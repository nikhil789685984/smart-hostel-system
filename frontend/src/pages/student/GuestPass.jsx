import React, { useState, useEffect } from 'react';
import { Users, Calendar, Shield, CreditCard, CheckCircle, Clock, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

export default function GuestPass() {
  const { user } = useAuth();
  const [passes, setPasses] = useState([]);
  const [pricing, setPricing] = useState({ ROOM_AC_PER_DAY: 500, ROOM_NON_AC_PER_DAY: 300, MEALS_PER_DAY: 250 });
  const [loading, setLoading] = useState(true);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    guest_name: '',
    relation: 'Parent',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    requires_room: false,
    guest_room_type: 'AC',
    requires_meals: false
  });

  // Razorpay Mock State
  const [showRazorpayMock, setShowRazorpayMock] = useState(false);
  const [rzpStatus, setRzpStatus] = useState('init'); // init, otp, success
  const [payAmount, setPayAmount] = useState(0);
  const [payPassId, setPayPassId] = useState(null);

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async () => {
    try {
      const res = await api.getMyGuestPasses();
      if (res.success) {
        setPasses(res.passes);
        if (res.pricing) setPricing(res.pricing);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (end < start) return 0;
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    if (days === 0) return 0;
    
    let total = 0;
    if (formData.requires_room) {
      if (formData.guest_room_type === 'Non-AC') {
        total += (pricing.ROOM_NON_AC_PER_DAY * days);
      } else {
        total += (pricing.ROOM_AC_PER_DAY * days);
      }
    }
    if (formData.requires_meals) total += (pricing.MEALS_PER_DAY * days);
    
    if (!formData.requires_room && !formData.requires_meals) {
      total = 50 * days; // Base entry fee
    }
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (calculateDays() <= 0) {
      alert("End date cannot be before Start date");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await api.bookGuestPass(formData);
      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        setBookModalOpen(false);
        loadPasses();
        // Reset form
        setFormData({
          ...formData,
          guest_name: '',
          requires_room: false,
    guest_room_type: 'AC',
          requires_meals: false
        });
      } else {
        setMsg({ type: 'error', text: res.message });
      }
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayClick = (pass) => {
    setPayAmount(pass.total_amount);
    setPayPassId(pass.id);
    setRzpStatus('init');
    setShowRazorpayMock(true);
  };

  const processPayment = async () => {
    try {
      const res = await api.payForGuestPass(payPassId, 'Razorpay UPI');
      if (res.success) {
        setRzpStatus('success');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setMsg({ type: 'success', text: 'Payment Successful!' });
        setTimeout(() => {
          setShowRazorpayMock(false);
          loadPasses();
          setTimeout(() => setMsg(null), 3500);
        }, 1500);
      }
    } catch (err) {
      alert("Payment failed: " + err.message);
      setShowRazorpayMock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span className="text-3xl">🛏️</span> Guest / Visitor Passes
          </h2>
          <p className="text-sm text-slate-500 font-medium">Book premium hostel stays and meals for your parents or friends.</p>
        </div>
        
        <button 
          onClick={() => setBookModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/25 hover:bg-blue-700 transition flex items-center gap-2"
        >
          <PlusIcon /> Book New Pass
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          <CheckCircle className="w-5 h-5" /> {msg.text}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Secure Entry</h4>
          <p className="text-xs text-slate-500 mt-1">Pre-approved visitors get seamless entry at the main gate.</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Guest Room Access</h4>
          <p className="text-xs text-slate-500 mt-1">₹{pricing.ROOM_AC_PER_DAY}/day for a fully furnished AC guest room.</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CoffeeIcon />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Mess Meals</h4>
          <p className="text-xs text-slate-500 mt-1">₹{pricing.MEALS_PER_DAY}/day for 4 unlimited meals in the hostel mess.</p>
        </div>
      </div>

      {/* Passes List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">My Passes</h3>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            {passes.length} Records
          </span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading passes...</div>
        ) : passes.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-700">No Passes Booked</h4>
            <p className="text-sm text-slate-500 max-w-sm mt-1">You haven't requested any visitor passes yet. Click "Book New Pass" to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {passes.map((pass) => (
              <div key={pass.id} className="p-6 flex flex-col md:flex-row items-center gap-6 hover:bg-slate-50 transition">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xl shrink-0">
                  {pass.guest_name.charAt(0)}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-black text-slate-800 text-lg">{pass.guest_name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {pass.relation}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      pass.status === 'Approved' ? 'bg-amber-100 text-amber-700' :
                      pass.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      pass.status === 'Completed' ? 'bg-slate-100 text-slate-500' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {pass.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(pass.start_date).toLocaleDateString()} to {new Date(pass.end_date).toLocaleDateString()}
                      <span className="font-bold ml-1">({pass.days} days)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {pass.requires_room ? (
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 block"></span> Guest Room
                      </span>
                    ) : null}
                    {pass.requires_meals ? (
                      <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 block"></span> Mess Meals
                      </span>
                    ) : null}
                    {!pass.requires_room && !pass.requires_meals ? (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                        Campus Entry Only
                      </span>
                    ) : null}
                  </div>
                </div>
                
                <div className="shrink-0 flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase">Total Bill</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">₹{pass.total_amount}</p>
                  </div>
                  
                  {(pass.status === 'Approved' || pass.status === 'Completed' || pass.status === 'Active') && pass.payment_status === 'Unpaid' && (
                    <button 
                      onClick={() => handlePayClick(pass)}
                      className="px-4 py-2 bg-[#3395FF] hover:bg-blue-600 text-white text-xs font-black rounded-lg shadow-md flex items-center gap-2 transition"
                    >
                      <CreditCard className="w-4 h-4" /> Pay Now
                    </button>
                  )}
                  {pass.payment_status === 'Paid' && (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      <CheckCircle className="w-4 h-4" /> Paid Successfully
                    </div>
                  )}
                  {pass.status === 'Pending' && (
                    <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                      <Clock className="w-4 h-4" /> Awaiting Approval
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Modal isOpen={bookModalOpen} onClose={() => setBookModalOpen(false)} title="Book Guest Pass">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Guest Name</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="E.g., Ramesh Kumar"
                value={formData.guest_name}
                onChange={e => setFormData({...formData, guest_name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Relation</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.relation}
                onChange={e => setFormData({...formData, relation: e.target.value})}
              >
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Relative">Relative</option>
                <option value="Friend">Friend</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Check-in Date</label>
                <input 
                  required
                  type="date" 
                  min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.start_date}
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Check-out Date</label>
                <input 
                  required
                  type="date" 
                  min={formData.start_date}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.end_date}
                  onChange={e => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-3">Premium Add-ons</label>
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                      checked={formData.requires_room}
                      onChange={e => setFormData({...formData, requires_room: e.target.checked})}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">Furnished Guest Room</p>
                      <p className="text-xs text-slate-500">Provide on-campus accommodation.</p>
                    </div>
                  </label>
                  
                  {formData.requires_room && (
                    <div className="mt-3 ml-8 flex flex-col gap-2 border-t border-slate-100 pt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="room_type" value="AC" checked={formData.guest_room_type === 'AC'} onChange={() => setFormData({...formData, guest_room_type: 'AC'})} />
                        <span className="text-xs font-bold text-slate-700">AC Room (+₹{pricing.ROOM_AC_PER_DAY}/day)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="room_type" value="Non-AC" checked={formData.guest_room_type === 'Non-AC'} onChange={() => setFormData({...formData, guest_room_type: 'Non-AC'})} />
                        <span className="text-xs font-bold text-slate-700">Non-AC Room (+₹{pricing.ROOM_NON_AC_PER_DAY}/day)</span>
                      </label>
                    </div>
                  )}
                </div>
                
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                    checked={formData.requires_meals}
                    onChange={e => setFormData({...formData, requires_meals: e.target.checked})}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">Mess Meal Pass</p>
                    <p className="text-xs text-slate-500">4 daily meals (Breakfast, Lunch, Snacks, Dinner).</p>
                  </div>
                  <div className="text-right font-black text-slate-800">+₹{pricing.MEALS_PER_DAY}<span className="text-[10px] font-bold text-slate-400">/day</span></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-white flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-medium text-slate-400">Estimated Bill ({calculateDays()} Days)</p>
              <p className="text-3xl font-black">₹{calculateTotal()}</p>
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Razorpay Mock UI for Pass Payment */}
              {showRazorpayMock && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => rzpStatus === 'init' && setShowRazorpayMock(false)}
            />
            
            <div
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
                      <p className="text-[10px] opacity-80 uppercase tracking-wider">Guest Services</p>
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
                  <span className="text-3xl font-semibold tracking-tight">{payAmount}</span>
                </div>
              </div>

              {/* Contact Info Bar */}
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span>student@hostel.com</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 relative">
                {rzpStatus === 'init' ? (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Payment Method</p>
                    
                    <button 
                      onClick={() => setRzpStatus('otp')}
                      className="w-full bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between hover:border-[#3395FF] hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded text-blue-600 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-semibold text-slate-800">UPI / QR</h4>
                          <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm</p>
                        </div>
                      </div>
                      <span className="text-slate-300">&rsaquo;</span>
                    </button>
                    
                    <button 
                      onClick={() => setRzpStatus('otp')}
                      className="w-full bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between hover:border-[#3395FF] hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 rounded text-purple-600 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-semibold text-slate-800">Card</h4>
                          <p className="text-[10px] text-slate-500">Visa, MasterCard, RuPay</p>
                        </div>
                      </div>
                      <span className="text-slate-300">&rsaquo;</span>
                    </button>

                  </div>
                ) : rzpStatus === 'otp' ? (
                  <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#3395FF] mb-4">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Authenticating</h3>
                    <p className="text-xs text-slate-500 mb-6">Please approve the payment of ₹{payAmount} on your UPI app.</p>
                    
                    <div className="flex justify-center gap-2 mb-8">
                      <div className="w-2 h-2 rounded-full bg-[#3395FF]" />
                      <div className="w-2 h-2 rounded-full bg-[#3395FF]" />
                      <div className="w-2 h-2 rounded-full bg-[#3395FF]" />
                    </div>

                    <button 
                      onClick={processPayment}
                      className="px-6 py-2.5 bg-[#3395FF] hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition"
                    >
                      Simulate Success
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center">
                    <div
                      className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/30"
                    >
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">Payment Successful!</h3>
                    <p className="text-sm text-slate-500">Your guest pass payment of ₹{payAmount} is confirmed. Please collect your guest pass from the warden office.</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-center items-center gap-1 opacity-70">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor"/></svg>
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Secured by Razorpay</span>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const CoffeeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
);
