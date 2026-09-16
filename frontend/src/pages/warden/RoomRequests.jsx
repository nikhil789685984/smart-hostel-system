import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  Users,
  CheckCircle2,
  XCircle,
  Building,
  Bed,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function RoomRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('Approved');
  const [wardenNotes, setWardenNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.getRoomChangeRequests();
      setRequests(res.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openActionModal = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setWardenNotes(type === 'Approved' ? 'Transfer approved subject to room inventory handoff.' : 'Declined due to zero vacancy in requested wing.');
    setActionModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.updateRoomChangeRequest(selectedReq.id, {
        status: actionType,
        warden_notes: wardenNotes,
      });
      setMsg(`Room change request #${selectedReq.id} marked as ${actionType}.`);
      setActionModalOpen(false);
      fetchRequests();
    } catch (err) {
      alert(err.message || 'Error updating request');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Room Change & Transfer Requests</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review resident requests to switch wings, room types, or roommate pairings.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-xs text-slate-500">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">No room transfer applications pending</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const isPending = r.status === 'Pending';

            return (
              <div
                key={r.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">#{r.id}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          r.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{r.created_at}</span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mt-2">
                      {r.student_name} ({r.roll_number}) • {r.branch}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                      <span>Current Room: <strong className="text-slate-900">{r.current_room} ({r.current_bed})</strong></span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                      <span>Preferred: <strong className="text-purple-700">{r.preferred_block} ({r.preferred_room_type})</strong></span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 italic">Reason: "{r.reason}"</p>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 self-start">
                      <button
                        onClick={() => openActionModal(r, 'Approved')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Transfer
                      </button>
                      <button
                        onClick={() => openActionModal(r, 'Rejected')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {r.warden_notes && (
                  <p className="text-xs text-purple-800 italic pt-2 border-t border-slate-100">
                    Chief Warden Remarks: "{r.warden_notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={`${actionType} Room Transfer #${selectedReq?.id}`}
        subtitle={`Resident: ${selectedReq?.student_name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Warden Remarks *
            </label>
            <textarea
              required
              rows={3}
              value={wardenNotes}
              onChange={(e) => setWardenNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActionModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow transition ${
                actionType === 'Rejected' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {processing ? 'Processing...' : `Confirm ${actionType}`}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
