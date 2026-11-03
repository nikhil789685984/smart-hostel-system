import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ChevronDown,
  Filter,
  Check,
  Building,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Zap,
  X,
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

// Draggable Pan/Slide Scroll Hook for Smooth Click & Drag
function useDraggableScroll() {
  const [node, setNode] = useState(null);

  useEffect(() => {
    if (!node) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let initialScrollLeft = 0;
    let initialScrollTop = 0;

    const onPointerDown = (e) => {
      // Primary mouse button or touch/pen
      if (e.button !== undefined && e.button !== 0) return;

      // Don't intercept clicks on interactive buttons, links, inputs, selects, dropdowns
      if (e.target.closest('button, input, select, textarea, a, [role="button"], label')) {
        return;
      }

      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      initialScrollLeft = node.scrollLeft;
      initialScrollTop = node.scrollTop;

      node.style.cursor = 'grabbing';
      node.style.userSelect = 'none';

      try {
        node.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    let rafId = null;

    const onPointerMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          node.scrollLeft = initialScrollLeft - dx * 1.5;
          node.scrollTop = initialScrollTop - dy * 1.5;
          rafId = null;
        });
      }
    };

    const onPointerUp = (e) => {
      if (!isDown) return;
      isDown = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      node.style.cursor = 'grab';
      node.style.removeProperty('user-select');

      try {
        if (node.hasPointerCapture(e.pointerId)) {
          node.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    };

    const onPointerCancel = () => {
      if (!isDown) return;
      isDown = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      node.style.cursor = 'grab';
      node.style.removeProperty('user-select');
    };

    const preventDrag = (e) => {
      e.preventDefault();
    };

    node.style.cursor = 'grab';
    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove, { passive: true });
    node.addEventListener('pointerup', onPointerUp);
    node.addEventListener('pointercancel', onPointerCancel);
    node.addEventListener('dragstart', preventDrag);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointercancel', onPointerCancel);
      node.removeEventListener('dragstart', preventDrag);
    };
  }, [node]);

  return setNode;
}

