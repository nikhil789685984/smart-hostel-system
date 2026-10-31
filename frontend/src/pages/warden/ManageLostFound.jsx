import React, { useState, useEffect } from 'react';
import { PackageSearch, CheckCircle, XCircle, Search, MapPin, ExternalLink } from 'lucide-react';
import api from '../../services/api';

export default function ManageLostFound() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getLostFoundItems(null, null); // Get all
      if (res.success) setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleResolve = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this claim?`)) return;
    try {
      const res = await api.resolveLostFoundClaim(id, action);
      if (res.success) {
        alert(res.message);
        fetchItems();
      }
    } catch (err) {
      console.error(err);
      alert("Error resolving claim");
    }
  };

  const pendingClaims = items.filter(i => i.status === 'Claim_Pending');
  const activeItems = items.filter(i => i.status === 'Active');
  const resolvedItems = items.filter(i => i.status === 'Resolved');

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manage Lost & Found</h1>
          <p className="text-slate-500 mt-1">Review student claims and manage hostel inventory.</p>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-8">
          
          {/* Pending Claims Section */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">{pendingClaims.length}</span>
              Action Required: Pending Claims
            </h2>
            
            {pendingClaims.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">No pending claims.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingClaims.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                      <span className="font-bold text-amber-800 uppercase text-xs tracking-wider">CLAIM PENDING</span>
                      <span className="text-xs text-amber-600 font-bold">{item.category}</span>
                    </div>
                    <div className="p-5 flex-1">
                      <h3 className="font-bold text-lg text-slate-800 mb-1">{item.item_name}</h3>
                      <p className="text-sm text-slate-500 mb-4">Found at {item.location}</p>
                      
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Claimant Proof</p>
                        <p className="text-sm text-slate-700 italic">"{item.claim_proof}"</p>
                        <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-sm font-bold text-indigo-600">{item.claimer_name}</span>
                          <span className="text-xs text-slate-500 font-mono">{item.claimer_roll}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button onClick={() => handleResolve(item.id, 'APPROVE')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleResolve(item.id, 'REJECT')} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Items Board */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Active Board</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Reported By</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{item.item_name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${item.type === 'FOUND' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.location}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.reporter_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider bg-slate-100 text-slate-600">Active</span>
                      </td>
                    </tr>
                  ))}
                  {activeItems.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No active items.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
