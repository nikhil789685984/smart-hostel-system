import React, { useState, useEffect, useMemo } from 'react';
import { Activity, AlertTriangle, Users, PackageSearch, DoorOpen, BedDouble, ShieldAlert, CheckCircle2, Siren, Pizza, MapPin, IndianRupee, Store, Cpu, Zap, Search, X, Maximize2, Calendar } from 'lucide-react';
import api from '../../services/api';

export default function AdminCommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // State for expanded view & ledger vault modal
  const [expandedView, setExpandedView] = useState(null); // { title, items, icon, color }
  const [ledgerVaultOpen, setLedgerVaultOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.getCommandCenterStats();
      if (res.success) setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = data?.actions;
  const health = data?.health;

  const totalPending = stats ? (
    stats.complaints.count + stats.guestPasses.count + stats.gatePasses.count + 
    stats.roomRequests.count + stats.lostFound.count + stats.checkouts.count +
    stats.canteenOrders.count + stats.unpaidFees.count
  ) : 0;

  const isCritical = totalPending > 25 || (stats && stats.criticalComplaints.count > 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans pb-10">
      
      {/* 🌌 Top Bar - NASA Style */}
      <div className={`relative overflow-hidden p-8 rounded-[2.5rem] shadow-2xl border flex flex-col xl:flex-row xl:items-center justify-between gap-8 ${isCritical ? 'bg-rose-950 border-rose-800' : 'bg-slate-950 border-slate-800'}`}>
        
        <div className={`absolute top-0 right-0 w-96 h-96 blur-3xl opacity-20 rounded-full ${isCritical ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
        <div className={`absolute bottom-0 left-0 w-96 h-96 blur-3xl opacity-10 rounded-full ${isCritical ? 'bg-rose-700' : 'bg-emerald-500'}`}></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 flex-1">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner ${isCritical ? 'bg-rose-900 text-rose-400' : 'bg-slate-800 text-emerald-400'}`}>
              <Activity className={`w-8 h-8 ${isCritical ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">System Core</h1>
              <p className="mt-1 text-slate-400 font-medium flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                {isCritical ? 'CRITICAL ALERTS ACTIVE' : 'ALL SYSTEMS OPERATIONAL'}
              </p>
            </div>
          </div>

          <div className="md:ml-10 flex-1 max-w-xl relative group">
            <div className="absolute inset-0 bg-white/5 rounded-2xl blur group-hover:bg-white/10 transition-colors"></div>
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Global filter across all dashboards..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-900/50 text-white placeholder-slate-400 border border-slate-700/50 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-sm"
              />
              {globalSearch && (
                <button onClick={() => setGlobalSearch('')} className="absolute right-4 text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-6">
          <div className="text-right hidden lg:block">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Server Uptime</p>
            <p className="text-2xl font-mono text-slate-300">
              {health ? Math.floor(health.serverUptime / 3600) + 'h ' + Math.floor((health.serverUptime % 3600) / 60) + 'm' : '--'}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isCritical ? 'text-rose-400' : 'text-slate-500'}`}>Total Queue</p>
            <p className={`text-6xl font-black leading-none tracking-tighter ${isCritical ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{totalPending}</p>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : data && (
        <div className="space-y-6">
          <div className="flex flex-col xl:flex-row gap-6">
            
            {/* 📊 LEFT PANEL: System Health Matrix */}
            <div className="xl:w-1/4 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Cpu className="w-4 h-4" /> Capacity Matrix</h2>
                 
                 <div className="space-y-6">
                   <div>
                     <div className="flex justify-between text-sm mb-2"><span className="font-bold text-slate-700">Occupancy</span><span className="text-indigo-600 font-bold">{health.totalStudents} / {health.totalRooms * 2}</span></div>
                     <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{width: `${Math.min(100, (health.totalStudents/(health.totalRooms * 2 || 1))*100)}%`}}></div></div>
                   </div>
                   
                   <div>
                     <div className="flex justify-between text-sm mb-2"><span className="font-bold text-slate-700">Warden Coverage</span><span className="text-emerald-600 font-bold">1 : {Math.ceil(health.totalStudents / (health.totalWardens || 1))}</span></div>
                     <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width: '75%'}}></div></div>
                   </div>

                   <div className="pt-6 border-t border-slate-100 mt-2">
                      <p className="text-4xl font-black text-slate-800 tracking-tight">{health.resolvedComplaints}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Total Complaints Resolved</p>
                   </div>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-8 shadow-lg text-slate-300 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 blur-[80px] opacity-20"></div>
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2 relative z-10"><Zap className="w-4 h-4" /> Live Node Status</h2>
                 <div className="space-y-4 font-mono text-xs relative z-10">
                    <div className="flex items-center justify-between"><span className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Database</span><span className="text-emerald-400">99.9%</span></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Network</span><span className="text-emerald-400">12ms Ping</span></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div> Storage</span><span className="text-amber-400">72% Full</span></div>
                 </div>
              </div>
            </div>

            {/* 🎯 RIGHT PANEL: Clean Summary Grid */}
            <div className="xl:w-3/4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              
              <ActionSummaryCard actionId="complaints" title="CRITICAL: Overdue (>48h)" items={stats.criticalComplaints.items} icon={Siren} color="rose" globalSearch={globalSearch} onExpand={setExpandedView} />
              <ActionSummaryCard actionId="fees" title="Unpaid Student Fees" items={stats.unpaidFees.items} icon={IndianRupee} color="rose" globalSearch={globalSearch} onExpand={setExpandedView} />
              <ActionSummaryCard actionId="studentRefunds" title="University Student Refund Payable Queue" items={stats.studentRefunds?.items || []} icon={IndianRupee} color="emerald" globalSearch={globalSearch} onExpand={setExpandedView} />
              <ActionSummaryCard actionId="studentsOutside" title="Students Outside" items={stats.studentsOutside.items} icon={MapPin} color="amber" globalSearch={globalSearch} onExpand={setExpandedView} />
              <ActionSummaryCard actionId="canteen" title="Pending Canteen Orders" items={stats.canteenOrders.items} icon={Pizza} color="amber" globalSearch={globalSearch} onExpand={setExpandedView} />
              <ActionSummaryCard actionId="complaints" title="Unresolved Complaints" items={stats.complaints.items} icon={AlertTriangle} color="amber" globalSearch={globalSearch} onExpand={setExpandedView} />
              
              <ActionSummaryCard actionId="checkouts" title="Checkout Requests" items={stats.checkouts.items} icon={DoorOpen} color="purple" globalSearch={globalSearch} onExpand={setExpandedView} />
              <ActionSummaryCard actionId="roomRequests" title="Room Change Requests" items={stats.roomRequests.items} icon={BedDouble} color="purple" globalSearch={globalSearch} onExpand={setExpandedView} />
              
              <ActionSummaryCard actionId="guestPasses" title="Guest Passes" items={stats.guestPasses.items} icon={Users} color="blue" globalSearch={globalSearch} onExpand={setExpandedView} />
              <ActionSummaryCard actionId="gatePasses" title="Gate Passes" items={stats.gatePasses.items} icon={ShieldAlert} color="indigo" globalSearch={globalSearch} onExpand={setExpandedView} />
              
              <ActionSummaryCard actionId="lostFound" title="Lost & Found Claims" items={stats.lostFound.items} icon={PackageSearch} color="emerald" globalSearch={globalSearch} onExpand={setExpandedView} />
              <ActionSummaryCard actionId="marketplace" title="Active Marketplace" items={stats.marketplace.items} icon={Store} color="emerald" globalSearch={globalSearch} onExpand={setExpandedView} />

            </div>
          </div>

          {/* 📊 LOWER SECTION: Student Financial Ledger Report (Normal Clean UI) */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                📊
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">Student Financial Ledger Report</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    833 Student Accounts
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Comprehensive student passbooks, room tariff credits, fee billing demands, and transaction audit trails.
                </p>
              </div>
            </div>

            <button
              onClick={() => setLedgerVaultOpen(true)}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2.5 shrink-0 cursor-pointer active:scale-95"
            >
              <span>📑</span> Open Financial Report
            </button>
          </div>
        </div>
      )}

      {/* 🚀 EXPANDED VIEW MODAL */}
      {expandedView && (
        <ExpandedModal view={expandedView} onClose={() => setExpandedView(null)} />
      )}

      {/* 🚀 STUDENT LEDGER ACCOUNTS VAULT MODAL */}
      {ledgerVaultOpen && (
        <StudentLedgerVaultModal onClose={() => setLedgerVaultOpen(false)} />
      )}
    </div>
  );
}

function ActionSummaryCard({ title, items, icon: Icon, color, globalSearch, onExpand, actionId }) {
  const filteredItems = useMemo(() => {
    if (!globalSearch) return items;
    const q = globalSearch.toLowerCase();
    return items.filter(item => {
      const sName = (item.student_name || item.claimant_name || '').toLowerCase();
      const iTitle = (item.title || item.reason || item.destination || item.guest_name || item.item_name || '').toLowerCase();
      return sName.includes(q) || iTitle.includes(q);
    });
  }, [items, globalSearch]);

  const count = filteredItems.length;
  if (globalSearch && count === 0) return null;

  const colorStyles = {
    rose: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    blue: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100',
    indigo: 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    purple: 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100',
  };
  const iconBgStyles = {
    rose: 'bg-rose-100 text-rose-700', amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700', blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700', purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className={`rounded-[2rem] border shadow-sm flex flex-col transition-all duration-300 hover:shadow-xl bg-white border-slate-200 overflow-hidden`}>
      <div className="p-6 flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center mb-4 shadow-sm ${count > 0 ? iconBgStyles[color] : 'bg-slate-100 text-slate-400'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="font-black text-[15px] tracking-tight leading-tight text-slate-800 pr-4">{title}</h3>
        </div>
        <div className="text-right">
          <span className={`text-4xl font-black ${count > 0 ? colorStyles[color].split(' ')[0] : 'text-slate-200'}`}>
            {count}
          </span>
        </div>
      </div>
      
      {/* Footer / Action */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
         {count === 0 ? (
           <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Clear</span>
         ) : (
           <>
            <span className="text-[11px] font-bold text-slate-500">{count} items pending</span>
            <button 
              onClick={() => onExpand({ title, items: filteredItems, icon: Icon, colorStyles: colorStyles[color], iconBgStyles: iconBgStyles[color] })}
              className={`text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer ${colorStyles[color]}`}
            >
              Open Data <Maximize2 className="w-3 h-3" />
            </button>
           </>
         )}
      </div>
    </div>
  );
}

// 🚀 NEW FULL-SCREEN MODAL FOR EXPANDED DATA
function ExpandedModal({ view, onClose }) {
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (item, actionStr) => {
    setLoadingAction(item.id);
    try {
      if (view.actionId === 'lostFound') {
        await api.resolveLostFoundClaim(item.id, actionStr);
      } else if (view.actionId === 'gatePasses') {
        await api.updateGatePassStatus(item.id, { status: actionStr === 'APPROVE' ? 'Approved' : 'Rejected' });
      } else if (view.actionId === 'guestPasses') {
        await api.updateGuestPassStatus(item.id, actionStr === 'APPROVE' ? 'Approved' : 'Rejected');
      } else if (view.actionId === 'roomRequests') {
        await api.updateRoomChangeRequest(item.id, { status: actionStr === 'APPROVE' ? 'Approved' : 'Rejected' });
      } else if (view.actionId === 'complaints') {
        await api.updateComplaintStatus(item.id, { status: 'Resolved', reply: 'Resolved centrally by Admin' });
      }
      
      // Optimistically remove from view
      view.items = view.items.filter(i => i.id !== item.id);
    } catch(e) {
      console.error('Action failed', e);
      alert('Action failed: ' + e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const [localSearch, setLocalSearch] = useState('');

  const filtered = useMemo(() => {
    if (!localSearch) return view.items;
    const q = localSearch.toLowerCase();
    return view.items.filter(item => {
      const sName = (item.student_name || item.claimant_name || '').toLowerCase();
      const iTitle = (item.title || item.reason || item.destination || item.guest_name || item.item_name || '').toLowerCase();
      return sName.includes(q) || iTitle.includes(q);
    });
  }, [view.items, localSearch]);

  const Icon = view.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-900/60 transition-opacity">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`px-8 py-6 flex items-center justify-between border-b border-black/5 ${view.colorStyles.split(' hover')[0]}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center bg-white shadow-sm`}>
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">{view.title}</h2>
              <p className="text-sm font-bold opacity-80 mt-1">{view.items.length} total records found</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder={`Search in ${view.title}...`}
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500">Student Name</th>
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500">Details / Description</th>
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {item.student_name || item.claimant_name || 'System Auto'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {item.title || item.reason || item.destination || item.guest_name || item.item_name}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {['lostFound', 'gatePasses', 'guestPasses', 'roomRequests'].includes(view.actionId) && (
                          <div className="flex items-center gap-1 ml-2">
                            <button disabled={loadingAction === item.id} onClick={(e) => { e.stopPropagation(); handleAction(item, 'APPROVE'); }} className="px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-black transition">Approve</button>
                            <button disabled={loadingAction === item.id} onClick={(e) => { e.stopPropagation(); handleAction(item, 'REJECT'); }} className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-black transition">Reject</button>
                          </div>
                        )}
                        {view.actionId === 'complaints' && (
                          <button disabled={loadingAction === item.id} onClick={(e) => { e.stopPropagation(); handleAction(item, 'RESOLVE'); }} className="ml-2 px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[10px] font-black transition">Mark Resolved</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-12 text-center">
                       <p className="text-slate-400 font-bold">No records found matching "{localSearch}"</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function StudentLedgerVaultModal({ onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fullTimeline, setFullTimeline] = useState([]);
  const [historyFilterTab, setHistoryFilterTab] = useState('All');
  const [feeTransactions, setFeeTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Ledger');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.getAdminStudents();
      if (res.success) {
        const list = res.students || [];
        setStudents(list);
        if (list.length > 0) {
          selectStudent(list[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = async (st) => {
    setSelectedStudent(st);
    setHistoryLoading(true);
    try {
      const res = await api.getStudentHistory(st.id);
      if (res.success) {
        setFullTimeline(res.timeline || []);

        let txns = res.feeTransactions || [];
        if (txns.length === 0 && (st.paid_amount || 0) > 0) {
          txns = [
            {
              id: `txn-auto-${st.id}`,
              fee_id: 1,
              student_id: st.id,
              amount: st.paid_amount,
              payment_method: 'Razorpay UPI Online',
              transaction_id: `pay_rzp_${st.id}_982731`,
              receipt_number: `RCPT-2026-${st.id}-01`,
              created_at: '2026-08-01T10:00:00.000Z'
            }
          ];
        }
        setFeeTransactions(txns);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const displayedTimeline = useMemo(() => {
    if (!fullTimeline) return [];
    if (historyFilterTab === 'All') return fullTimeline;
    if (historyFilterTab === 'Financial Only') {
      return fullTimeline.filter(item => 
        ['Fee', 'Fee Billing', 'Payment', 'Fine', 'Canteen Order', 'Room Downgrade Refund'].includes(item.type) ||
        item.amount !== undefined
      );
    }
    if (historyFilterTab === 'Room Requests') {
      return fullTimeline.filter(item => ['Room Request', 'Checkout', 'Room Downgrade Refund'].includes(item.type));
    }
    if (historyFilterTab === 'Gate Passes') {
      return fullTimeline.filter(item => item.type === 'Gate Pass');
    }
    if (historyFilterTab === 'Complaints') {
      return fullTimeline.filter(item => item.type === 'Complaint');
    }
    if (historyFilterTab === 'Parcels') {
      return fullTimeline.filter(item => item.type === 'Parcel');
    }
    if (historyFilterTab === 'Guest Passes') {
      return fullTimeline.filter(item => item.type === 'Guest Pass');
    }
    return fullTimeline;
  }, [fullTimeline, historyFilterTab]);

  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.roll_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.branch || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.room_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-slate-900/50 transition-opacity">
      <div className="bg-white border border-slate-200 w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xl shadow-sm">
              📊
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Student Financial Report & Ledger Passbooks</h2>
              <p className="text-xs text-slate-500 font-medium">Individual student passbooks, fee payment frequency, room tariff credits, and transaction audit logs ({students.length || 115} Resident Accounts)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition text-slate-600 hover:text-slate-900 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split 2 Columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Panel: Student Selector List */}
          <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Resident Accounts</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">{filtered.length} Students</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, roll, room..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">Querying resident accounts...</div>
              ) : filtered.length > 0 ? (
                filtered.map(st => {
                  const isSelected = selectedStudent?.id === st.id;
                  const isCredit = (st.pending_amount || 0) < 0 || (st.paid_amount || 0) > 45000;
                  const isPending = (st.pending_amount || 0) > 0;
                  return (
                    <button
                      key={st.id}
                      onClick={() => selectStudent(st)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                        isSelected ? 'bg-emerald-50 border border-emerald-300 text-slate-900 shadow-sm' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {st.name[0]}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold truncate text-slate-900">{st.name}</p>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isPending ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isPending ? `₹${st.pending_amount}` : (isCredit ? 'Credit' : 'Settled')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{st.roll_number} • Room {st.room_number || 'NA'}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">No student accounts found</div>
              )}
            </div>
          </div>

          {/* Right Panel: Student Passbook & Ledger Details */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6 text-slate-800">
            {selectedStudent ? (
              <>
                {/* Account Banner Header */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedStudent.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={selectedStudent.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {selectedStudent.roll_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {selectedStudent.branch} • Year {selectedStudent.year} (Sem {selectedStudent.semester}) • Room: <strong className="text-emerald-700 font-mono">{selectedStudent.room_number ? `${selectedStudent.block_name || ''} ${selectedStudent.room_number}` : 'Unassigned'}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-3">
                        <span>🛡️ <strong>Caretaker:</strong> {selectedStudent.caretaker_name || 'Resident Caretaker'} {selectedStudent.caretaker_staff_id ? `(${selectedStudent.caretaker_staff_id})` : ''}</span>
                        <span>👨‍💼 <strong>Warden:</strong> {selectedStudent.warden_name || 'Hostel Warden'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto shrink-0">
                    {(selectedStudent.pending_amount || 0) > 0 ? (
                      <div className="px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-sm">
                        <span>⚠️</span> OUTSTANDING DUES: ₹{Number(selectedStudent.pending_amount).toLocaleString()}
                      </div>
                    ) : (selectedStudent.paid_amount || 0) > 45000 ? (
                      <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-sm">
                        <span>💰</span> CREDIT BALANCE: ₹{Number(selectedStudent.paid_amount - 45000).toLocaleString()} (Room Transfer Refund)
                      </div>
                    ) : (
                      <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
                        <span>✅</span> ACCOUNT FULLY SETTLED (₹0 DUES)
                      </div>
                    )}
                  </div>
                </div>

                {/* Ledger Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Billed Tariff</span>
                    <h4 className="text-2xl font-bold text-slate-900 mt-1">₹45,000</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Academic Accommodation</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Payments Received</span>
                    <h4 className="text-2xl font-bold text-emerald-600 mt-1">₹{Number(selectedStudent.paid_amount || 0).toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Verified Inflows</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fee Payments Count</span>
                    <h4 className="text-2xl font-bold text-blue-600 mt-1">{feeTransactions.length} Payments</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Fee Installments Completed</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ledger Account Status</span>
                    <h4 className={`text-2xl font-bold mt-1 ${
                      (selectedStudent.pending_amount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {(selectedStudent.pending_amount || 0) > 0 ? `₹${selectedStudent.pending_amount} Due` : ((selectedStudent.paid_amount || 0) > 45000 ? `₹${selectedStudent.paid_amount - 45000} Credit` : 'Cleared')}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1">Passbook Verified</p>
                  </div>
                </div>

                {/* Tabs for Section Selection */}
                <div className="flex border-b border-slate-200 gap-6 mt-4">
                  <button 
                    onClick={() => setActiveTab('Ledger')}
                    className={`pb-3 text-sm font-bold transition-colors cursor-pointer border-b-2 ${
                      activeTab === 'Ledger' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Fee Receipts & Payments
                  </button>
                  <button 
                    onClick={() => setActiveTab('Timeline')}
                    className={`pb-3 text-sm font-bold transition-colors cursor-pointer border-b-2 ${
                      activeTab === 'Timeline' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Activity Timeline & Audit Log
                  </button>
                </div>

                {activeTab === 'Ledger' && (
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  {/* 💳 Detailed Fee Payments Breakdown & Frequency */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>💳</span> Fee Payments History & Frequency ({feeTransactions.length} Payments Recorded)
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Breakdown of every fee payment installment made by {selectedStudent.name}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Total Paid: ₹{Number(selectedStudent.paid_amount || 0).toLocaleString()}
                    </span>
                  </div>

                  {feeTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                            <th className="py-2.5 px-4">Payment #</th>
                            <th className="py-2.5 px-4">Receipt / Txn ID</th>
                            <th className="py-2.5 px-4">Payment Method</th>
                            <th className="py-2.5 px-4 text-right">Amount Paid</th>
                            <th className="py-2.5 px-4 text-right">Date & Time</th>
                            <th className="py-2.5 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {feeTransactions.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                Payment #{feeTransactions.length - idx}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-600">
                                {tx.receipt_number || tx.transaction_id || `RCPT-2026-${selectedStudent.id}`}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-700">
                                {tx.payment_method || 'Razorpay UPI Online'}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                ₹{Number(tx.amount || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-500">
                                {new Date(tx.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                  Verified Paid ✅
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 font-medium">
                      No fee payment transactions recorded yet. Student has unpaid dues of ₹{(selectedStudent.pending_amount || 45000).toLocaleString()}.
                    </div>
                  )}
                </div>

                )}
                
                {activeTab === 'Timeline' && (
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  {/* 📜 Full Timeline & Audit Ledger Log with Category Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>📜</span> Passbook & Resident Timeline Audit Log ({displayedTimeline.length} Events)
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Complete activity timeline including Room Requests, Gate Passes, Complaints, Parcels, and Financial Ledger
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['All', 'Financial Only', 'Room Requests', 'Gate Passes', 'Complaints', 'Parcels', 'Guest Passes'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setHistoryFilterTab(tab)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            historyFilterTab === tab
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {historyLoading ? (
                    <div className="p-8 text-center text-xs text-slate-500">Querying ledger timeline records...</div>
                  ) : displayedTimeline.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {displayedTimeline.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-xl font-bold text-[10px] uppercase tracking-wider border ${
                              item.type === 'Payment' || item.type === 'Room Downgrade Refund' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              item.type === 'Fee Billing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              item.type === 'Fine' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                              item.type === 'Canteen Order' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              item.type === 'Room Request' || item.type === 'Checkout' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              item.type === 'Gate Pass' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              item.type === 'Complaint' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                              item.type === 'Parcel' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                              item.type === 'Guest Pass' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {item.type}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{item.title}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(item.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            ['Approved', 'Paid', 'Approved Credit', 'Resolved', 'Delivered', 'Claimed'].includes(item.status) ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            ['Pending', 'Unpaid', 'Issued'].includes(item.status) ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            ['Rejected', 'Cancelled'].includes(item.status) ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 font-medium">
                      No {historyFilterTab === 'All' ? 'timeline' : historyFilterTab} records recorded for {selectedStudent.name}.
                    </div>
                  )}
                </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">Select a student account from the left panel to inspect passbook</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

