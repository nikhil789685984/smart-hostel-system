import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Pin
} from 'lucide-react';

export default function NoticeManagement() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Normal',
    target_audience: 'all',
    expires_at: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [file, setFile] = useState(null);

  const fetchNotices = async () => {
    try {
      const res = await api.getNotices();
      setNotices(res.notices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const openCreateModal = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      description: '',
      category: 'General',
      priority: 'Normal',
      target_audience: 'all',
      expires_at: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      description: notice.description,
      category: notice.category,
      priority: notice.priority,
      target_audience: notice.target_audience,
      expires_at: notice.expires_at || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.deleteNotice(id);
      setMsg('Notice removed successfully.');
      fetchNotices();
    } catch (err) {
      alert(err.message || 'Error deleting notice');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('Uploading data...');
    try {
      let finalData = { ...formData };
      if (file) {
        const uploadResult = await api.uploadFile(file);
        if (uploadResult.success) {
          finalData.attachment_url = uploadResult.fileUrl;
          finalData.attachment_type = uploadResult.type;
        }
      }

      if (editingNotice) {
        await api.updateNotice(editingNotice.id, finalData);
        setMsg('Notice updated successfully.');
      } else {
        await api.createNotice(finalData);
        setMsg('New notice published across resident portals.');
      }
      setFile(null);
      setModalOpen(false);
      fetchNotices();
    } catch (err) {
      alert(err.message || 'Error saving notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Hostel Notice Board Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast emergency alerts, maintenance schedules, and disciplinary circulars.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md shadow-purple-500/20 transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" /> + Publish Circular
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Notices List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-xs text-slate-500">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">No notices active</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pin className="w-4 h-4 text-purple-600" />
                    <h3 className="text-base font-black text-slate-900">{n.title}</h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        n.priority === 'Urgent'
                          ? 'bg-red-100 text-red-700'
                          : n.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {n.priority}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Audience: {n.target_audience}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed max-w-4xl">{n.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start">
                  <button
                    onClick={() => openEditModal(n)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Published on: <strong className="text-slate-600">{n.date}</strong></span>
                <span>Category: <strong className="text-slate-600">{n.category}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNotice ? 'Edit Notice Circular' : 'Publish New Campus Circular'}
        subtitle="Broadcast announcement to student portal and hostel screens"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Electrical Safety Inspection & Curfew Enforcement"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Detailed Announcement *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide complete circular details, prohibited items, timings, or consequences..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option>General</option>
                <option>Inspection</option>
                <option>Maintenance</option>
                <option>Discipline</option>
                <option>Event</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Audience</label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="all">All Residents & Staff</option>
                <option value="students">Students Only</option>
                <option value="wardens">Wardens Only</option>
              </select>
            </div>
          </div>

          
          <div className="col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Attach Image/Video/PDF (Optional)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-purple-600 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
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
              className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow transition"
            >
              {submitting ? 'Publishing...' : editingNotice ? 'Update Circular' : 'Publish Circular'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
