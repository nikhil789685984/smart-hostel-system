import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  Users,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  CreditCard,
  Bed,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Building,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Zap,
  Scale,
  RefreshCw,
  FileText,
  Bell,
  BellRing,
  LogOut,
  UserCheck,
  DoorOpen,
  UserMinus
} from 'lucide-react';

import DigitalIDCard from '../../components/ui/DigitalIDCard';

const PAGE_SIZE = 15;

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [feeFilter, setFeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [checkingOutId, setCheckingOutId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentForId, setSelectedStudentForId] = useState(null);
  const [selectedStudentMasterRecord, setSelectedStudentMasterRecord] = useState(null);
  const [masterTab, setMasterTab] = useState('personal'); // 'personal' | 'parents' | 'address' | 'academic'
  const [editingStudent, setEditingStudent] = useState(null);
  const [updatingStudent, setUpdatingStudent] = useState(false);

  // Fines & Penalties State
  const [finesModalOpen, setFinesModalOpen] = useState(false);
  const [finesList, setFinesList] = useState([]);
  const [finesLoading, setFinesLoading] = useState(false);
  const [assessingFines, setAssessingFines] = useState(false);
  const [alertingAllFines, setAlertingAllFines] = useState(false);
  const [sendingFineAlertId, setSendingFineAlertId] = useState(null);
  const [fineFilterTab, setFineFilterTab] = useState('All');
  const [newFineData, setNewFineData] = useState({
    student_id: '',
    type: 'Curfew Violation',
    amount: '250',
    reason: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roll_number: '',
    phone: '',
    course: 'B.Tech',
    branch: 'Computer Science & Engineering',
    year: '1',
    semester: '1',
    password: 'student123',
    father_name: '',
    father_phone: '',
    father_occupation: '',
    mother_name: '',
    mother_phone: '',
    parent_email: '',
    dob: '2004-05-15',
    gender: 'Male',
    blood_group: 'B+',
    aadhar_number: '',
    address_line: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
    cgpa: '8.5',
    enrollment_number: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleUpdateStudentSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setUpdatingStudent(true);
    try {
      await api.updateStudent(editingStudent.id, editingStudent);
      setMsg(`Master profile record for ${editingStudent.name} updated successfully.`);
      setEditingStudent(null);
      fetchStudents();
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Error updating student profile');
    } finally {
      setUpdatingStudent(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.getAdminStudents({
        search,
        branch: branchFilter,
      });
      setStudents(res.students || []);
      setCurrentPage(1); // Reset to page 1 on new filter
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, branchFilter]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate and remove student ${name}?`)) return;
    try {
      await api.deleteStudent(id);
      setMsg(`Student ${name} removed from registry.`);
      setStudents(prev => prev.filter(s => s.id !== id));
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Error deleting student');
    }
  };

  const handleCheckout = async (studentId, studentName, roomNumber) => {
    const confirmMsg = roomNumber 
      ? `Process official hostel checkout for ${studentName}?\n\nThis will vacate Room ${roomNumber}, set bed status to vacant, and mark hostel status as "Checked Out".`
      : `Process official hostel checkout for ${studentName}?\n\nThis will mark hostel status as "Checked Out".`;
    
    if (!window.confirm(confirmMsg)) return;

    setCheckingOutId(studentId);
    try {
      const res = await api.checkoutStudent(studentId);
      setMsg(res.message || `Student ${studentName} checked out successfully.`);
      setTimeout(() => setMsg(null), 5000);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Error processing hostel checkout');
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleReactivate = async (studentId, studentName) => {
    if (!window.confirm(`Re-activate hostel resident status for ${studentName}?`)) return;
    try {
      const res = await api.reactivateStudent(studentId);
      setMsg(res.message || `Student ${studentName} restored to Active Resident.`);
      setTimeout(() => setMsg(null), 4000);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Error restoring student status');
    }
  };

  const fetchFines = async () => {
    setFinesLoading(true);
    try {
      const res = await api.getAllFines();
      if (res.success) {
        setFinesList(res.fines || []);
      }
    } catch (err) {
      console.error('Failed to load fines:', err);
    } finally {
      setFinesLoading(false);
    }
  };

  const handleAssessLateFines = async () => {
    setAssessingFines(true);
    try {
      const res = await api.assessLateFines();
      setMsg(`Late Fee Assessment Completed: ${res.assessedCount || 0} overdue accounts penalised (Total ₹${res.totalFinesAssessed || 0}).`);
      setTimeout(() => setMsg(null), 5000);
      fetchStudents();
      fetchFines();
    } catch (err) {
      alert(err.message || 'Failed to run late fine assessment');
    } finally {
      setAssessingFines(false);
    }
  };

  const handleWaiveFine = async (fineId, studentName, amount) => {
    if (!window.confirm(`Waive penalty of ₹${amount} for ${studentName}?`)) return;
    try {
      await api.waiveFine(fineId);
      setMsg(`Fine of ₹${amount} waived for ${studentName}. Notification dispatched.`);
      setTimeout(() => setMsg(null), 4000);
      fetchFines();
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to waive fine');
    }
  };

  const handleSendFineAlert = async (studentId, studentName) => {
    setSendingFineAlertId(studentId);
    try {
      const res = await api.sendFeeAlertToStudent(studentId);
      if (res.success) {
        setMsg(`Urgent payment alert dispatched to ${studentName}!`);
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to dispatch alert');
    } finally {
      setSendingFineAlertId(null);
    }
  };

  const handleAlertAllDefaulters = async () => {
    if (!window.confirm('Broadcast urgent payment alert to all students with pending fees / late fines?')) return;
    setAlertingAllFines(true);
    try {
      const res = await api.sendFeeAlertToDefaulters();
      if (res.success) {
        setMsg(res.message || `Alerts dispatched to ${res.count} students.`);
        setTimeout(() => setMsg(null), 5000);
      }
    } catch (err) {
      alert(err.message || 'Failed to broadcast alerts');
    } finally {
      setAlertingAllFines(false);
    }
  };

  const handleIssueFine = async (e) => {
    e.preventDefault();
    if (!newFineData.student_id || !newFineData.reason) {
      alert('Please select a student and enter reason');
      return;
    }
    try {
      await api.issueDisciplinaryFine(newFineData);
      setMsg(`Fine of ₹${newFineData.amount} issued successfully. Notification dispatched.`);
      setTimeout(() => setMsg(null), 4000);
      setNewFineData({ student_id: '', type: 'Curfew Violation', amount: '250', reason: '' });
      fetchFines();
    } catch (err) {
      alert(err.message || 'Failed to issue fine');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createStudent(formData);
      setMsg(`Student ${formData.name} enrolled with initial semester fee account.`);
      setModalOpen(false);
      setFormData({
        name: '',
        email: '',
        roll_number: '',
        phone: '',
        course: 'B.Tech',
        branch: 'Computer Science & Engineering',
        year: '1',
        semester: '1',
        password: 'student123',
      });
      fetchStudents();
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Error creating student');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter by fee status if chosen
  const filteredStudents = students.filter(s => {
    if (!feeFilter) return true;
    return s.fee_status === feeFilter;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const allocatedCount = students.filter(s => s.room_number).length;
  const paidCount = students.filter(s => s.fee_status === 'Paid').length;
  const partialCount = students.filter(s => s.fee_status === 'Partial').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-200 border border-rose-400/30 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-rose-400" />
              Central Campus Registrar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Student Resident Directory</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Global roster of <strong>{students.length}</strong> resident scholars, hostel bed allocations, and live financial clearing accounts.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={assessingFines}
            onClick={handleAssessLateFines}
            className="px-4 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-bold transition flex items-center gap-2 backdrop-blur-sm active:scale-95"
            title="Scan all student accounts and levy late fee fines for overdue deadlines"
          >
            <Zap className={`w-4 h-4 text-amber-400 ${assessingFines ? 'animate-spin' : ''}`} />
            <span>{assessingFines ? 'Assessing...' : 'Assess Late Fines'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              fetchFines();
              setFinesModalOpen(true);
            }}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition flex items-center gap-2 backdrop-blur-sm active:scale-95"
          >
            <Scale className="w-4 h-4 text-rose-300" />
            <span>Fines Ledger</span>
          </motion.button>

          <Link
            to="/warden/allocations"
            className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Bed className="w-4 h-4" /> Room & Bed Allocator Matrix
          </Link>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Enrol Student
          </motion.button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Enrolled Residents</span>
          <p className="text-xl font-black text-slate-900 mt-0.5">{students.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Beds Allocated</span>
          <p className="text-xl font-black text-blue-700 mt-0.5">{allocatedCount} <span className="text-xs text-slate-400 font-normal">/ {students.length}</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Fully Paid Dues</span>
          <p className="text-xl font-black text-emerald-600 mt-0.5">{paidCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Partial / Pending</span>
          <p className="text-xl font-black text-amber-600 mt-0.5">{partialCount + (students.length - paidCount - partialCount)}</p>
        </div>
      </div>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800 shadow-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </motion.div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Branch:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold"
            >
              <option value="">All Branches</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Information Technology">IT</option>
              <option value="Artificial Intelligence & Data Science">AI & DS</option>
              <option value="Electronics & Comm. Engg">ECE</option>
              <option value="Mechanical Engineering">ME</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Fees:</span>
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold"
            >
              <option value="">All Fee Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Hostel Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Residents</option>
              <option value="Checked Out">Checked Out</option>
            </select>
          </div>
        </div>

        <p className="text-slate-500 text-xs font-bold shrink-0">
          Showing <strong className="text-slate-900">{paginatedStudents.length}</strong> of <strong className="text-slate-900">{filteredStudents.length}</strong> records
        </p>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-4 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Querying 100+ student profiles...</span>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-sm">No student residents matching filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Student Resident</th>
                  <th className="py-3.5 px-6">Roll Number</th>
                  <th className="py-3.5 px-6">Academic Program</th>
                  <th className="py-3.5 px-6">Room Allotment</th>
                  <th className="py-3.5 px-6">Hostel Status</th>
                  <th className="py-3.5 px-6">Fee Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={s.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <p className="font-black text-slate-900 leading-tight">{s.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-black text-slate-800">{s.roll_number}</td>
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-slate-900 truncate max-w-[200px]">{s.branch}</p>
                      <span className="text-[10px] text-slate-400">Year {s.year} • Semester {s.semester}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      {s.room_number ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 inline-flex items-center gap-1 text-[11px]">
                            <Bed className="w-3 h-3 text-blue-600" />
                            {s.room_number} ({s.bed_number})
                          </span>
                          <Link
                            to="/warden/allocations"
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition text-[10px] font-bold"
                            title="Change Room / Reassign Bed"
                          >
                            Edit
                          </Link>
                        </div>
                      ) : (
                        <Link
                          to="/warden/allocations"
                          className="text-amber-800 font-bold text-[11px] bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300 inline-flex items-center gap-1 transition shadow-2xs"
                          title="Click to open Room & Bed Allocator Matrix"
                        >
                          <Plus className="w-3 h-3 text-amber-600" /> Assign Bed Now
                        </Link>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                          s.status === 'Checked Out'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {s.status === 'Checked Out' ? (
                          <>
                            <LogOut className="w-3 h-3 text-slate-500" />
                            Checked Out
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active Resident
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          s.fee_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : s.fee_status === 'Partial'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {s.fee_status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentMasterRecord(s)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                          title="View Complete Master Profile (Parents, Address, Aadhar, Academic Info)"
                        >
                          <span>👁️</span> Master Dossier
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingStudent({ ...s })}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Edit Student Information & Parent Contact Details"
                        >
                          <span>✏️</span> Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedStudentForId(s)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                          title="View Official Digital Hostel ID Card Pass"
                        >
                          <span>🪪</span> ID Pass
                        </button>
                        {s.status !== 'Checked Out' ? (

                          <button
                            type="button"
                            disabled={checkingOutId === s.id}
                            onClick={() => handleCheckout(s.id, s.name, s.room_number)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-black transition flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                            title="Checkout Student from Hostel & Vacate Bed"
                          >
                            {checkingOutId === s.id ? (
                              <span className="w-3 h-3 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
                            ) : (
                              <LogOut className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            <span>Hostel Checkout</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReactivate(s.id, s.name)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Re-activate Resident Status"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Re-Activate</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition ml-1"
                          title="Remove Student Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50">
            <span className="text-slate-500 font-semibold">
              Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> (15 per page)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  // Show current and near pages
                  if (pNum === 1 || pNum === totalPages || Math.abs(pNum - currentPage) <= 1) {
                    return (
                      <button
                        key={pNum}
                        onClick={() => setCurrentPage(pNum)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs transition ${
                          currentPage === pNum
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  } else if (pNum === 2 && currentPage > 3) {
                    return <span key="dots1" className="px-1 text-slate-400">...</span>;
                  } else if (pNum === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key="dots2" className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enrol Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enrol New Student Resident"
        subtitle="Registers student account and prepares room fee ledger"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Siddharth Rao"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Roll Number *</label>
              <input
                type="text"
                required
                value={formData.roll_number}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                placeholder="e.g. 22BCSE199"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Campus Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sid@hostel.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Default Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option>Computer Science & Engineering</option>
                <option>Information Technology</option>
                <option>Artificial Intelligence & Data Science</option>
                <option>Electronics & Comm. Engg</option>
                <option>Mechanical Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
                <option value="3">Sem 3</option>
                <option value="4">Sem 4</option>
                <option value="5">Sem 5</option>
                <option value="6">Sem 6</option>
                <option value="7">Sem 7</option>
                <option value="8">Sem 8</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow transition"
            >
              {submitting ? 'Enrolling...' : 'Enrol Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DISCIPLINARY & OVERDUE FINES GOVERNANCE MODAL */}
      <Modal
        isOpen={finesModalOpen}
        onClose={() => setFinesModalOpen(false)}
        title="Campus Disciplinary Fines & Overdue Penalties Ledger"
        subtitle="Review late fee assessments, waive penalties, or issue disciplinary citations"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          
          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Fines Logged</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{finesList.length}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Unpaid Outstanding</span>
              <p className="text-lg font-black text-rose-700 mt-0.5">
                {finesList.filter(f => f.status === 'Unpaid').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Settled / Paid</span>
              <p className="text-lg font-black text-emerald-700 mt-0.5">
                {finesList.filter(f => f.status === 'Paid').length}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Waived by Admin</span>
              <p className="text-lg font-black text-blue-700 mt-0.5">
                {finesList.filter(f => f.status === 'Waived').length}
              </p>
            </div>
          </div>

          {/* Broadcast Trigger Row */}
          <div className="flex items-center justify-between gap-3 bg-rose-50/60 p-3 rounded-2xl border border-rose-100">
            <div>
              <p className="text-xs font-black text-rose-950">Broadcast Overdue Notices</p>
              <p className="text-[11px] text-rose-700">Dispatch instant high-priority in-app alerts to all residents with pending fines & fees</p>
            </div>
            <button
              type="button"
              disabled={alertingAllFines}
              onClick={handleAlertAllDefaulters}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {alertingAllFines ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <BellRing className="w-3.5 h-3.5" />
              )}
              Alert All Defaulters
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-2 text-xs">
            {['All', 'Unpaid', 'Late Fee', 'Curfew Violation'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFineFilterTab(tab)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  fineFilterTab === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Fines Table */}
          <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden">
            {finesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                Querying campus disciplinary records...
              </div>
            ) : finesList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No fines or infractions recorded on campus.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Infraction / Reason</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4 text-right">Penalty</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {finesList
                    .filter(f => {
                      if (fineFilterTab === 'Unpaid') return f.status === 'Unpaid';
                      if (fineFilterTab === 'Late Fee') return f.type === 'Late Fee';
                      if (fineFilterTab === 'Curfew Violation') return f.type === 'Curfew Violation';
                      return true;
                    })
                    .map(fine => (
                      <tr key={fine.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <strong className="text-slate-900 block">{fine.student_name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {fine.roll_number} • {fine.room_number || 'Room TBD'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                          {fine.reason}
                          {fine.days_overdue > 0 && (
                            <span className="block text-[10px] text-rose-500 font-bold">
                              {fine.days_overdue} days past deadline
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            fine.type === 'Late Fee'
                              ? 'bg-rose-100 text-rose-800'
                              : fine.type === 'Curfew Violation'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {fine.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                          ₹{Number(fine.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            fine.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : fine.status === 'Waived'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}>
                            {fine.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {fine.status === 'Unpaid' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={sendingFineAlertId === fine.student_id}
                                onClick={() => handleSendFineAlert(fine.student_id, fine.student_name)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 transition flex items-center gap-1 disabled:opacity-50"
                              >
                                <Bell className="w-3 h-3 text-rose-600" />
                                {sendingFineAlertId === fine.student_id ? 'Sending...' : 'Send Alert'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWaiveFine(fine.id, fine.student_name, fine.amount)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-200 transition"
                              >
                                Waive Fine
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Issue Disciplinary Fine Form */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Levy New Disciplinary Citation to Resident
            </h4>
            <form onSubmit={handleIssueFine} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Student</label>
                <select
                  value={newFineData.student_id}
                  onChange={(e) => setNewFineData({ ...newFineData, student_id: e.target.value })}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                  required
                >
                  <option value="">Select Student...</option>
                  {students.slice(0, 50).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roll_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Infraction Type</label>
                <select
                  value={newFineData.type}
                  onChange={(e) => setNewFineData({ ...newFineData, type: e.target.value })}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="Curfew Violation">Curfew Violation</option>
                  <option value="Room Damage">Room Damage</option>
                  <option value="Noise Violation">Noise Violation</option>
                  <option value="Unauthorized Appliance">Unauthorized Appliance</option>
                  <option value="Disciplinary">General Disciplinary</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fine Amount (INR)</label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={newFineData.amount}
                  onChange={(e) => setNewFineData({ ...newFineData, amount: e.target.value })}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Reason / Citation</label>
                <input
                  type="text"
                  placeholder="e.g. Late turnstile return 23:15"
                  value={newFineData.reason}
                  onChange={(e) => setNewFineData({ ...newFineData, reason: e.target.value })}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                  required
                />
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" /> Issue Fine & Dispatch Alert
                </button>
              </div>
            </form>
          </div>

        </div>
      </Modal>

      {/* MASTER STUDENT PROFILE DOSSIER MODAL */}
      <Modal
        isOpen={Boolean(selectedStudentMasterRecord)}
        onClose={() => setSelectedStudentMasterRecord(null)}
        title={`📋 Master Dossier: ${selectedStudentMasterRecord?.name}`}
        subtitle={`Roll No: ${selectedStudentMasterRecord?.roll_number} | Comprehensive Resident Record`}
        maxWidth="max-w-3xl"
      >
        {selectedStudentMasterRecord && (
          <div className="space-y-5">
            {/* Top Student Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentMasterRecord.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt={selectedStudentMasterRecord.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400 shrink-0"
                />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">{selectedStudentMasterRecord.name}</h3>
                  <p className="text-xs text-indigo-200 font-bold">{selectedStudentMasterRecord.branch} • Year {selectedStudentMasterRecord.year}</p>
                  <p className="text-[10px] text-slate-300 font-mono mt-0.5">Roll: {selectedStudentMasterRecord.roll_number} | Enrolment: {selectedStudentMasterRecord.enrollment_number || 'EN2026CS9901'}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black uppercase">
                  {selectedStudentMasterRecord.status || 'Active Resident'}
                </span>
                <p className="text-[10px] font-mono text-indigo-300 mt-1">CGPA: {selectedStudentMasterRecord.cgpa || '8.5'}</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setMasterTab('personal')}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${masterTab === 'personal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                👤 Personal Details
              </button>
              <button
                onClick={() => setMasterTab('parents')}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${masterTab === 'parents' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                👨‍👩‍👧 Family & Parents
              </button>
              <button
                onClick={() => setMasterTab('address')}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${masterTab === 'address' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                🏡 Permanent Residence
              </button>
              <button
                onClick={() => setMasterTab('academic')}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${masterTab === 'academic' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                🎓 Academic & Stay
              </button>
            </div>

            {/* Tab 1: Personal Details */}
            {masterTab === 'personal' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Full Name</span>
                  <p className="font-black text-slate-900 mt-0.5">{selectedStudentMasterRecord.name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Roll Number</span>
                  <p className="font-black font-mono text-slate-900 mt-0.5">{selectedStudentMasterRecord.roll_number}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Enrolment Number</span>
                  <p className="font-black font-mono text-slate-900 mt-0.5">{selectedStudentMasterRecord.enrollment_number || 'EN2026CS9901'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedStudentMasterRecord.dob || '15 May 2004'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedStudentMasterRecord.gender || 'Male'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</span>
                  <p className="font-black text-rose-600 mt-0.5">{selectedStudentMasterRecord.blood_group || 'B+'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Aadhar UIDAI Number</span>
                  <p className="font-bold font-mono text-slate-900 mt-0.5">{selectedStudentMasterRecord.aadhar_number || '7712-4490-1823'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Student Mobile</span>
                  <p className="font-bold text-emerald-700 mt-0.5">{selectedStudentMasterRecord.phone || '+91 98765 00000'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Campus Email</span>
                  <p className="font-bold text-slate-900 truncate mt-0.5">{selectedStudentMasterRecord.email}</p>
                </div>
              </div>
            )}

            {/* Tab 2: Parents & Family */}
            {masterTab === 'parents' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Father's Full Name</span>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{selectedStudentMasterRecord.father_name || selectedStudentMasterRecord.parent_name || 'Ramesh Sharma'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Father's Mobile Phone</span>
                    <p className="font-black font-mono text-emerald-700 text-sm mt-0.5">{selectedStudentMasterRecord.father_phone || selectedStudentMasterRecord.parent_phone || '+91 98765 11111'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Father's Occupation</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedStudentMasterRecord.father_occupation || 'Senior Government Officer / Engineer'}</p>
                  </div>
                </div>

                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Mother's Full Name</span>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{selectedStudentMasterRecord.mother_name || 'Sunita Sharma'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Mother's Mobile Phone</span>
                    <p className="font-black font-mono text-cyan-700 text-sm mt-0.5">{selectedStudentMasterRecord.mother_phone || '+91 98765 22222'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Parent Email</span>
                    <p className="font-bold text-slate-800 truncate mt-0.5">{selectedStudentMasterRecord.parent_email || 'parents.guardians@gmail.com'}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Contact Hotline</span>
                  <p className="font-black font-mono text-rose-600 mt-0.5">{selectedStudentMasterRecord.emergency_contact || selectedStudentMasterRecord.father_phone || '+91 98765 11111'}</p>
                </div>
              </div>
            )}

            {/* Tab 3: Permanent Residence */}
            {masterTab === 'address' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Permanent Street Address</span>
                  <p className="font-black text-slate-900 text-sm leading-relaxed">{selectedStudentMasterRecord.address_line || 'Flat 402, Green Park Enclave, Main Road'}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">City</span>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{selectedStudentMasterRecord.city || 'New Delhi'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">State</span>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{selectedStudentMasterRecord.state || 'Delhi'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">PIN Code</span>
                    <p className="font-black font-mono text-slate-900 text-sm mt-0.5">{selectedStudentMasterRecord.pincode || '110016'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Academic & Hostel Stay */}
            {masterTab === 'academic' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Degree Program</span>
                  <p className="font-black text-slate-900 mt-0.5">{selectedStudentMasterRecord.course || 'B.Tech'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Department Branch</span>
                  <p className="font-black text-slate-900 mt-0.5">{selectedStudentMasterRecord.branch}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Academic CGPA</span>
                  <p className="font-black text-amber-600 mt-0.5">{selectedStudentMasterRecord.cgpa || '8.75'} / 10.0</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Hostel Block</span>
                  <p className="font-bold text-indigo-700 mt-0.5">{selectedStudentMasterRecord.block_name || 'Block B (Bhaskara)'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Allocated Room & Bed</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedStudentMasterRecord.room_number ? `Room ${selectedStudentMasterRecord.room_number} (${selectedStudentMasterRecord.bed_number || 'Bed A'})` : 'Unassigned'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Fee Status</span>
                  <p className="font-black text-emerald-600 mt-0.5">{selectedStudentMasterRecord.fee_status || 'Paid'}</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEditingStudent({ ...selectedStudentMasterRecord });
                  setSelectedStudentMasterRecord(null);
                }}
                className="px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition cursor-pointer"
              >
                ✏️ Edit Student Master Profile
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentMasterRecord(null)}
                className="px-5 py-2 text-xs font-black bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT STUDENT MASTER PROFILE MODAL */}
      <Modal
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        title={`✏️ Edit Master Record: ${editingStudent?.name}`}
        subtitle="Update parent contact details, permanent residence address, and academic info"
        maxWidth="max-w-3xl"
      >
        {editingStudent && (
          <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
            
            {/* Section 1: Basic & Contact */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">1. Student Contact & Academic</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Student Phone *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Campus Email *</label>
                  <input
                    type="email"
                    required
                    value={editingStudent.email || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Parent & Guardian Details */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider pb-1 border-b border-indigo-200">2. Parents & Family Guardian Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Father's Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.father_name || editingStudent.parent_name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, father_name: e.target.value, parent_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Father's Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.father_phone || editingStudent.parent_phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, father_phone: e.target.value, parent_phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Father's Occupation</label>
                  <input
                    type="text"
                    value={editingStudent.father_occupation || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, father_occupation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                    placeholder="e.g. Govt Officer / Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Mother's Full Name</label>
                  <input
                    type="text"
                    value={editingStudent.mother_name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, mother_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Mother's Mobile Phone</label>
                  <input
                    type="text"
                    value={editingStudent.mother_phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, mother_phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Parent Email</label>
                  <input
                    type="email"
                    value={editingStudent.parent_email || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parent_email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Permanent Residence */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">3. Permanent Residence Address</h4>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Street Address Line *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.address_line || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, address_line: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                  placeholder="House / Flat / Street address..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.city || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.state || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.pincode || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingStudent}
                className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition cursor-pointer"
              >
                {updatingStudent ? 'Saving Changes...' : 'Save Master Record'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {selectedStudentForId && (
        <DigitalIDCard
          student={selectedStudentForId}
          isOpen={Boolean(selectedStudentForId)}
          onClose={() => setSelectedStudentForId(null)}
        />
      )}

    </motion.div>
  );
}

