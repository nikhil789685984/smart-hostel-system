import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Bell,
  Search,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  Pin
} from 'lucide-react';

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadNotices() {
      try {
        const res = await api.getNotices({ category });
        setNotices(res.notices || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadNotices();
  }, [category]);

  const filteredNotices = notices.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Hostel Notice Board</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official announcements from the Chief Warden, Network Operations, and Mess Committee.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search circulars..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {['All', 'Inspection', 'Maintenance', 'Discipline', 'Event', 'General'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              category === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-xs text-slate-500">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">No notices found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((n) => {
            const isUrgent = n.priority === 'Urgent';
            const isHigh = n.priority === 'High';

            return (
              <div
                key={n.id}
                className={`bg-white rounded-3xl p-6 border transition hover:shadow-md ${
                  isUrgent
                    ? 'border-red-200 bg-red-50/20'
                    : isHigh
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pin className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
                      <h3 className="text-base font-black text-slate-900">{n.title}</h3>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? 'bg-red-100 text-red-700'
                            : isHigh
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {n.priority}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {n.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed max-w-4xl">
                      {n.description}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 text-xs">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 sm:justify-end">
                      <Calendar className="w-3.5 h-3.5" /> {n.date}
                    </span>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                      By: {n.publisher_name || 'Chief Warden'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
