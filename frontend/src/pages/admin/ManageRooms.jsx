import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Building,
  Bed,
  Layers,
  CheckCircle2,
  Phone,
  MapPin,
  Plus
} from 'lucide-react';

export default function ManageRooms() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHostels() {
      try {
        const res = await api.getAdminHostels();
        setHostels(res.hostels || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHostels();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Hostel Buildings & Wing Infrastructure</h1>
        <p className="text-xs text-slate-500 mt-1">
          Campus residential structures, block counts, and live capacity allocations.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hostels.map((h) => {
            const occupancyPct = h.total_beds > 0 ? Math.round((h.occupied_beds / h.total_beds) * 100) : 0;

            return (
              <div
                key={h.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition space-y-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                        {h.type} Hostel
                      </span>
                      <h3 className="text-lg font-black text-slate-900">{h.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{h.address}</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
                    {h.total_blocks} Blocks
                  </span>
                </div>

                {/* Capacity Metrics */}
                <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Rooms</span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{h.total_rooms || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Bed Capacity</span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{h.total_beds || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Occupancy</span>
                    <p className="text-lg font-black text-blue-600 mt-0.5">{occupancyPct}%</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                    <span>{h.occupied_beds || 0} Occupied</span>
                    <span>{h.vacant_beds || 0} Vacant</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                  <span>Contact Desk: <strong className="text-slate-800">{h.contact_phone}</strong></span>
                  <span className="text-emerald-700 font-bold">24/7 Security Gate</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
