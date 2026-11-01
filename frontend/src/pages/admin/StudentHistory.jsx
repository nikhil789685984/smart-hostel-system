import React, { useState, useEffect } from 'react';
import { Search, Clock, Activity, FileText, CheckCircle, AlertCircle, Package, ArrowRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';


export default function StudentHistory() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('All');
  
  const tabs = ['All', 'Payment', 'Fee Billing', 'Room Downgrade Refund', 'Gate Pass', 'Guest Pass', 'Complaint', 'Parcel', 'Room Request', 'Checkout', 'Fine', 'Canteen Order'];


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
          loadHistory(list[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (student) => {
    setSelectedStudent(student);
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const res = await api.getStudentHistory(student.id);
      if (res.success) {
        setHistoryData(res.timeline);
      }
    } catch (err) {
      console.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-80px)] gap-6 p-4 sm:p-6 overflow-hidden">
      
      {/* Left Panel: Student Selection */}
      <div className="w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-indigo-600" />
            Select Student
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredStudents.length > 0 ? (
            <div className="space-y-1">
              {filteredStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => loadHistory(student)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                    selectedStudent?.id === student.id 
                      ? 'bg-indigo-50 border border-indigo-100 shadow-sm' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    selectedStudent?.id === student.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {student.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${selectedStudent?.id === student.id ? 'text-indigo-900' : 'text-slate-700'}`}>{student.name}</p>
                    <p className="text-xs text-slate-500 truncate">{student.roll_number}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-500 text-sm">No students found</div>
          )}
        </div>
      </div>

      {/* Right Panel: History Timeline */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
        {!selectedStudent ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center shadow-inner border border-slate-100">
                <Clock className="w-10 h-10 text-slate-300" />
             </div>
             <div className="text-center">
                <h3 className="text-lg font-bold text-slate-700">Student History</h3>
                <p className="text-sm">Select a student from the list to view their complete timeline.</p>
             </div>
           </div>
        ) : (
          <>

            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-indigo-600" />
                    {selectedStudent.name}'s History
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span><strong className="text-slate-700">Roll No:</strong> {selectedStudent.roll_number}</span>
                    <span>•</span>
                    <span><strong className="text-slate-700">Room:</strong> {selectedStudent.room_number ? `${selectedStudent.block_name || ''} - ${selectedStudent.room_number}` : 'Not Assigned'}</span>
                    {selectedStudent.caretaker_name && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-900 px-2.5 py-0.5 rounded-xl border border-indigo-200 font-bold text-xs shadow-2xs">
                          <span>🛡️</span> <strong>Caretaker:</strong> {selectedStudent.caretaker_name} ({selectedStudent.caretaker_staff_id || 'Staff'})
                        </span>
                      </>
                    )}
                    {selectedStudent.warden_name && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-xl border border-slate-200 font-bold text-xs">
                          <span>👨‍💼</span> <strong>Warden:</strong> {selectedStudent.warden_name}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Tab Bar */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>


            <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50/50">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="font-bold text-sm tracking-wide">Fetching complete history...</p>
                </div>

              ) : historyData && historyData.length > 0 ? (
                <div className="relative max-w-3xl mx-auto border-l-2 border-slate-200/60 ml-4 lg:ml-8 space-y-8">
                  {historyData.filter(i => activeTab === 'All' || i.type === activeTab).length === 0 ? (
                      <div className="text-center p-8 text-slate-400 font-medium">No {activeTab} records found.</div>
                  ) : historyData.filter(i => activeTab === 'All' || i.type === activeTab).map((item, idx) => {

                    let colorClass = 'text-slate-500 bg-slate-100';
                    let dotColor = 'border-slate-400';
                    let badgeBg = 'bg-white';
                    
                    if (item.type === 'Gate Pass') { colorClass = 'text-blue-600 bg-blue-100'; dotColor = 'border-blue-500'; }
                    else if (item.type === 'Complaint') { colorClass = 'text-red-600 bg-red-100'; dotColor = 'border-red-500'; badgeBg = 'bg-red-50'; }
                    else if (item.type === 'Parcel') { colorClass = 'text-purple-600 bg-purple-100'; dotColor = 'border-purple-500'; }
                    else if (item.type === 'Room Request') { colorClass = 'text-orange-600 bg-orange-100'; dotColor = 'border-orange-500'; }
                    else if (item.type === 'Checkout') { colorClass = 'text-rose-600 bg-rose-100'; dotColor = 'border-rose-500'; badgeBg = 'bg-rose-50'; }
                    else if (item.type === 'Fine') { colorClass = 'text-amber-700 bg-amber-100'; dotColor = 'border-amber-500'; badgeBg = 'bg-amber-50/50'; }
                    else if (item.type === 'Canteen Order') { colorClass = 'text-emerald-700 bg-emerald-100'; dotColor = 'border-emerald-500'; badgeBg = 'bg-emerald-50/50'; }
                    else if (item.type === 'Payment' || item.type === 'Room Downgrade Refund') { colorClass = 'text-emerald-700 bg-emerald-100'; dotColor = 'border-emerald-500'; badgeBg = 'bg-emerald-50/50'; }
                    else if (item.type === 'Fee Billing') { colorClass = 'text-blue-700 bg-blue-100'; dotColor = 'border-blue-500'; badgeBg = 'bg-blue-50/50'; }

                    return (
                      <div 
                        
                        
                        
                        key={item.type + item.id} 
                        className="relative pl-8 group"
                      >
                        <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-50 shadow-sm ${dotColor} bg-white group-hover:scale-125 transition-transform`}></div>
                        
                        <div className={`p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md hover:border-indigo-300 transition-all ${badgeBg}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${colorClass}`}>
                              {item.type}
                            </span>
                            <span className="text-xs font-bold text-slate-400 bg-white/60 px-2 py-1 rounded-md backdrop-blur-sm">
                              {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-800 leading-tight mb-2 pr-4">
                            {item.title}
                          </h4>
                          
                          {item.type === 'Parcel' && item.tracking_number && (
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {item.courier && (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-md border border-indigo-100">
                                  {item.courier}
                                </span>
                              )}
                              <span className="text-xs font-mono font-bold text-slate-500">
                                #{item.tracking_number}
                              </span>
                              {item.collected_at && (
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  ✓ Handed Over: {new Date(item.collected_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status:</span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              item.status === 'Approved' || item.status === 'Resolved' || item.status === 'Delivered' || item.status === 'Paid' || item.status === 'Collected'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                    <Clock className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-600">No History Found</p>
                    <p className="text-xs mt-1 text-slate-500">This student has a clean slate. No requests, passes, or complaints recorded.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
