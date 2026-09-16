import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  Bed,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
  Wind
} from 'lucide-react';

export default function StudentRoom() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    preferred_block: 'Block B (Bhaskara)',
    preferred_room_type: 'AC',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchRoom = async () => {
    try {
      const res = await api.getStudentRoom();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.requestRoomChange(formData);
      setMsg('Your room change request has been logged and sent to Chief Warden.');
      setModalOpen(false);
      fetchRoom();
    } catch (err) {
      alert(err.message || 'Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { room, allocated } = data || {};

  if (!allocated) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-lg mx-auto">
        <Bed className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-900">No Room Allocated</h3>
        <p className="text-xs text-slate-500 mt-2">
          You are currently not assigned to a bed. Please report to the Chief Warden desk for room allotment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Room & Roommates</h1>
          <p className="text-xs text-slate-500 mt-1">
            Residential accommodation details and room transfer management.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start"
        >
          <Building className="w-4 h-4" /> Request Room Change
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Pending Room Change Request Notice */}
      {room?.pendingRequest && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Active Room Transfer Request: Pending Warden Review
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Requested: {room.pendingRequest.preferred_block} ({room.pendingRequest.preferred_room_type}). Reason: "{room.pendingRequest.reason}".
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to cancel your room transfer request?')) {
                try {
                  await api.cancelRoomChangeRequest(room.pendingRequest.id);
                  setMsg('Room transfer request cancelled successfully.');
                  fetchRoom();
                } catch (err) {
                  alert(err.message || 'Error cancelling room transfer request');
                }
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-extrabold transition shrink-0 self-end sm:self-auto cursor-pointer"
          >
            Cancel Request
          </button>
        </div>
      )}


      {/* Main Room Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl border border-blue-100">
              {room.room_number}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Assigned Room</span>
              <h3 className="text-lg font-black text-slate-900">{room.room_number} ({room.bed_number})</h3>
              <p className="text-xs text-slate-500">{room.block_name}</p>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Facility Details</span>
            <p className="text-xs font-bold text-slate-800 mt-1">{room.hostel_name}</p>
            <p className="text-xs text-slate-600">Floor {room.floor} • {room.capacity} Sharing Capacity</p>
            <span className="inline-block mt-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              {room.room_type} Room
            </span>
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Allocation Validity</span>
            <p className="text-xs font-bold text-slate-800 mt-1">Active Current Term</p>
            <p className="text-xs text-slate-600">Since: {room.allocated_from}</p>
            <p className="text-xs font-semibold text-slate-700 mt-2">
              Semester Tariff: <strong className="text-slate-900">₹{Number(room.fee_per_semester).toLocaleString()}</strong>
            </p>
          </div>

        </div>

        {/* Room Amenities Grid */}
        <div className="pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            Room Amenities & Equipment Provided
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-semibold">
              <Zap className="w-4 h-4 text-amber-500" /> 24/7 Power Backup
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-semibold">
              <Wifi className="w-4 h-4 text-blue-500" /> Gigabit Wi-Fi 6
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-semibold">
              <Wind className="w-4 h-4 text-cyan-500" /> Split Air Conditioner
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Key Card Lock
            </div>
          </div>
        </div>
      </div>

      {/* Roommates Section */}
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" /> Roommates
        </h3>

        {room.roommates?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {room.roommates.map((rm) => (
              <div key={rm.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
                <img
                  src={rm.avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'}
                  alt={rm.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-300 shadow-sm"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900">{rm.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                      {rm.bed_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{rm.roll_number} • {rm.branch}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Year {rm.year} • Blood: {rm.blood_group || 'O+'}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs">
                    <a href={`tel:${rm.phone}`} className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
                      <Phone className="w-3.5 h-3.5" /> {rm.phone}
                    </a>
                    <a href={`mailto:${rm.email}`} className="text-slate-500 font-medium flex items-center gap-1 hover:underline truncate">
                      <Mail className="w-3.5 h-3.5" /> {rm.email}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-xs text-slate-500">
            No other resident currently allocated to this room.
          </div>
        )}
      </div>

      {/* Room Change Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request Room Transfer"
        subtitle="Submit a formal application to Chief Warden office"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Preferred Hostel Block
            </label>
            <select
              value={formData.preferred_block}
              onChange={(e) => setFormData({ ...formData, preferred_block: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option>Block A (Aryabhata)</option>
              <option>Block B (Bhaskara)</option>
              <option>Block C (Charaka)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Preferred Room Type
            </label>
            <select
              value={formData.preferred_room_type}
              onChange={(e) => setFormData({ ...formData, preferred_room_type: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="AC">AC (Double Sharing)</option>
              <option value="Non-AC">Non-AC (Triple Sharing)</option>
              <option value="Deluxe">Deluxe Corner Suite</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Reason for Transfer Request *
            </label>
            <textarea
              required
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Need quiet room for competitive exam preparation / medical air-conditioning requirement..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
              className="px-5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow transition"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
