import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import {
  ShoppingBag,
  Search,
  Plus,
  Tag,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Calculator,
  Bike,
  Lamp,
  Tv,
  Armchair,
  Trophy,
  Package,
  Trash2,
  Check,
  RefreshCw,
  MessageCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Copy,
  Send,
  X,
  CheckCheck,
  Clock,
  User,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'All', label: 'All Items', icon: ShoppingBag },
  { id: 'Books & Notes', label: '📚 Books & Notes', icon: BookOpen },
  { id: 'Calculators & Gadgets', label: '🧮 Calculators & Gadgets', icon: Calculator },
  { id: 'Cycles & Mobility', label: '🚲 Cycles & Mobility', icon: Bike },
  { id: 'Table Lamps & Lighting', label: '💡 Table Lamps & Lighting', icon: Lamp },
  { id: 'Room Appliances', label: '❄️ Room Appliances', icon: Tv },
  { id: 'Furniture & Storage', label: '🪑 Furniture & Storage', icon: Armchair },
  { id: 'Sports & Fitness', label: '🏸 Sports & Fitness', icon: Trophy },
  { id: 'Hostel Essentials', label: '🧺 Hostel Essentials', icon: Package }
];

export default function HostelMarketplace() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-items' | 'chats'
  const [conditionFilter, setConditionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price-asc' | 'price-desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);

  // Modals & Chat Drawers
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [activeChatSeller, setActiveChatSeller] = useState(null); // { item, seller_name, seller_avatar, location_badge... }
  const [callModalItem, setCallModalItem] = useState(null);

  // Chat Conversations State: Map of sellerKey -> Array of messages
  // Stored in localStorage for persistence across reloads
  const [chatConversations, setChatConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('hostel_marketplace_chats');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isSellerTyping, setIsSellerTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Form States for Post Item
  const [formData, setFormData] = useState({
    title: '',
    category: 'Books & Notes',
    price: '',
    condition: 'Like New',
    description: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Save chats to localStorage whenever they update
  useEffect(() => {
    try {
      localStorage.setItem('hostel_marketplace_chats', JSON.stringify(chatConversations));
    } catch (e) {
      console.error('Failed to save chats to localStorage', e);
    }
  }, [chatConversations]);

  // Scroll chat to bottom when active messages change
  useEffect(() => {
    if (activeChatSeller) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatConversations, activeChatSeller, isSellerTyping]);

  const fetchItems = async () => {
    try {
      const res = await api.getMarketplaceItems({
        category: selectedCategory === 'All' ? '' : selectedCategory,
        search
      });
      setItems(res.items || []);
    } catch (err) {
      console.error('Error fetching marketplace items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    setCurrentPage(1);
  }, [selectedCategory, search]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createMarketplaceItem(formData);
      setMsg(res.message || 'Item posted successfully!');
      setPostModalOpen(false);
      setFormData({
        title: '',
        category: 'Books & Notes',
        price: '',
        condition: 'Like New',
        description: '',
        image_url: ''
      });
      fetchItems();
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Error posting item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await api.updateMarketplaceItemStatus(id, status);
      setMsg(res.message || `Status updated to ${status}`);
      fetchItems();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to remove this marketplace listing?')) return;
    try {
      const res = await api.deleteMarketplaceItem(id);
      setMsg(res.message || 'Listing deleted');
      fetchItems();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Error deleting listing');
    }
  };

  // Open Chat Drawer with a Seller for a specific Item
  const handleStartChat = (item) => {
    const chatKey = `chat_item_${item.id}_seller_${item.student_id || item.seller_user_id || item.id}`;
    
    // Initialize default welcome message if empty
    if (!chatConversations[chatKey]) {
      const initialMsgs = [
        {
          id: Date.now() - 1000,
          sender: 'seller',
          text: `Hey! Thanks for inquiring about "${item.title}". It's listed for ₹${item.price} (${item.condition}). Feel free to ask any questions or schedule room pickup!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        }
      ];
      setChatConversations(prev => ({ ...prev, [chatKey]: initialMsgs }));
    }

    setActiveChatSeller({
      key: chatKey,
      item,
      seller_name: item.seller_name,
      seller_avatar: item.seller_avatar,
      seller_phone: item.seller_phone,
      location_badge: item.location_badge
    });
  };

  // Send a message in active chat
  const handleSendMessage = (customText) => {
    const textToSend = customText || inputMessage;
    if (!textToSend || !textToSend.trim() || !activeChatSeller) return;

    const chatKey = activeChatSeller.key;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: textToSend.trim(),
      timestamp: nowTime,
      status: 'sent'
    };

    // Update conversation with user message
    setChatConversations(prev => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), newMsg]
    }));

    if (!customText) setInputMessage('');

    // Simulate seller typing & auto-response after 1.2s
    setIsSellerTyping(true);

    setTimeout(() => {
      setIsSellerTyping(false);
      
      let replyText = `Hi! Yes, "${activeChatSeller.item.title}" is available! You can visit ${activeChatSeller.location_badge || 'my room'} anytime between 4 PM and 9 PM today to take a look.`;
      
      const lower = textToSend.toLowerCase();
      if (lower.includes('price') || lower.includes('discount') || lower.includes('final') || lower.includes('best')) {
        const itemPrice = Number(activeChatSeller.item.price) || 0;
        const discountPrice = Math.max(0, itemPrice - 50);
        replyText = `Since you are a resident in the same hostel, I can give it to you for ₹${discountPrice} if you pick it up today!`;
      } else if (lower.includes('available') || lower.includes('still have')) {
        replyText = `Yes! Still available and in ${activeChatSeller.item.condition} condition. No issues at all.`;
      } else if (lower.includes('today') || lower.includes('now') || lower.includes('room') || lower.includes('pickup')) {
        replyText = `Awesome! Drop by ${activeChatSeller.location_badge || 'Block B Room 204'}. Call or text me when you are outside!`;
      }

      const sellerReply = {
        id: Date.now() + 1,
        sender: 'seller',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };

      setChatConversations(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []).map(m => m.sender === 'me' ? { ...m, status: 'read' } : m), sellerReply]
      }));

      // Also fire backend staff/student message API silently
      api.sendStaffMessage({
        receiver_id: activeChatSeller.item.seller_user_id || 1,
        content: `[Marketplace Chat: ${activeChatSeller.item.title}]\n${textToSend}`
      }).catch(() => {});

    }, 1400);
  };

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 3000);
  };

  const currentStudentId = user?.student?.id || user?.id;

  // Filter items
  let processedItems = items.filter(item => {
    if (activeTab === 'my-items') {
      return item.student_id === currentStudentId || item.seller_email === user?.email;
    }
    if (conditionFilter !== 'All') {
      return item.condition === conditionFilter;
    }
    return true;
  });

  // Sort items
  processedItems = [...processedItems].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return new Date(b.created_at) - new Date(a.created_at); // newest
  });

  // Pagination Logic
  const totalItems = processedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDisplayedItems = processedItems.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const activeChatCount = Object.keys(chatConversations).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Loading 200+ Marketplace Listings & Chats...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Resident Peer-To-Peer Marketplace
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black">
                {items.length}+ Items Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              🛒 Hostel Mini Marketplace
            </h1>
            <p className="text-xs text-emerald-200/80 max-w-2xl font-medium leading-relaxed">
              Buy, sell, or live-chat with verified campus residents for engineering calculators, cycles, textbooks, table lamps, room coolers & hostel essentials.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              onClick={() => setPostModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Sell Item
            </button>
            <button
              onClick={fetchItems}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-2 backdrop-blur cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-emerald-300" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-800 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Toolbar & Category Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
        
        {/* Row 1: Search & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl flex-wrap">
            <button
              onClick={() => { setActiveTab('browse'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Browse All ({items.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('my-items'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'my-items'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tag className="w-4 h-4 text-amber-500" />
              <span>My Listings</span>
            </button>

            <button
              onClick={() => { setActiveTab('chats'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer relative ${
                activeTab === 'chats'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageCircle className={`w-4 h-4 ${activeTab === 'chats' ? 'text-white' : 'text-emerald-600'}`} />
              <span>💬 Active Chats ({activeChatCount})</span>
              {activeChatCount > 0 && activeTab !== 'chats' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 animate-ping" />
              )}
            </button>
          </div>

          {/* Search Box & Sort */}
          {activeTab !== 'chats' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search calculator, cycle, book, cooler, lamp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:border-emerald-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Condition Filter */}
              <select
                value={conditionFilter}
                onChange={(e) => { setConditionFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none cursor-pointer"
              >
                <option value="All">All Conditions</option>
                <option value="New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>

              {/* Sort Filter */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          )}
        </div>

        {/* Category Pills */}
        {activeTab !== 'chats' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ACTIVE CHATS TAB VIEW */}
      {activeTab === 'chats' ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                💬 Your Marketplace Conversations ({activeChatCount})
              </h3>
              <p className="text-xs text-slate-500 font-medium">Direct instant messages with verified resident sellers</p>
            </div>
          </div>

          {activeChatCount === 0 ? (
            <div className="text-center py-12 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-800">No Active Conversations Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "💬 Chat Seller" on any product card in the marketplace to start chatting directly!
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                Browse Marketplace Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(chatConversations).map(([chatKey, msgs]) => {
                const lastMsg = msgs[msgs.length - 1];
                const firstMsgText = msgs[0]?.text || '';
                // extract title from firstMsgText
                const match = firstMsgText.match(/inquiring about "([^"]+)"/);
                const itemTitle = match ? match[1] : 'Marketplace Item';

                return (
                  <div
                    key={chatKey}
                    onClick={() => {
                      // find matching item if available
                      const itemIdMatch = chatKey.match(/chat_item_(\d+)/);
                      const matchedItem = items.find(i => String(i.id) === (itemIdMatch ? itemIdMatch[1] : '')) || {
                        id: itemIdMatch ? itemIdMatch[1] : 1,
                        title: itemTitle,
                        price: 500,
                        seller_name: 'Verified Resident',
                        location_badge: 'Hostel Resident'
                      };
                      handleStartChat(matchedItem);
                    }}
                    className="p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 transition cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-sm">
                          💬
                        </div>
                        <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700 transition">
                          {itemTitle}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium truncate">
                          {lastMsg ? `${lastMsg.sender === 'me' ? 'You: ' : ''}${lastMsg.text}` : 'No messages'}
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold">{lastMsg?.timestamp}</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0">
                      Open Chat
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ITEMS PRODUCT GRID */
        currentDisplayedItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-900">No Items Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search ? 'No marketplace items match your search query.' : 'No items listed in this category yet. Be the first resident to post!'}
            </p>
            <button
              onClick={() => setPostModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold transition inline-flex items-center gap-1.5 mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Post Item Now
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentDisplayedItems.map(item => {
                const isOwner = item.student_id === currentStudentId || item.seller_email === user?.email;
                const isSold = item.status === 'Sold';

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-white rounded-3xl border-2 border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group ${
                      isSold ? 'opacity-75 grayscale-[30%]' : ''
                    }`}
                  >
                    <div>
                      {/* Item Image & Badges */}
                      <div className="relative h-48 bg-slate-100 overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400';
                          }}
                        />
                        
                        {/* Price Tag */}
                        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur text-white px-3 py-1 rounded-xl text-xs font-black shadow-md border border-white/20">
                          {item.price > 0 ? `₹${Number(item.price).toLocaleString('en-IN')}` : '🎁 FREE'}
                        </div>

                        {/* Condition Badge */}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-900 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow border border-slate-200">
                          {item.condition}
                        </div>

                        {/* Sold Banner */}
                        {isSold && (
                          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                            <span className="bg-rose-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg border border-white">
                              SOLD OUT
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Body Info */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          <span className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{item.category}</span>
                          <span className="font-mono text-slate-400">{new Date(item.created_at).toLocaleDateString('en-IN')}</span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 h-10">
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed h-8">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer & Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                      
                      {/* Seller Details */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img
                            src={item.seller_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={item.seller_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <p className="text-xs font-black text-slate-900 truncate">{item.seller_name}</p>
                            <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 truncate">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                              {item.location_badge || 'Verified Resident'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {isOwner ? (
                        <div className="flex items-center gap-2 pt-1">
                          {item.status !== 'Sold' ? (
                            <button
                              onClick={() => handleStatusUpdate(item.id, 'Sold')}
                              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Mark Sold
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(item.id, 'Available')}
                              className="flex-1 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Re-list Item
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs transition cursor-pointer"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          {/* 💬 Live Chat Seller Button */}
                          <button
                            onClick={() => handleStartChat(item)}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" /> Chat Seller
                          </button>

                          {/* 📞 Call Seller Button */}
                          <button
                            onClick={() => setCallModalItem(item)}
                            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            title="Call Seller"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" /> Call
                          </button>
                        </div>
                      )}

                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* PAGINATION CONTROLS BAR */}
            {totalPages > 1 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="text-xs font-bold text-slate-600">
                  Showing <span className="text-emerald-700 font-extrabold">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="text-emerald-700 font-extrabold">{Math.min(indexOfLastItem, totalItems)}</span> of{' '}
                  <span className="text-slate-900 font-black">{totalItems}</span> items
                </div>

                <div className="flex items-center gap-2">
                  {/* Items per page selector */}
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 mr-2"
                  >
                    <option value={16}>16 per page</option>
                    <option value={32}>32 per page</option>
                    <option value={64}>64 per page</option>
                    <option value={100}>100 per page</option>
                  </select>

                  {/* First Page */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Prev Page */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Indicator */}
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
                    Page {currentPage} of {totalPages}
                  </span>

                  {/* Next Page */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* 💬 REAL-TIME 1-ON-1 BUYER-SELLER LIVE CHAT DRAWER / MODAL */}
      <AnimatePresence>
        {activeChatSeller && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="w-full max-w-lg h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative"
            >
              {/* Chat Window Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative shrink-0">
                    <img
                      src={activeChatSeller.seller_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={activeChatSeller.seller_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                    />
                    <span className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 absolute bottom-0 right-0" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-xs font-black text-white truncate flex items-center gap-1.5">
                      {activeChatSeller.seller_name}
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">🟢 Online</span>
                    </h3>
                    <p className="text-[10px] text-emerald-200 font-medium truncate">
                      {activeChatSeller.location_badge || 'Verified Hostel Resident'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${activeChatSeller.seller_phone || '+919876543210'}`}
                    className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs transition"
                    title="Call Seller"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setActiveChatSeller(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Item Context Sub-Header */}
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={activeChatSeller.item.image_url}
                    alt={activeChatSeller.item.title}
                    className="w-7 h-7 rounded-md object-cover shrink-0"
                  />
                  <span className="truncate">{activeChatSeller.item.title}</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-700 text-white font-black text-[11px] shrink-0">
                  ₹{activeChatSeller.item.price}
                </span>
              </div>

              {/* Message Stream Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/70">
                {(chatConversations[activeChatSeller.key] || []).map((msgItem) => {
                  const isMe = msgItem.sender === 'me';
                  return (
                    <motion.div
                      key={msgItem.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[82%] p-3.5 rounded-2xl shadow-xs space-y-1 ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{msgItem.text}</p>
                        <div className={`flex items-center justify-end gap-1 text-[9px] font-bold ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                          <span>{msgItem.timestamp}</span>
                          {isMe && (
                            <CheckCheck className={`w-3 h-3 ${msgItem.status === 'read' ? 'text-cyan-300' : 'text-emerald-200'}`} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Live Typing Indicator */}
                {isSellerTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-2xl rounded-bl-xs text-xs font-bold flex items-center gap-2 shadow-xs">
                      <span className="text-[10px] text-emerald-700 font-extrabold">{activeChatSeller.seller_name} is typing</span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Quick Action Reply Chips */}
              <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-none">
                <button
                  onClick={() => handleSendMessage(`Hi! Is "${activeChatSeller.item.title}" still available?`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-[11px] font-bold text-slate-700 whitespace-nowrap transition cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-500" /> Is this available?
                </button>
                <button
                  onClick={() => handleSendMessage(`Can I come pick it up today at ${activeChatSeller.location_badge || 'your room'}?`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-[11px] font-bold text-slate-700 whitespace-nowrap transition cursor-pointer flex items-center gap-1"
                >
                  <Clock className="w-3 h-3 text-emerald-500" /> Can I pick up today?
                </button>
                <button
                  onClick={() => handleSendMessage(`What is your best final price for this item?`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-[11px] font-bold text-slate-700 whitespace-nowrap transition cursor-pointer flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-cyan-500" /> Best final price?
                </button>
              </div>

              {/* Chat Message Input Bar */}
              <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder={`Type a message to ${activeChatSeller.seller_name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 px-4 py-2.5 text-xs rounded-2xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-md transition cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📞 CALL SELLER MODAL */}
      <Modal
        isOpen={Boolean(callModalItem)}
        onClose={() => setCallModalItem(null)}
        title={`📞 Call Seller`}
        subtitle={`Contact verified resident ${callModalItem?.seller_name}`}
      >
        {callModalItem && (
          <div className="space-y-4 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300">
              <Phone className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">{callModalItem.seller_name}</h3>
              <p className="text-xs text-emerald-700 font-bold">{callModalItem.location_badge}</p>
              <p className="text-xs text-slate-500 mt-1 font-mono font-bold">
                {callModalItem.seller_phone || '+91 98765 43210'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`tel:${callModalItem.seller_phone || '+919876543210'}`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" /> Dial Phone Call
              </a>

              <button
                onClick={() => handleCopyPhone(callModalItem.seller_phone || '+919876543210')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                {copiedPhone ? 'Copied to Clipboard!' : 'Copy Number'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* POST NEW ITEM MODAL */}
      <Modal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        title="Post Item for Sale on Hostel Marketplace"
        subtitle="Only verified hostel residents can view and contact you"
      >
        <form onSubmit={handlePostSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Item Title / Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Casio FX-991EX Calculator / Hero Sprint Cycle / GATE Notes"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Price (₹) [0 for Free Giveaway] *
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Item Condition *
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="New">Brand New</option>
                <option value="Like New">Like New (Unused / Lightly used)</option>
                <option value="Good">Good (Working fine)</option>
                <option value="Fair">Fair (Usable condition)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description & Pickup Instructions *
            </label>
            <textarea
              rows="3"
              placeholder="Describe condition, features, warranty, and room pickup timing..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPostModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition cursor-pointer"
            >
              {submitting ? 'Posting...' : 'Post Item for Sale'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
