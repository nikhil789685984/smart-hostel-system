import React, { useState, useEffect } from 'react';
import { Search, MapPin, Tag, Plus, CheckCircle2, ShieldAlert, PackageSearch } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

export default function LostAndFound() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('FOUND'); // LOST or FOUND
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState(false);
  const [claimModal, setClaimModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [formData, setFormData] = useState({
    item_name: '', category: 'Electronics', description: '', location: '', image_url: ''
  });
  const [claimProof, setClaimProof] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getLostFoundItems(activeTab, 'Active');
      if (res.success) setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      const res = await api.reportLostFoundItem({ ...formData, type: activeTab });
      if (res.success) {
        setReportModal(false);
        setFormData({ item_name: '', category: 'Electronics', description: '', location: '', image_url: '' });
        fetchItems();
      }
    } catch (err) {
      console.error(err);
      alert("Error reporting item.");
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    try {
      const res = await api.claimFoundItem(selectedItem.id, claimProof);
      if (res.success) {
        setClaimModal(false);
        setClaimProof('');
        setSelectedItem(null);
        fetchItems();
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error claiming item.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <PackageSearch className="w-8 h-8 text-indigo-500" />
            Digital Lost & Found
          </h1>
          <p className="text-slate-500 font-medium mt-1">Report lost items or claim what you found.</p>
        </div>
        <button
          onClick={() => setReportModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" /> Report {activeTab === 'LOST' ? 'Lost Item' : 'Found Item'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/50 rounded-2xl w-full max-w-sm">
        <button
          onClick={() => setActiveTab('FOUND')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'FOUND' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Found Items Hub
        </button>
        <button
          onClick={() => setActiveTab('LOST')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'LOST' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Missing Board
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <PackageSearch className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">No {activeTab} items right now</h3>
          <p className="text-slate-500 mt-2">Everything seems to be in its right place.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              {item.image_url ? (
                <div className="w-full h-48 bg-slate-100 relative overflow-hidden">
                  <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold uppercase rounded-lg backdrop-blur-md ${activeTab === 'FOUND' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                    {activeTab}
                  </div>
                </div>
              ) : (
                <div className={`w-full h-32 flex flex-col items-center justify-center relative ${activeTab === 'FOUND' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <PackageSearch className={`w-10 h-10 ${activeTab === 'FOUND' ? 'text-emerald-200' : 'text-rose-200'}`} />
                  <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold uppercase rounded-lg ${activeTab === 'FOUND' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {activeTab}
                  </div>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-black text-slate-800 line-clamp-1">{item.item_name}</h3>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">{item.category}</span>
                </div>
                
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
                
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400" /> {item.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <ShieldAlert className="w-4 h-4 text-slate-400" /> Reported by {item.reporter_name}
                  </div>
                </div>

                {activeTab === 'FOUND' ? (
                  <button 
                    onClick={() => { setSelectedItem(item); setClaimModal(true); }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
                  >
                    Claim This Item
                  </button>
                ) : (
                  <button className="w-full py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl cursor-default">
                    Keep an eye out!
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      <Modal isOpen={reportModal} onClose={() => setReportModal(false)} title={`Report ${activeTab} Item`}>
        <form onSubmit={handleReport} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
            <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" placeholder="e.g. Blue Hydro Flask" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>Electronics</option><option>Clothing</option><option>Keys</option><option>Books</option><option>Wallet/ID</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Location {activeTab==='LOST' ? 'Lost' : 'Found'}</label>
              <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" placeholder="e.g. Block B Mess" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 h-24 resize-none" placeholder={`Describe the item...`} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Image URL (Optional)</label>
            <input type="url" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-4">
            Submit Report
          </button>
        </form>
      </Modal>

      {/* Claim Modal */}
      <Modal isOpen={claimModal} onClose={() => setClaimModal(false)} title="Claim Found Item">
        {selectedItem && (
          <form onSubmit={handleClaim} className="space-y-4 pt-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-4">
              <h4 className="font-bold text-indigo-900">{selectedItem.item_name}</h4>
              <p className="text-sm text-indigo-700 mt-1">Found at: {selectedItem.location}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Digital Proof of Ownership</label>
              <p className="text-xs text-slate-500 mb-3">Describe a unique feature, serial number, or what was inside it to prove it's yours.</p>
              <textarea required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 h-32 resize-none" placeholder="It has a scratch on the back left corner..." value={claimProof} onChange={e => setClaimProof(e.target.value)}></textarea>
            </div>
            <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl">
              Submit Claim for Verification
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
}
