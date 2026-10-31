import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Search, Users, BedDouble, Printer, ShieldCheck } from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';

export default function ManageGuestPasses() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [passToPrint, setPassToPrint] = useState(null);
  const printRef = useRef();

  const guestRooms = ['G-101 (AC)', 'G-102 (AC)', 'G-103 (Non-AC)', 'G-104 (Non-AC)', 'VIP Suite 1', 'VIP Suite 2'];

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async () => {
    try {
      const res = await api.getAllGuestPasses();
      if (res.success) {
        setPasses(res.passes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (pass) => {
    if (pass.requires_room) {
      setSelectedPass(pass);
      setSelectedRoom('');
      setApprovalModalOpen(true);
    } else {
      handleConfirmApproval(pass.id, 'Approved', null);
    }
  };

  const handleConfirmApproval = async (id, status, allocatedRoom) => {
    try {
      const res = await api.updateGuestPassStatus(id, status, allocatedRoom);
      if (res.success) {
        setApprovalModalOpen(false);
        loadPasses();
      }
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  const handlePrintClick = (pass) => {
    setPassToPrint(pass);
    setPrintModalOpen(true);
  };

  const triggerPrint = () => {
    // Safer print approach for React apps
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Apex Hostel - Guest Pass</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body, div, span, h1, h2 { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body class="bg-white flex items-center justify-center min-h-screen p-8">
          ${printContent}
          <script>
            // Wait for Tailwind to process and render fully
            setTimeout(() => {
              window.print();
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredPasses = passes.filter(p => {
    const matchesFilter = filter === 'All' ? true : p.status === filter;
    const matchesSearch = (p.student_name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (p.guest_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.roll_number || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span className="text-3xl">🛡️</span> Manage Guest Passes
          </h2>
          <p className="text-sm text-slate-500 font-medium">Allocate rooms and generate printable visitor e-passes.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between shadow-sm">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by student, guest or roll no..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto shrink-0">
          {['All', 'Pending', 'Approved', 'Active', 'Rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500 font-medium">Loading passes...</div>
        ) : filteredPasses.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No guest passes found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Guest Info</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Add-ons & Room</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPasses.map(pass => (
                  <tr key={pass.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{pass.student_name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{pass.roll_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{pass.guest_name}</div>
                      <div className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {pass.relation}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      <div>{new Date(pass.start_date).toLocaleDateString()} to</div>
                      <div>{new Date(pass.end_date).toLocaleDateString()} <span className="text-slate-400">({pass.days}d)</span></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {pass.requires_room ? (
                          <div className="text-[10px] text-indigo-700 font-bold flex flex-wrap items-center gap-1">
                            🛏️ {pass.guest_room_type || 'AC'} Room
                            {pass.allocated_room && (
                              <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded ml-1">
                                {pass.allocated_room}
                              </span>
                            )}
                          </div>
                        ) : null}
                        {pass.requires_meals ? <span className="text-[10px] text-orange-700 font-bold">🍽️ Mess Meals</span> : null}
                        {!pass.requires_room && !pass.requires_meals ? <span className="text-[10px] text-slate-500 font-bold">🚶 Entry Only</span> : null}
                        <span className="text-[10px] font-black text-slate-400 mt-1">₹{pass.total_amount} ({pass.payment_status})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                        pass.status === 'Approved' ? 'bg-amber-100 text-amber-700' :
                        pass.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        pass.status === 'Completed' ? 'bg-slate-100 text-slate-500' :
                        pass.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {pass.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pass.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleApproveClick(pass)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition shadow-sm"
                            title="Approve & Allocate Room"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleConfirmApproval(pass.id, 'Rejected', null)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition shadow-sm"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (pass.status === 'Approved' || pass.status === 'Active' || pass.status === 'Completed') ? (
                         <button 
                            onClick={() => handlePrintClick(pass)}
                            className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                         >
                            <Printer className="w-3.5 h-3.5" /> Print Pass
                         </button>
                      ) : (
                         <span className="text-[10px] uppercase font-bold text-slate-400">Action Taken</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Room Allocation Modal */}
      <Modal isOpen={approvalModalOpen} onClose={() => setApprovalModalOpen(false)} title="Allocate Guest Room">
        {selectedPass && (
          <div className="p-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-slate-800 mb-2">Guest & Requirement Details</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Guest Name</span>
                  <span className="font-bold text-slate-800">{selectedPass.guest_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Student</span>
                  <span className="font-bold text-slate-800">{selectedPass.student_name}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 mt-1 flex gap-3">
                  <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center gap-1">
                    🛏️ Requested: {selectedPass.guest_room_type || 'AC'} Room
                  </span>
                  {selectedPass.requires_meals && (
                    <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 font-bold text-[10px] flex items-center gap-1">
                      🍽️ Mess Meals Included
                    </span>
                  )}
                </div>
              </div>
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-indigo-600" /> Select Vacant Room
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {guestRooms.map(room => (
                <button
                  key={room}
                  type="button"
                  onClick={() => setSelectedRoom(room)}
                  className={`p-3 text-left border rounded-xl transition-all ${
                    selectedRoom === room 
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20' 
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${selectedRoom === room ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {room}
                    </span>
                    {selectedRoom === room && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setApprovalModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleConfirmApproval(selectedPass.id, 'Approved', selectedRoom)}
                disabled={!selectedRoom}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm & Approve
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Luxury Print Pass Modal */}
              {printModalOpen && passToPrint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setPrintModalOpen(false)}
            />
            
            <div
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Print Luxury E-Pass</h3>
                <div className="flex items-center gap-2">
                  <button onClick={triggerPrint} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-indigo-700 flex items-center gap-2">
                    <Printer className="w-4 h-4" /> Print PDF
                  </button>
                  <button onClick={() => setPrintModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PRINTABLE AREA */}
              <div className="p-8 bg-slate-100 flex items-center justify-center overflow-auto print:p-0">
                
                <div ref={printRef} className="w-[750px] h-[320px] bg-black rounded-2xl relative shadow-2xl flex border border-amber-900/40 text-slate-300 font-sans print:shadow-none overflow-hidden" 
                     style={{ 
                       backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a 0%, #000000 100%)',
                     }}>
                  
                  {/* Subtle Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(45deg, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                  
                  {/* Huge Watermark */}
                  <div className="absolute top-1/2 left-[35%] -translate-y-1/2 -translate-x-1/2 text-[180px] font-black text-white/[0.02] tracking-tighter select-none pointer-events-none z-0">
                    VIP
                  </div>

                  {/* Left Premium Edge */}
                  <div className="w-4 h-full bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>

                  {/* Main Ticket Body */}
                  <div className="flex-1 p-8 flex flex-col justify-between relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-black shadow-lg">
                          <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-black tracking-[0.15em] uppercase bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                            APEX HOSTEL
                          </h1>
                          <h2 className="text-[11px] font-bold text-amber-500/80 uppercase tracking-[0.3em] mt-0.5">
                            Exclusive Visitor Pass
                          </h2>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        <div className="px-3 py-1 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded text-amber-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
                          Premium Access
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">Pass ID</div>
                        <div className="text-lg text-white font-mono font-light tracking-widest">
                          APX-{(passToPrint.id || '').toString().padStart(5, '0')}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-16 mt-6">
                      <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-amber-500/30 rounded-r-md"></div>
                        <div className="text-[11px] text-slate-400 font-bold uppercase mb-1 tracking-widest">Guest Name</div>
                        <div className="text-2xl text-white font-black uppercase tracking-wider">{passToPrint.guest_name}</div>
                        <div className="text-xs text-amber-400 uppercase mt-1.5 font-bold tracking-widest">
                          {passToPrint.relation}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-[11px] text-slate-400 font-bold uppercase mb-1 tracking-widest">Hosted By</div>
                        <div className="text-lg text-slate-200 font-bold uppercase tracking-wider">{passToPrint.student_name}</div>
                        <div className="text-xs text-slate-500 uppercase mt-1.5 font-bold tracking-widest">
                          {passToPrint.roll_number}
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end border-t border-slate-800 pt-5">
                      <div className="flex gap-10">
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Check In</div>
                          <div className="text-base text-white font-bold whitespace-nowrap">{passToPrint.start_date ? new Date(passToPrint.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Check Out</div>
                          <div className="text-base text-white font-bold whitespace-nowrap">{passToPrint.end_date ? new Date(passToPrint.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                        </div>
                      </div>

                      <div className="flex gap-3 text-right">
                        {passToPrint.requires_room && (
                          <div className="bg-gradient-to-br from-amber-500/20 to-amber-900/20 border border-amber-500/30 px-4 py-2 rounded-lg text-center backdrop-blur-sm shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                            <div className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mb-0.5">Room</div>
                            <div className="text-sm text-amber-50 font-black">{passToPrint.allocated_room || 'Assigned'}</div>
                          </div>
                        )}
                        {passToPrint.requires_meals && (
                          <div className="bg-gradient-to-br from-amber-500/20 to-amber-900/20 border border-amber-500/30 px-4 py-2 rounded-lg text-center backdrop-blur-sm shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                            <div className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mb-0.5">Meals</div>
                            <div className="text-sm text-amber-50 font-black">INCLUDED</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Stub Divider (Perforated) */}
                  <div className="relative border-l-2 border-dashed border-slate-700/80 my-4 flex flex-col justify-between">
                    {/* Top semi-circle cutout */}
                    <div className="absolute -top-4 -left-3 w-6 h-6 bg-slate-100 rounded-full print:bg-white border-b-2 border-dashed border-slate-700/80"></div>
                    {/* Bottom semi-circle cutout */}
                    <div className="absolute -bottom-4 -left-3 w-6 h-6 bg-slate-100 rounded-full print:bg-white border-t-2 border-dashed border-slate-700/80"></div>
                  </div>

                  {/* Right Stub */}
                  <div className="w-[180px] p-6 flex flex-col justify-between items-center bg-gradient-to-b from-slate-900 to-black relative z-10">
                     <div className="w-full text-center mb-4">
                       <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Scan for Entry</div>
                     </div>
                     
                     <div className="w-24 h-24 bg-white p-1.5 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4">
                       <QRCode 
                         value={JSON.stringify({type: 'GUEST', id: passToPrint.id})} 
                         size={256} 
                         style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                         viewBox={`0 0 256 256`} 
                       />
                     </div>
                     
                     <div className="w-full flex flex-col items-center">
                        <div className="w-full h-8 flex justify-between items-end opacity-60 mb-2">
                          {/* Mock Barcode lines */}
                          {[...Array(20)].map((_, i) => (
                            <div key={i} className="bg-slate-400" style={{ width: `${Math.max(1, Math.random() * 4)}px`, height: `${Math.max(40, Math.random() * 100)}%` }}></div>
                          ))}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono tracking-[0.3em]">
                          {passToPrint.id}{(passToPrint.start_date || '').replace(/-/g, '')}
                        </div>
                     </div>

                     <div className="mt-4 w-full">
                       <div className={`text-[11px] font-black tracking-widest text-center uppercase py-1 border-t border-b ${
                         (passToPrint.status || '').toLowerCase() === 'approved' || (passToPrint.status || '').toLowerCase() === 'active' 
                         ? 'text-emerald-400 border-emerald-900/50' 
                         : 'text-rose-400 border-rose-900/50'
                       }`}>
                         {(passToPrint.status || 'UNKNOWN').toUpperCase()}
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}
