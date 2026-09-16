import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ShieldAlert,
  Building,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Users
} from 'lucide-react';

export default function ManageWardens() {
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWardens() {
      try {
        const res = await api.getAdminWardens();
        setWardens(res.wardens || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadWardens();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Hostel Wardens & Welfare Officers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Campus residential disciplinary officers and block custodians roster.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wardens.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={w.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                  alt={w.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-300 shadow-sm shrink-0"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900">{w.name}</h3>
                    <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                      {w.employee_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{w.department || 'Student Welfare & Security'}</p>
                  
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-100">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Assigned: {w.hostel_name || 'Himalaya Boys Hostel'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{w.office_location || 'Ground Floor Admin Wing, Block A'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> {w.phone || '+91 98112 34567'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 truncate">
                    <Mail className="w-3.5 h-3.5" /> {w.email}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
