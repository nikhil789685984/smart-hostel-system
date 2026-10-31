import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Minus, Search, Clock, Wallet, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

export default function NightCanteen() {
  const { user } = useAuth();
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showRazorpayMock, setShowRazorpayMock] = useState(false);
  const [rzpStatus, setRzpStatus] = useState('init'); // init, otp, success
  const [placingOrder, setPlacingOrder] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [menuRes, ordersRes] = await Promise.all([
        api.getCanteenMenu(),
        api.getMyCanteenOrders().catch(() => ({ orders: [] }))
      ]);
      if (menuRes.success) setMenu(menuRes.menu);
      if (ordersRes.success) setOrders(ordersRes.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };

  const itemsTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  // Hidden delivery charge logic
  const hiddenDeliveryCharge = 20; 
  const cartTotal = itemsTotal > 0 ? itemsTotal + hiddenDeliveryCharge : 0;

  const filteredMenu = menu.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setRzpStatus('init');
    setShowRazorpayMock(true);
  };

  const submitOrderToServer = async () => {
    setPlacingOrder(true);
    try {
      const res = await api.placeCanteenOrder({
        items: cart,
        total_amount: cartTotal,
        payment_mode: 'Razorpay UPI'
      });
      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        setCart([]);
        loadData();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } else {
        setMsg({ type: 'error', text: res.message });
      }
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error placing order' });
    } finally {
      setPlacingOrder(false);
      setShowRazorpayMock(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="text-3xl">🍔</span> Night Canteen
          </h2>
          <p className="text-sm text-slate-500 font-medium">Order food to your room. Secured by Razorpay.</p>
        </div>
        
        {msg && (
          <div className={`px-4 py-2 rounded-xl text-xs font-bold ${msg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {msg.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search from 200+ items (Maggi, Patties, Chai, Burgers...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm font-bold">Loading Menu...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[65vh] overflow-y-auto pr-2 pb-10">
              {filteredMenu.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition">
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-800 truncate">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-black text-emerald-600">₹{item.price}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart & Active Orders Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm sticky top-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              Your Cart
            </h3>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">Your cart is empty</p>
                <p className="text-[10px]">Add some late night snacks!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <p className="font-bold text-slate-700 text-xs truncate pr-2">{item.name}</p>
                        <p className="text-[10px] text-slate-500">₹{item.price} x {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100">
                        <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-200 rounded text-slate-600">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-200 rounded text-slate-600">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-3 border-t border-slate-100 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Total Amount</span>
                    <span className="font-black text-slate-800 text-lg">₹{cartTotal}</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 text-right mt-1">* Estimated delivery time: 10 mins</p>
                </div>
                
                <button 
                  onClick={handleCheckoutClick}
                  disabled={placingOrder}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4" />
                  {placingOrder ? 'Processing...' : `Pay ₹${cartTotal} via Razorpay`}
                </button>
              </>
            )}
          </div>

          {/* Active Orders */}
          {orders.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl">
              <h3 className="text-sm font-black flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-blue-400" />
                Recent Orders
              </h3>
              <div className="space-y-3">
                {orders.slice(0, 4).map(order => (
                  <div key={order.id} className="bg-white/10 rounded-xl p-3 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-400">Order #{order.id}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                        order.status === 'Pending' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-300 truncate mb-1.5">
                      {JSON.parse(order.items_json).map(i => `${i.qty}x ${i.name}`).join(', ')}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-400">Delivery in ~10m</span>
                      <span className="font-bold text-emerald-400 text-xs">₹{order.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Razorpay Mock Modal */}
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
                      <p className="text-[10px] opacity-80 uppercase tracking-wider">Canteen Environment</p>
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
                  <span className="text-3xl font-semibold tracking-tight">{cartTotal}</span>
                </div>
              </div>

              {/* Contact Info Bar */}
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span>{user?.email || 'student@hostel.com'}</span>
                </div>
                <span className="font-mono">{user?.phone || '9876543210'}</span>
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
                    <p className="text-xs text-slate-500 mb-6">Please approve the payment of ₹{cartTotal} on your UPI app.</p>
                    
                    <div className="flex justify-center gap-2 mb-8">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-[#3395FF]" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-[#3395FF]" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-[#3395FF]" />
                    </div>
                    
                    <button 
                      onClick={() => setRzpStatus('success')}
                      className="w-full py-3 bg-[#3395FF] text-white font-bold rounded-lg text-sm shadow-md"
                    >
                      Simulate Successful Payment
                    </button>
                    
                    <button 
                      onClick={() => setRzpStatus('init')}
                      className="mt-4 text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center p-6 text-center text-white">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-500 mb-4"
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </motion.div>
                    <h3 className="text-xl font-bold mb-1">Payment Successful!</h3>
                    <p className="text-sm opacity-90 mb-6">₹{cartTotal} paid to Apex Hostels</p>
                    
                    <button 
                      onClick={() => {
                        submitOrderToServer();
                      }}
                      className="w-full py-3 bg-white text-emerald-600 font-bold rounded-lg text-sm shadow-md"
                    >
                      Return to Canteen
                    </button>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="bg-white border-t border-slate-100 p-3 flex items-center justify-center gap-1 opacity-70">
                <Shield className="w-3 h-3" />
                <span className="text-[10px] font-bold tracking-wide uppercase text-slate-600">Secured by Razorpay</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
