import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

import Modal from '../../components/ui/Modal';
import {
  Bell,
  Search,
  Calendar,
  AlertCircle,
  Clock,
  Pin,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedNotice, setSelectedNotice] = useState(null);

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

  const categories = ['All', 'Inspection', 'Maintenance', 'Discipline', 'Event', 'General'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-100 pt-8 pb-6 px-6 lg:px-12 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Official Notices</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">Stay updated with campus announcements</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Categories / Filters */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex items-center gap-2 text-slate-400 mr-2">
            <Filter className="w-4 h-4" />
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                category === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 animate-pulse h-64">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl mb-4"></div>
                <div className="w-3/4 h-5 bg-slate-100 rounded-full mb-3"></div>
                <div className="w-1/2 h-4 bg-slate-100 rounded-full mb-6"></div>
                <div className="w-full h-16 bg-slate-50 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">You're all caught up!</h3>
            <p className="text-slate-500 font-medium max-w-sm">No new announcements matching your filters at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            
              {filteredNotices.map((n, index) => {
                const isUrgent = n.priority === 'Urgent';
                const isHigh = n.priority === 'High';

                return (
                  <div
                    key={n.id} onClick={() => setSelectedNotice(n)} className={`group relative bg-white p-6 sm:p-8 rounded-[2rem] border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                      isUrgent
                        ? 'border-rose-100 shadow-[0_8px_30px_rgb(255,228,230,0.5)]'
                        : isHigh
                        ? 'border-amber-100 shadow-[0_8px_30px_rgb(254,243,199,0.5)]'
                        : 'border-slate-100 hover:border-indigo-100'
                    }`}
                  >
                    {/* Top Meta */}
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                        isUrgent ? 'bg-rose-50 text-rose-600' : isHigh ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {isUrgent ? <AlertCircle className="w-6 h-6" /> : <Pin className="w-6 h-6" />}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${
                        isUrgent ? 'bg-rose-100 text-rose-700' : isHigh ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {n.priority}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-black text-slate-900 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
                      {n.title}
                    </h3>
                    
                    <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 mb-6">
                      {n.description}
                    </p>
                    {n.attachment_url && (
                      <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                        <span role="img" aria-label="attachment">📎</span> 
                        {n.attachment_type === 'image' ? 'Image Attached' : n.attachment_type === 'video' ? 'Video Attached' : 'Document Attached'}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> {n.date}
                      </div>
                      <span className="bg-slate-50 px-2.5 py-1 rounded-lg text-slate-500">
                        {n.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            
          </div>
        )}
      </div>

      
      {/* Super Fast Full Screen Modal */}
      
        {selectedNotice && (
          <Modal isOpen={!!selectedNotice} onClose={() => setSelectedNotice(null)} title={selectedNotice.title} maxWidth={selectedNotice?.attachment_url ? "max-w-6xl" : "max-w-3xl"}>
            <div className="p-2 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-widest">{selectedNotice.category}</span>
                <span className="text-slate-400 text-sm font-semibold">{selectedNotice.date}</span>
              </div>
              
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {selectedNotice.description}
              </div>

              {selectedNotice.attachment_url && (
                <div className="mt-8 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                  {selectedNotice.attachment_type === 'image' && (
                    <img src={`http://${window.location.hostname}:5001${selectedNotice.attachment_url}`} alt="Attachment" className="w-full h-auto max-h-[60vh] object-contain" />
                  )}
                  {selectedNotice.attachment_type === 'video' && (
                    <video src={`http://${window.location.hostname}:5001${selectedNotice.attachment_url}`} controls className="w-full h-auto max-h-[60vh] bg-black" />
                  )}
                  {(selectedNotice.attachment_type === 'pdf' || selectedNotice.attachment_type === 'document' || selectedNotice.attachment_type === 'unknown') && (
                    <div className="p-8 text-center">
                      <p className="text-slate-600 font-bold mb-4">{selectedNotice.attachment_type === "pdf" ? "PDF Document Attached" : "File Document Attached"}</p>
                      <a href={`http://${window.location.hostname}:5001${selectedNotice.attachment_url}`} target="_blank" rel="noreferrer" className="inline-block px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition">
                        Download / View Document
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal>
        )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 0px;
        }
      `}</style>
    </div>
  );
}