export default function ManageStudents() {
  const setStudentsTableRef = useDraggableScroll();
  const setFinesTableRef = useDraggableScroll();

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
  const [activeMenuId, setActiveMenuId] = useState(null);

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
    reason: '',
    customReason: ''
  });
  const [studentSearchForFine, setStudentSearchForFine] = useState('');
  const [showStudentDropdownFine, setShowStudentDropdownFine] = useState(false);
  const [removeModal, setRemoveModal] = useState({ isOpen: false, step: 1, student: null, typedName: '', c2: false, c3: false, c4: false, submitting: false });

  // 3-Step Confirmation Late Fine Modal State
  const [lateFineModal, setLateFineModal] = useState({
    isOpen: false,
    step: 1, // 1 | 2 | 3
    student: null, // null for bulk, student object for individual
    customAmount: '',
    customReason: '',
    confirmedStep2: false,
    submitting: false
  });

  const openLateFineModal = (studentObj = null) => {
    setLateFineModal({
      isOpen: true,
      step: 1,
      student: studentObj,
      customAmount: '',
      customReason: '',
      confirmedStep2: false,
      submitting: false
    });
  };

  const closeLateFineModal = () => {
    setLateFineModal((prev) => ({ ...prev, isOpen: false, step: 1, confirmedStep2: false }));
  };

  const executeRemoveStudent = async () => {
    if(removeModal.typedName !== removeModal.student.name) return alert("Name mismatch");
    setRemoveModal(prev => ({...prev, submitting: true}));
    try {
      await api.removeStudent(removeModal.student.id);
      alert("Student permanently removed from the system.");
      setRemoveModal({ isOpen: false, step: 1, student: null, typedName: '', c2: false, c3: false, c4: false, submitting: false });
      fetchData();
    } catch(err) {
      alert(err.message);
      setRemoveModal(prev => ({...prev, submitting: false}));
    }
  };

  const handleExecuteLateFineLevy = async () => {
    setLateFineModal((prev) => ({ ...prev, submitting: true }));
    try {
      if (lateFineModal.student) {
        const res = await api.assessIndividualLateFine(lateFineModal.student.id, {
          customFineAmount: lateFineModal.customAmount,
          customReason: lateFineModal.customReason
        });
        setMsg(`⚡ ${res.message || 'Late fine levied directly on fee balance.'}`);
      } else {
        const res = await api.assessLateFines();
        setMsg(`⚡ Late Fee Assessment Completed: ${res.assessedCount || 0} overdue accounts penalised (Total ₹${res.totalFinesAssessed || 0}).`);
      }
      setTimeout(() => setMsg(null), 6000);
      closeLateFineModal();
      fetchStudents();
      fetchFines();
    } catch (err) {
      alert(err.message || 'Failed to apply late fine.');
      setLateFineModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 3-Step Confirmation Alert / Warning Modal State
  const [alertWarningModal, setAlertWarningModal] = useState({
    isOpen: false,
    step: 1, // 1 | 2 | 3
    student: null, // null for bulk broadcast, student object for individual
    customMessage: '',
    confirmedStep2: false,
    submitting: false
  });

  const openAlertWarningModal = (studentObj = null) => {
    setAlertWarningModal({
      isOpen: true,
      step: 1,
      student: studentObj,
      customMessage: '',
      confirmedStep2: false,
      submitting: false
    });
  };

  const closeAlertWarningModal = () => {
    setAlertWarningModal((prev) => ({ ...prev, isOpen: false, step: 1, confirmedStep2: false }));
  };

  const handleExecuteAlertWarningDispatch = async () => {
    setAlertWarningModal((prev) => ({ ...prev, submitting: true }));
    try {
      if (alertWarningModal.student) {
        const targetId = alertWarningModal.student.id || alertWarningModal.student.student_id;
        const targetName = alertWarningModal.student.name || alertWarningModal.student.student_name;
        const res = await api.sendFeeAlertToStudent(targetId, {
          customMessage: alertWarningModal.customMessage
        });
        setMsg(`🚨 ${res.message || `Urgent payment warning alert dispatched to ${targetName}!`}`);
      } else {
        const res = await api.sendFeeAlertToDefaulters();
        setMsg(`🚨 ${res.message || `Urgent payment warnings dispatched to ${res.count || 0} defaulters!`}`);
      }
      setTimeout(() => setMsg(null), 6000);
      closeAlertWarningModal();
    } catch (err) {
      alert(err.message || 'Failed to dispatch warning alert.');
      setAlertWarningModal((prev) => ({ ...prev, submitting: false }));
    }
  };
  
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

  const fetchStudents = async (silent = false) => {
    try {
      const res = await api.getAdminStudents({
        search,
        branch: branchFilter,
      });
      setStudents(res.students || []);
      if (!silent) setCurrentPage(1); // Reset to page 1 on new manual filter
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    // 🔄 5s Real-Time Polling for live student ERP changes
    const interval = setInterval(() => {
      fetchStudents(true);
    }, 5000);

    const handleFocus = () => fetchStudents(true);
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchStudents(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let bc = null;
    try {
      bc = new BroadcastChannel('hostel_sync_channel');
      bc.onmessage = () => fetchStudents(true);
    } catch (e) {}

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (bc) bc.close();
    };
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

  const handleSendFineAlert = (studentId, studentName) => {
    openAlertWarningModal({ id: studentId, name: studentName });
  };

  const handleAlertAllDefaulters = () => {
    openAlertWarningModal(null);
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

        <div className="relative z-10 flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
          {/* Financial & Penalty Controls Segmented Group */}
          <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/15 backdrop-blur-md">
            <button
              type="button"
              onClick={() => openLateFineModal(null)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              title="Scan all student accounts and levy late fee fines with 3-step confirmation"
            >
              <Zap className="w-3.5 h-3.5 fill-white animate-pulse" />
              <span>Assess Fines</span>
            </button>

            <button
              type="button"
              onClick={() => openAlertWarningModal(null)}
              className="px-3 py-2 text-amber-200 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Broadcast urgent fee clearance warning alerts to all defaulters with 3-step confirmation"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Alert Defaulters</span>
            </button>

            <button
              type="button"
              onClick={() => {
                fetchFines();
                setFinesModalOpen(true);
              }}
              className="px-3 py-2 text-rose-200 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="View campus fines ledger and infractions history"
            >
              <Scale className="w-3.5 h-3.5 text-rose-300" />
              <span>Ledger</span>
            </button>
          </div>

          {/* Core Operations Controls */}
          <Link
            to="/warden/allocations"
            className="px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 shrink-0 active:scale-95 border border-indigo-400/30"
          >
            <Bed className="w-3.5 h-3.5" /> Bed Matrix
          </Link>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 transition flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Enrol Resident
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
          <div>
            <div 
              ref={setStudentsTableRef}
              className="overflow-x-auto pb-56 min-h-[50vh] cursor-grab active:cursor-grabbing select-none custom-scrollbar"
            >
              <table className="w-full text-left text-xs min-w-[1550px]">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="py-3.5 px-6 min-w-[260px] whitespace-nowrap">Student Resident</th>
                    <th className="py-3.5 px-6 min-w-[140px] whitespace-nowrap">Roll Number</th>
                    <th className="py-3.5 px-6 min-w-[220px]">Academic Program</th>
                    <th className="py-3.5 px-6 min-w-[180px] whitespace-nowrap">Room Allotment</th>
                    <th className="py-3.5 px-6 min-w-[240px]">Care Taker / Warden</th>
                    <th className="py-3.5 px-6 min-w-[140px] whitespace-nowrap">Hostel Status</th>
                    <th className="py-3.5 px-6 min-w-[130px] whitespace-nowrap">Fee Status</th>
                    <th className="py-3.5 px-6 text-right min-w-[320px] whitespace-nowrap sticky right-0 bg-slate-50/95 backdrop-blur-sm shadow-l z-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-6 min-w-[260px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={s.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                          />
                          <div>
                            <p className="font-black text-slate-900 leading-tight whitespace-nowrap">{s.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">{s.email}</p>
                          </div>
                        </div>
                      </td>
                    <td className="py-3.5 px-6 font-mono font-black text-slate-800 whitespace-nowrap">{s.roll_number}</td>
                    <td className="py-3.5 px-6 min-w-[220px]">
                      <p className="font-bold text-slate-900 whitespace-nowrap">{s.branch}</p>
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100 inline-flex items-center gap-1 text-[11px]">
                          <span>🛡️</span> {s.caretaker_name || 'Staff Not Assigned'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[160px]">{s.caretaker_dept || 'Hostel Caretaker'} {s.caretaker_staff_id ? `(${s.caretaker_staff_id})` : ''}</span>
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
                    <td className="py-3.5 px-6 text-right min-w-[320px] whitespace-nowrap sticky right-0 bg-white/95 backdrop-blur-sm shadow-l z-10">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Primary View Action 1 */}
                        <button
                          type="button"
                          onClick={() => setSelectedStudentMasterRecord(s)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                          title="View Complete Master Profile (Parents, Address, Aadhar, Academic Info)"
                        >
                          <span>👁️</span> Master Dossier
                        </button>

                        {/* Primary View Action 2 */}
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForId(s)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                          title="View Official Digital Hostel ID Card Pass"
                        >
                          <span>🪪</span> ID Pass
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemoveModal({ isOpen: true, step: 1, student: s, typedName: '', c2: false, c3: false, c4: false, submitting: false });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                          title="Permanently Remove Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>

                        {/* Streamlined Dropdown Menu for Financial, Alert & Admin Actions */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
                              activeMenuId === s.id
                                ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            }`}
                            title="Open Resident Management & Financial Control Actions"
                          >
                            <span>⚡ Actions</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${activeMenuId === s.id ? 'rotate-180' : ''}`} />
                          </button>

                          {activeMenuId === s.id && (
                            <>
                              {/* Backdrop overlay to close dropdown on click outside */}
                              <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />

                              {/* Floating Dropdown Card */}
                              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 space-y-1 text-left">
                                <div className="px-2.5 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                  Financial & Penalisation (3-Step)
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    openLateFineModal(s);
                                  }}
                                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-amber-50 text-amber-900 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                                >
                                  <Zap className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                                  <span>⚡ Levy Late Fine (3-Step)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    openAlertWarningModal(s);
                                  }}
                                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-rose-50 text-rose-900 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                                >
                                  <Bell className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>🚨 Send Warning (3-Step)</span>
                                </button>

                                <div className="my-1 border-t border-slate-100" />
                                <div className="px-2.5 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                  Resident Management
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setEditingStudent({ ...s });
                                  }}
                                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="text-sm">✏️</span>
                                  <span>Edit Resident Record</span>
                                </button>

                                {s.status !== 'Checked Out' ? (
                                  <button
                                    type="button"
                                    disabled={checkingOutId === s.id}
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleCheckout(s.id, s.name, s.room_number);
                                    }}
                                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-rose-50 text-rose-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                  >
                                    <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span>Hostel Checkout / Vacate</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleReactivate(s.id, s.name);
                                    }}
                                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                                  >
                                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Re-Activate Resident</span>
                                  </button>
                                )}

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDelete(s.id, s.name);
                                  }}
                                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-red-50 text-red-600 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                                  <span>Remove Student Record</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        maxWidth="max-w-7xl"
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

          {/* Slide Navigation Strip for Fines Ledger */}
          {/* Fines Table */}
          <div 
            ref={setFinesTableRef}
            className="max-h-[480px] overflow-auto border border-slate-200 rounded-2xl custom-scrollbar cursor-grab active:cursor-grabbing select-none"
          >
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
              <table className="w-full text-left text-xs min-w-[1300px]">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 min-w-[240px] whitespace-nowrap">Student Resident</th>
                    <th className="py-3 px-4 min-w-[280px]">Infraction / Reason</th>
                    <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Violation Type</th>
                    <th className="py-3 px-4 min-w-[120px] whitespace-nowrap text-right">Penalty</th>
                    <th className="py-3 px-4 min-w-[120px] whitespace-nowrap text-center">Ledger Status</th>
                    <th className="py-3 px-4 min-w-[240px] whitespace-nowrap text-right sticky right-0 bg-slate-50/95 backdrop-blur-sm shadow-l">Action</th>
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
                        <td className="py-3.5 px-4 min-w-[240px]">
                          <strong className="text-slate-900 block font-black text-xs whitespace-nowrap">{fine.student_name}</strong>
                          <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                            {fine.roll_number} • {fine.room_number || 'Room TBD'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 min-w-[280px] text-slate-700">
                          <span className="font-semibold text-xs leading-relaxed block">{fine.reason}</span>
                          {fine.days_overdue > 0 && (
                            <span className="inline-block text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 mt-1">
                              ⚠️ {fine.days_overdue} days past deadline
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 min-w-[140px] whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            fine.type === 'Late Fee'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : fine.type === 'Curfew Violation'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}>
                            {fine.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 min-w-[120px] whitespace-nowrap text-right font-mono font-black text-rose-600 text-sm">
                          ₹{Number(fine.amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 min-w-[120px] whitespace-nowrap text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            fine.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : fine.status === 'Waived'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                          }`}>
                            {fine.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 min-w-[240px] whitespace-nowrap text-right sticky right-0 bg-white/95 backdrop-blur-sm shadow-l">
                          {fine.status === 'Unpaid' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={sendingFineAlertId === fine.student_id}
                                onClick={() => handleSendFineAlert(fine.student_id, fine.student_name)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-bold border border-rose-200 transition flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-2xs"
                              >
                                <Bell className="w-3 h-3 text-rose-600" />
                                {sendingFineAlertId === fine.student_id ? 'Sending...' : 'Send Alert'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWaiveFine(fine.id, fine.student_name, fine.amount)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                title="Waive penalty fine immediately for this resident"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                Waive Fine
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 italic">
                              {fine.status === 'Waived' ? '✓ Fine Waived' : '✓ Fine Settled'}
                            </span>
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
              <div className="relative">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or roll no..."
                    value={studentSearchForFine}
                    onFocus={() => setShowStudentDropdownFine(true)}
                    onChange={(e) => {
                      setStudentSearchForFine(e.target.value);
                      setShowStudentDropdownFine(true);
                      if(newFineData.student_id) setNewFineData({ ...newFineData, student_id: '' });
                    }}
                    className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                    required={!newFineData.student_id}
                  />
                  {newFineData.student_id && (
                    <button type="button" onClick={() => { setNewFineData({ ...newFineData, student_id: '' }); setStudentSearchForFine(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {showStudentDropdownFine && !newFineData.student_id && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {students.filter(s => s.name.toLowerCase().includes(studentSearchForFine.toLowerCase()) || s.roll_number.toLowerCase().includes(studentSearchForFine.toLowerCase())).map(s => (
                      <div key={s.id} onClick={() => { setNewFineData({ ...newFineData, student_id: s.id }); setStudentSearchForFine(`${s.name} (${s.roll_number})`); setShowStudentDropdownFine(false); }} className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 text-xs">
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-500">{s.roll_number} • Room {s.room_number}</p>
                      </div>
                    ))}
                  </div>
                )}
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
                  <option value="Custom Reason">Custom Reason...</option>
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
                  placeholder={newFineData.type === 'Custom Reason' ? "Type custom reason here..." : "e.g. Details of violation"}
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

      {/* 3-STEP LATE FINE CONFIRMATION MODAL */}
      <Modal
        isOpen={lateFineModal.isOpen}
        onClose={closeLateFineModal}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
              <Zap className="w-4 h-4 fill-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {lateFineModal.student
                  ? `Direct Late Fine Levy • ${lateFineModal.student.name}`
                  : 'Campus-Wide Automatic Late Fine Assessment'}
              </h3>
              <p className="text-[11px] font-bold text-rose-600">
                Step {lateFineModal.step} of 3 Confirmation Safeguard
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between gap-2 bg-slate-100 p-1.5 rounded-2xl text-[11px] font-black">
            <div className={`flex-1 text-center py-1.5 rounded-xl transition ${lateFineModal.step === 1 ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'}`}>
              1. Calculation & Target
            </div>
            <div className={`flex-1 text-center py-1.5 rounded-xl transition ${lateFineModal.step === 2 ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'}`}>
              2. Risk & Impact
            </div>
            <div className={`flex-1 text-center py-1.5 rounded-xl transition ${lateFineModal.step === 3 ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'}`}>
              3. Final Authorization
            </div>
          </div>

          {/* STEP 1: Breakdown & Target Info */}
          {lateFineModal.step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Step 1/3: Confirm Target & Fine Breakdown</span>
                </div>
                <p className="text-amber-800 leading-relaxed font-medium">
                  You are preparing to levy an automatic late fee penalty. This fine will be added <strong>DIRECTLY to the student's total unpaid fee balance</strong>.
                </p>
              </div>

              {lateFineModal.student ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold text-xs">Target Resident:</span>
                    <span className="font-black text-slate-900">{lateFineModal.student.name} ({lateFineModal.student.roll_number})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold text-xs">Hostel & Room:</span>
                    <span className="font-bold text-slate-800">{lateFineModal.student.block_name || 'Block B'} • Room {lateFineModal.student.room_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold text-xs">Current Fee Status:</span>
                    <span className="font-black text-rose-700">{lateFineModal.student.fee_status || 'Pending'}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Fine Amount (₹) <span className="text-slate-400 font-normal">(Default ₹100/day overdue or custom)</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Leave empty for auto ₹100/day rate"
                        value={lateFineModal.customAmount}
                        onChange={(e) => setLateFineModal((prev) => ({ ...prev, customAmount: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Reason / Remarks</label>
                      <input
                        type="text"
                        placeholder="Overdue semester fee deadline penalty"
                        value={lateFineModal.customReason}
                        onChange={(e) => setLateFineModal((prev) => ({ ...prev, customReason: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Scope:</span>
                    <span className="font-black text-slate-900">All Overdue Student Accounts Across Campus</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Penalisation Rate:</span>
                    <span className="font-black text-rose-600">₹100 Per Day Overdue</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    This will automatically scan all student fee records past due date and add corresponding daily late fines directly to their outstanding balances.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeLateFineModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setLateFineModal((prev) => ({ ...prev, step: 2 }))}
                  className="px-5 py-2.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Proceed to Step 2: Risk Analysis</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Risk & Impact Analysis */}
          {lateFineModal.step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-3">
                <div className="flex items-center gap-2 text-rose-950 font-black text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Step 2/3: High Risk & Financial Ledger Warning</span>
                </div>
                <div className="space-y-1.5 text-rose-900 font-medium leading-relaxed">
                  <p>• <strong>Direct Fee Balance Addition:</strong> The calculated fine will be immediately added to student's live fee account balance.</p>
                  <p>• <strong>Automated Alerts:</strong> Real-time alerts will be dispatched to the student's portal app and parent email.</p>
                  <p>• <strong>Irreversible Levy:</strong> This action alters financial records. Waiver requires manual administrative intervention.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lateFineModal.confirmedStep2}
                  onChange={(e) => setLateFineModal((prev) => ({ ...prev, confirmedStep2: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 accent-rose-600 rounded cursor-pointer shrink-0"
                />
                <span className="font-bold text-slate-800 leading-snug">
                  I confirm that I have verified the overdue fee records and accept official administrative authority to update student fee balances directly.
                </span>
              </label>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setLateFineModal((prev) => ({ ...prev, step: 1 }))}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Step 1</span>
                </button>
                <button
                  type="button"
                  disabled={!lateFineModal.confirmedStep2}
                  onClick={() => setLateFineModal((prev) => ({ ...prev, step: 3 }))}
                  className="px-5 py-2.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>Proceed to Final Step 3</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Final Authorization & Execution */}
          {lateFineModal.step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-black text-slate-900 text-sm">Final Verification Complete</h4>
                <p className="text-emerald-800 font-medium">
                  {lateFineModal.student
                    ? `Ready to levy fine directly on ${lateFineModal.student.name}'s fee account.`
                    : 'Ready to execute campus-wide automatic late fine assessment across all overdue accounts.'}
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center gap-3">
                <button
                  type="button"
                  disabled={lateFineModal.submitting}
                  onClick={() => setLateFineModal((prev) => ({ ...prev, step: 2 }))}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={lateFineModal.submitting}
                  onClick={handleExecuteLateFineLevy}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {lateFineModal.submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Database & Dispatched Alerts...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>⚡ CONFIRM & LEVY FINE DIRECTLY TO STUDENT FEES NOW</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 3-STEP ALERT & WARNING CONFIRMATION MODAL */}
      <Modal
        isOpen={alertWarningModal.isOpen}
        onClose={closeAlertWarningModal}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {alertWarningModal.student
                  ? `Payment Warning Dispatch • ${alertWarningModal.student.name || alertWarningModal.student.student_name}`
                  : 'Broadcast Campus Fee Defaulter Warnings'}
              </h3>
              <p className="text-[11px] font-bold text-amber-600">
                Step {alertWarningModal.step} of 3 Confirmation Safeguard
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          {/* Progress Bar */}
          <div className="flex items-center justify-between gap-2 bg-slate-100 p-1.5 rounded-2xl text-[11px] font-black">
            <div className={`flex-1 text-center py-1.5 rounded-xl transition ${alertWarningModal.step === 1 ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'}`}>
              1. Alert Scope & Text
            </div>
            <div className={`flex-1 text-center py-1.5 rounded-xl transition ${alertWarningModal.step === 2 ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'}`}>
              2. Warning Impact Risk
            </div>
            <div className={`flex-1 text-center py-1.5 rounded-xl transition ${alertWarningModal.step === 3 ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'}`}>
              3. Final Authorization
            </div>
          </div>

          {/* STEP 1: Message Customization & Scope */}
          {alertWarningModal.step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Step 1/3: Alert Target & Custom Warning Message</span>
                </div>
                <p className="text-amber-800 leading-relaxed font-medium">
                  Configure the warning notice that will be pushed to the student's mobile portal, notification center, and parent contact.
                </p>
              </div>

              {alertWarningModal.student ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Recipient Resident:</span>
                    <span className="font-black text-slate-900">{alertWarningModal.student.name || alertWarningModal.student.student_name}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Custom Warning Notice Message (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Leave blank for standard urgent fee & fine notice..."
                      value={alertWarningModal.customMessage}
                      onChange={(e) => setAlertWarningModal((prev) => ({ ...prev, customMessage: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Broadcast Scope:</span>
                    <span className="font-black text-rose-700">All Defaulters with Unpaid Fees or Active Overdue Fines</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    This will send real-time urgent fee clearance notifications to every student account across all hostels that has overdue dues past deadline.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAlertWarningModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setAlertWarningModal((prev) => ({ ...prev, step: 2 }))}
                  className="px-5 py-2.5 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Proceed to Step 2: Risk Impact</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Risk & Impact Analysis */}
          {alertWarningModal.step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Step 2/3: Warning Notification Impact Acknowledgment</span>
                </div>
                <div className="space-y-1.5 text-amber-900 font-medium leading-relaxed">
                  <p>• <strong>Instant Portal Push:</strong> Student's dashboard app will display a prominent warning banner demanding immediate fee settlement.</p>
                  <p>• <strong>Parent Contact Log:</strong> Official notice timestamp will be logged on the student's central master profile.</p>
                  <p>• <strong>Campus Turnstile Policy:</strong> Non-payment after warning may result in facility lock and gate pass restriction.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alertWarningModal.confirmedStep2}
                  onChange={(e) => setAlertWarningModal((prev) => ({ ...prev, confirmedStep2: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="font-bold text-slate-800 leading-snug">
                  I confirm that I have reviewed the defaulters list and authorize sending an official urgent payment warning notice to the target student(s).
                </span>
              </label>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setAlertWarningModal((prev) => ({ ...prev, step: 1 }))}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Step 1</span>
                </button>
                <button
                  type="button"
                  disabled={!alertWarningModal.confirmedStep2}
                  onClick={() => setAlertWarningModal((prev) => ({ ...prev, step: 3 }))}
                  className="px-5 py-2.5 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>Proceed to Final Step 3</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Final Authorization & Dispatch */}
          {alertWarningModal.step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-black text-slate-900 text-sm">Final Warning Authorization Confirmed</h4>
                <p className="text-emerald-800 font-medium">
                  {alertWarningModal.student
                    ? `Ready to dispatch urgent warning alert to ${alertWarningModal.student.name || alertWarningModal.student.student_name}.`
                    : 'Ready to broadcast urgent fee clearance warnings to all campus fee defaulters.'}
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center gap-3">
                <button
                  type="button"
                  disabled={alertWarningModal.submitting}
                  onClick={() => setAlertWarningModal((prev) => ({ ...prev, step: 2 }))}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={alertWarningModal.submitting}
                  onClick={handleExecuteAlertWarningDispatch}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-black shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {alertWarningModal.submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Broadcasting Payment Alerts...</span>
                    </>
                  ) : (
                    <>
                      <BellRing className="w-4 h-4 text-white" />
                      <span>🚨 CONFIRM & BROADCAST URGENT FEE ALERT / WARNING NOW</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {selectedStudentForId && (
        <DigitalIDCard
          student={selectedStudentForId}
          isOpen={Boolean(selectedStudentForId)}
          onClose={() => setSelectedStudentForId(null)}
        />
      )}

    
      {/* 5-Step Verification Modal for Permanent Removal */}
      <Modal isOpen={removeModal.isOpen} onClose={() => setRemoveModal({ isOpen: false, step: 1, student: null, typedName: '', c2: false, c3: false, c4: false, submitting: false })} title="PERMANENT EVICTION & ACCOUNT DELETION">
        {removeModal.student && (
          <div className="p-2 space-y-6">
            
            {/* Progress Tracker */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-100 pb-4">
              <div className={`${removeModal.step >= 1 ? 'text-rose-600' : ''}`}>1. Target</div>
              <div className={`${removeModal.step >= 2 ? 'text-rose-600' : ''}`}>2. Consent</div>
              <div className={`${removeModal.step >= 3 ? 'text-rose-600' : ''}`}>3. Finance</div>
              <div className={`${removeModal.step >= 4 ? 'text-rose-600' : ''}`}>4. Verify</div>
              <div className={`${removeModal.step >= 5 ? 'text-rose-600' : ''}`}>5. Execute</div>
            </div>

            {removeModal.step === 1 && (
              <div className="text-center space-y-4 py-4">
                <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto animate-pulse" />
                <h3 className="text-xl font-black text-rose-700">DANGER ZONE</h3>
                <p className="text-slate-600 text-sm">
                  You are initiating the permanent removal process for:<br/>
                  <span className="font-black text-slate-900 block mt-2 text-lg">{removeModal.student.name} ({removeModal.student.roll_number})</span>
                </p>
                <button onClick={() => setRemoveModal(p => ({...p, step: 2}))} className="mt-4 w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-lg transition">I understand, proceed to Step 2</button>
              </div>
            )}

            {removeModal.step === 2 && (
              <div className="space-y-4 py-4">
                <h3 className="font-black text-slate-800 text-lg">Acknowledge Consequences</h3>
                <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                  <li>This action is <b>irreversible</b>.</li>
                  <li>Student's hostel bed will be immediately marked as <b>Vacant</b>.</li>
                  <li>All gate passes, mess QR codes, and login access will be <b>revoked</b>.</li>
                </ul>
                <label className="flex items-start gap-3 mt-4 p-3 bg-rose-50 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={removeModal.c2} onChange={(e) => setRemoveModal(p => ({...p, c2: e.target.checked}))} className="mt-1" />
                  <span className="text-xs font-bold text-rose-900">I acknowledge that this action cannot be undone and will revoke all access for {removeModal.student.name}.</span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setRemoveModal(p => ({...p, step: 1}))} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Back</button>
                  <button onClick={() => setRemoveModal(p => ({...p, step: 3}))} disabled={!removeModal.c2} className="flex-1 py-3 bg-rose-600 text-white disabled:opacity-50 font-bold rounded-xl transition">Proceed to Step 3</button>
                </div>
              </div>
            )}

            {removeModal.step === 3 && (
              <div className="space-y-4 py-4">
                <h3 className="font-black text-slate-800 text-lg">Financial Clearance Override</h3>
                <p className="text-sm text-slate-600">Please confirm that all outstanding fees and fines have been settled, or that you have authorization to override financial locks.</p>
                <label className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={removeModal.c3} onChange={(e) => setRemoveModal(p => ({...p, c3: e.target.checked}))} className="mt-1" />
                  <span className="text-xs font-bold text-rose-900">I authorize the financial clearance override for this eviction.</span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setRemoveModal(p => ({...p, step: 2}))} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Back</button>
                  <button onClick={() => setRemoveModal(p => ({...p, step: 4}))} disabled={!removeModal.c3} className="flex-1 py-3 bg-rose-600 text-white disabled:opacity-50 font-bold rounded-xl transition">Proceed to Step 4</button>
                </div>
              </div>
            )}

            {removeModal.step === 4 && (
              <div className="space-y-4 py-4">
                <h3 className="font-black text-slate-800 text-lg">Warden/Admin Signature</h3>
                <p className="text-sm text-slate-600">As the authorizing admin, you are taking full responsibility for this eviction.</p>
                <label className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={removeModal.c4} onChange={(e) => setRemoveModal(p => ({...p, c4: e.target.checked}))} className="mt-1" />
                  <span className="text-xs font-bold text-rose-900">I digitally sign and authorize this permanent removal.</span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setRemoveModal(p => ({...p, step: 3}))} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Back</button>
                  <button onClick={() => setRemoveModal(p => ({...p, step: 5}))} disabled={!removeModal.c4} className="flex-1 py-3 bg-rose-600 text-white disabled:opacity-50 font-bold rounded-xl transition">Proceed to Final Step</button>
                </div>
              </div>
            )}

            {removeModal.step === 5 && (
              <div className="space-y-4 py-4">
                <h3 className="font-black text-rose-700 text-lg">Final Execution</h3>
                <p className="text-sm text-slate-600">To prevent accidental deletion, please type the student's full name exactly as shown below:</p>
                <div className="p-3 bg-slate-100 rounded-lg text-center font-mono font-black text-lg select-none">
                  {removeModal.student.name}
                </div>
                <input 
                  type="text"
                  placeholder="Type name here..."
                  value={removeModal.typedName}
                  onChange={(e) => setRemoveModal(p => ({...p, typedName: e.target.value}))}
                  className="w-full p-3 border-2 border-rose-200 rounded-xl font-bold text-center focus:border-rose-500 outline-none"
                />
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setRemoveModal(p => ({...p, step: 4}))} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Back</button>
                  <button 
                    onClick={executeRemoveStudent} 
                    disabled={removeModal.typedName !== removeModal.student.name || removeModal.submitting}
                    className="flex-1 py-3 bg-black text-white disabled:opacity-50 font-black rounded-xl transition flex justify-center items-center gap-2"
                  >
                    {removeModal.submitting ? 'TERMINATING...' : 'PERMANENTLY EVICT'}
                  </button>
                </div>
              </div>
            )}

          
      {/* History Drawer */}
      <AnimatePresence>
        {selectedHistoryStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHistoryStudent(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-50 shadow-2xl z-[101] flex flex-col border-l border-slate-200"
            >
              {/* Header */}
              <div className="bg-white p-6 border-b border-slate-200 flex items-center justify-between shadow-sm z-10 relative">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Student History
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">{selectedHistoryStudent.name} • {selectedHistoryStudent.roll_number}</p>
                </div>
                <button onClick={() => setSelectedHistoryStudent(null)} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Timeline Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="font-bold text-sm tracking-wide">Fetching complete history...</p>
                  </div>
                ) : historyData && historyData.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200/60 ml-4 space-y-8">
                    {historyData.map((item, idx) => {
                      let Icon = FileText;
                      let colorClass = 'text-slate-500 bg-slate-100';
                      let dotColor = 'border-slate-400';
                      
                      if (item.type === 'Gate Pass') { Icon = ArrowRight; colorClass = 'text-blue-600 bg-blue-100'; dotColor = 'border-blue-500'; }
                      else if (item.type === 'Complaint') { Icon = AlertCircle; colorClass = 'text-red-600 bg-red-100'; dotColor = 'border-red-500'; }
                      else if (item.type === 'Parcel') { Icon = Package; colorClass = 'text-purple-600 bg-purple-100'; dotColor = 'border-purple-500'; }
                      else if (item.type === 'Room Request') { Icon = Building; colorClass = 'text-orange-600 bg-orange-100'; dotColor = 'border-orange-500'; }
                      else if (item.type === 'Checkout') { Icon = CheckCircle2; colorClass = 'text-rose-600 bg-rose-100'; dotColor = 'border-rose-500'; }
                      else if (item.type === 'Fine') { Icon = Activity; colorClass = 'text-red-600 bg-red-100'; dotColor = 'border-red-500'; }
                      else if (item.type === 'Guest Pass') { Icon = Users; colorClass = 'text-teal-600 bg-teal-100'; dotColor = 'border-teal-500'; }
                      else if (item.type === 'Payment' || item.type === 'Room Downgrade Refund') { Icon = CreditCard; colorClass = 'text-emerald-600 bg-emerald-100'; dotColor = 'border-emerald-500'; }
                      else if (item.type === 'Fee Billing') { Icon = FileText; colorClass = 'text-blue-600 bg-blue-100'; dotColor = 'border-blue-500'; }
                      else if (item.type === 'Canteen Order') { Icon = Zap; colorClass = 'text-amber-600 bg-amber-100'; dotColor = 'border-amber-500'; }

                      return (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={item.type + item.id} 
                          className="relative pl-8 group"
                        >
                          <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-50 shadow-sm ${dotColor} bg-white group-hover:scale-125 transition-transform`}></div>
                          
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md hover:border-indigo-200 transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${colorClass}`}>
                                {item.type}
                              </span>
                              <span className="text-xs font-bold text-slate-400">
                                {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">
                              {item.title}
                            </h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                              Status: <span className={item.status === 'Approved' || item.status === 'Resolved' || item.status === 'Delivered' || item.status === 'Paid' ? 'text-emerald-600' : 'text-amber-500'}>{item.status}</span>
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-600">No History Found</p>
                      <p className="text-xs mt-1">This student hasn't made any requests or complaints yet.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

</div>
        )}
      </Modal>
</motion.div>
  );
}

