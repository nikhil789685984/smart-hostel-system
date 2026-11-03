import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldAlert,
  GraduationCap,
  RefreshCw,
  Eye,
  DollarSign,
  User,
  Calendar,
  Phone,
  Mail,
  Building,
  FileText,
  X,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const PAGE_SIZE = 20;

export default function FeeGovernance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'both' | 'sem_fee_only' | 'fine_only' | 'cleared'
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal for full student details
  const [detailStudent, setDetailStudent] = useState(null);

  const fetchDefaulters = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = {};
      if (activeFilter !== 'all') params.filter = activeFilter;
      if (selectedSemester !== 'All') params.semester = selectedSemester;
      if (searchQuery) params.search = searchQuery;

      const res = await api.getAIDefaulters(params);
      setData(res);
    } catch (err) {
      console.error('Error fetching fee defaulters:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchDefaulters();

    // 🔄 4s Real-Time Polling for live Fee Governance
    const interval = setInterval(() => {
      fetchDefaulters(true);
    }, 4000);

    const handleFocus = () => fetchDefaulters(true);
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchDefaulters(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let bc = null;
    try {
      bc = new BroadcastChannel('hostel_sync_channel');
      bc.onmessage = () => fetchDefaulters(true);
    } catch (e) {}

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (bc) bc.close();
    };
  }, [activeFilter, selectedSemester]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDefaulters();
  };

  const summary = data?.summary || {
    totalStudents: 0,
    totalUnpaidDemand: 0,
    totalUnpaidSemFee: 0,
    totalUnpaidFines: 0,
    bothDefaultersCount: 0,
    semFeeOnlyCount: 0,
    fineOnlyCount: 0,
    clearedCount: 0
  };

  const students = data?.students || [];

  // Pagination Math for Super-Fast Rendering
  const totalPages = Math.ceil(students.length / PAGE_SIZE) || 1;
  const paginatedStudents = students.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Fee & Fine Audit List
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Semester Base Fee vs. Penalty/Fine status per student (Ultra-Fast Paginated View).
          </p>
        </div>

        <button
          onClick={fetchDefaulters}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-bold text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Outstanding */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-black text-indigo-300 uppercase tracking-wider">Total Outstanding</p>
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black">₹{summary.totalUnpaidDemand.toLocaleString()}</p>
            <p className="text-xs text-indigo-200 font-medium mt-1">
              Base: ₹{summary.totalUnpaidSemFee.toLocaleString()} | Fines: ₹{summary.totalUnpaidFines.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Both Unpaid */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-rose-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-rose-500 uppercase tracking-wider">🚨 Both Unpaid</p>
              <p className="text-xs text-slate-400 font-medium">Sem Fee + Active Fines</p>
            </div>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-rose-600">{summary.bothDefaultersCount}</p>
          </div>
        </div>

        {/* Sem Fee Only */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-amber-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-amber-600 uppercase tracking-wider">🎓 Sem Fee Only</p>
              <p className="text-xs text-slate-400 font-medium">Fines are 100% clear</p>
            </div>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <GraduationCap className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-amber-600">{summary.semFeeOnlyCount}</p>
          </div>
        </div>

        {/* Fine Only */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-purple-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-purple-600 uppercase tracking-wider">⚠️ Fine Only</p>
              <p className="text-xs text-slate-400 font-medium">Sem Fee is fully paid</p>
            </div>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <ShieldAlert className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-purple-600">{summary.fineOnlyCount}</p>
          </div>
        </div>

      </div>

      {/* Control Toolbar & Filters */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({summary.totalStudents})
          </button>
          
          <button
            onClick={() => setActiveFilter('both')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'both'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            🚨 Both Unpaid ({summary.bothDefaultersCount})
          </button>

          <button
            onClick={() => setActiveFilter('sem_fee_only')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'sem_fee_only'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            🎓 Sem Fee Only ({summary.semFeeOnlyCount})
          </button>

          <button
            onClick={() => setActiveFilter('fine_only')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'fine_only'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            ⚠️ Fine Only ({summary.fineOnlyCount})
          </button>

          <button
            onClick={() => setActiveFilter('cleared')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'cleared'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            ✅ Cleared ({summary.clearedCount})
          </button>
        </div>

        {/* Right Controls: Semester & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Semester Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-black text-slate-400 uppercase">Sem:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name/roll..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

        </div>
      </div>

      {/* Student Audit List Table (Paginated) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="py-4 px-6">Student Info</th>
                <th className="py-4 px-4">Semester</th>
                <th className="py-4 px-4">Base Sem Fee</th>
                <th className="py-4 px-4">Unpaid Fines</th>
                <th className="py-4 px-4">Total Pending</th>
                <th className="py-4 px-4">Status Category</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-bold text-sm">
                    Loading student fee & fine list...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-bold text-sm">
                    No student records found matching this filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Student Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${
                          s.ai_classification === 'BOTH_DEFAULTER'
                            ? 'bg-rose-100 text-rose-700'
                            : s.ai_classification === 'SEM_FEE_ONLY'
                            ? 'bg-amber-100 text-amber-700'
                            : s.ai_classification === 'FINE_ONLY'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {s.student_name ? s.student_name.substring(0, 2).toUpperCase() : 'ST'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.student_name}</p>
                          <p className="text-xs text-slate-400 font-medium">
                            {s.roll_number} • {s.block_name} ({s.room_number})
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Semester */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        Sem {s.semester}
                      </span>
                    </td>

                    {/* Base Sem Fee Status */}
                    <td className="py-4 px-4">
                      {s.sem_fee_pending > 0 ? (
                        <div>
                          <p className="text-xs font-black text-rose-600">₹{s.sem_fee_pending.toLocaleString()} Unpaid</p>
                          <p className="text-[10px] text-slate-400 font-medium">Total: ₹{s.sem_fee_total.toLocaleString()}</p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                            <CheckCircle2 className="w-3 h-3" /> Paid ₹{s.sem_fee_total.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Unpaid Fines Status */}
                    <td className="py-4 px-4">
                      {s.fines_pending > 0 ? (
                        <div>
                          <p className="text-xs font-black text-purple-600">₹{s.fines_pending.toLocaleString()}</p>
                          <button
                            onClick={() => setDetailStudent(s)}
                            className="text-[10px] text-purple-700 underline font-bold hover:text-purple-900"
                          >
                            {s.fines_count} Fine(s) details
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">0 Fines (Cleared)</span>
                      )}
                    </td>

                    {/* Total Outstanding */}
                    <td className="py-4 px-4">
                      <p className={`text-sm font-black ${s.total_outstanding > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                        ₹{s.total_outstanding.toLocaleString()}
                      </p>
                    </td>

                    {/* Status Category */}
                    <td className="py-4 px-4">
                      {s.ai_classification === 'BOTH_DEFAULTER' && (
                        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Both Unpaid
                        </span>
                      )}
                      {s.ai_classification === 'SEM_FEE_ONLY' && (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> Sem Fee Only
                        </span>
                      )}
                      {s.ai_classification === 'FINE_ONLY' && (
                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Fine Only
                        </span>
                      )}
                      {s.ai_classification === 'CLEARED' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Cleared
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setDetailStudent(s)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition inline-flex items-center gap-1 text-xs font-bold border border-indigo-200"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Fast Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, students.length)} of {students.length} Students
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-black text-slate-800 px-3">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Student Details Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-base">
                  {detailStudent.student_name ? detailStudent.student_name.substring(0, 2).toUpperCase() : 'ST'}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{detailStudent.student_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Roll No: <span className="font-bold text-slate-800">{detailStudent.roll_number}</span> • {detailStudent.branch}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Contact & Room Info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Hostel Room</span>
                <span className="font-bold text-slate-800">{detailStudent.block_name} ({detailStudent.room_number})</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Semester</span>
                <span className="font-bold text-slate-800">Semester {detailStudent.semester}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone</span>
                <span className="font-bold text-slate-800">{detailStudent.student_phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Email</span>
                <span className="font-bold text-slate-800 truncate block">{detailStudent.student_email}</span>
              </div>
            </div>

            {/* Semester Base Fee Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-indigo-300 uppercase tracking-wider">Semester {detailStudent.semester} Base Fee</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  detailStudent.sem_fee_pending > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {detailStudent.sem_fee_pending > 0 ? 'Pending' : 'Fully Paid'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Total Fee</span>
                  <span className="font-black text-sm">₹{detailStudent.sem_fee_total.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Paid Amount</span>
                  <span className="font-black text-sm text-emerald-400">₹{detailStudent.sem_fee_paid.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Balance Due</span>
                  <span className="font-black text-sm text-rose-400">₹{detailStudent.sem_fee_pending.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Fines Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Itemized Fines & Penalties ({detailStudent.fines_count})
                </h4>
                <span className="text-xs font-black text-purple-700">
                  Total: ₹{detailStudent.fines_pending.toLocaleString()}
                </span>
              </div>

              {detailStudent.fine_details.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold text-center">
                  ✅ Zero unpaid fines on record for this student.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detailStudent.fine_details.map((fn, idx) => (
                    <div key={idx} className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                          {fn.type}
                        </span>
                        <p className="text-xs font-bold text-slate-800 mt-1">{fn.reason}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Issued: {fn.issued_date}</p>
                      </div>
                      <p className="text-sm font-black text-purple-700">₹{fn.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => {
                  setDetailStudent(null);
                  navigate('/admin/student-history');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <History className="w-4 h-4" /> Full Student Activity History
              </button>
              
              <button
                onClick={() => setDetailStudent(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
