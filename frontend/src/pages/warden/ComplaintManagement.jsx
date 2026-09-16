import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  AlertCircle,
  Wrench,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  MessageSquare,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export default function ComplaintManagement() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Update Status Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusToSet, setStatusToSet] = useState('Assigned');
  const [assignedTo, setAssignedTo] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchComplaints = async () => {
    try {
      const res = await api.getComplaints({
        category: categoryFilter,
        status: statusFilter,
        priority: priorityFilter,
        search,
      });
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [categoryFilter, statusFilter, priorityFilter, search]);

  const openUpdateModal = (c) => {
    setSelectedComplaint(c);
    setStatusToSet(c.status);
    setAssignedTo(c.assigned_to || '');
    setResolutionNotes(c.resolution_notes || '');
    setUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.updateComplaintStatus(selectedComplaint.id, {
        status: statusToSet,
        assigned_to: assignedTo,
        resolution_notes: resolutionNotes,
      });
      setMsg(`Complaint #${selectedComplaint.id} status updated to ${statusToSet}.`);
      setUpdateModalOpen(false);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Error updating complaint');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="text-xs font-black uppercase text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">Pending</span>;
      case 'Assigned':
        return <span className="text-xs font-black uppercase text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">Assigned</span>;
      case 'In Progress':
        return <span className="text-xs font-black uppercase text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">In Progress</span>;
      case 'Resolved':
        return <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">Resolved</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Urgent':
        return <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Urgent</span>;
      case 'High':
        return <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">High</span>;
      case 'Medium':
        return <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Medium</span>;
      default:
        return <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Complaint Resolution Pipeline</h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch maintenance staff, update repair statuses, and record resolution notes.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tickets, rooms, students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
          />
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold"
          >
            <option value="All">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Internet">Internet</option>
            <option value="Furniture">Furniture</option>
            <option value="Security">Security</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-xs text-slate-500">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">No matching complaints in queue</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{c.id}</span>
                    <h3 className="text-base font-black text-slate-900">{c.title}</h3>
                    {getStatusBadge(c.status)}
                    {getPriorityBadge(c.priority)}
                  </div>
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed max-w-3xl">{c.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 self-start shrink-0">
                  <Link
                    to={`/${user?.role === 'admin' ? 'admin' : 'warden'}/complaints/${c.id}`}
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-2"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => openUpdateModal(c)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow transition"
                  >
                    Manage Status
                  </button>
                </div>
              </div>

              {/* Meta Info Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-500">
                  <span>Resident: <strong className="text-slate-800">{c.student_name}</strong> ({c.roll_number})</span>
                  <span>Location: <strong className="text-slate-800">{c.location}</strong></span>
                  <span>Dept: <strong className="text-slate-800">{c.department}</strong></span>
                  {c.assigned_to && (
                    <span className="text-purple-700 font-semibold">Assigned: {c.assigned_to}</span>
                  )}
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  Logged: {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>

              {c.resolution_notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Technician / Warden Notes: </strong>
                    {c.resolution_notes}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Update Modal */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title={`Update Ticket #${selectedComplaint?.id}`}
        subtitle={selectedComplaint?.title}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Complaint Status *
            </label>
            <select
              value={statusToSet}
              onChange={(e) => setStatusToSet(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-bold"
            >
              <option value="Pending">Pending (Awaiting Dispatch)</option>
              <option value="Assigned">Assigned to Technician</option>
              <option value="In Progress">In Progress / Work Underway</option>
              <option value="Resolved">Resolved / Work Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Assign Staff / Technician
            </label>
            <input
              type="text"
              placeholder="e.g. Suresh Kumar (Duty Electrician) / Ramesh (Plumbing)"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Resolution Remarks / Progress Notes
            </label>
            <textarea
              rows={3}
              placeholder="Describe work completed, components replaced, or scheduled visit time..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setUpdateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow transition"
            >
              {updating ? 'Saving...' : 'Save & Update Ticket'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
