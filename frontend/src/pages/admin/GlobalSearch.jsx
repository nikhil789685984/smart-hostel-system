import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, Package, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSearch(query);
        if(res.success) setResults(res.data);
      } catch(e) {
        console.error(e);
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <h1 className="text-4xl font-black mb-4 relative z-10">Global Campus Search 🌐</h1>
        <p className="text-slate-400 relative z-10">Omniscient search across students, staff, assets, and records.</p>
        
        <div className="mt-8 relative z-10">
          <div className="relative flex items-center">
            <Search className="absolute left-6 text-slate-400 w-8 h-8" />
            <input 
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything... (e.g., 'Ramesh', 'Block B', 'Laptop')"
              className="w-full bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 rounded-full py-6 pl-20 pr-8 text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/50 backdrop-blur-xl transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 min-h-[400px]">
        {query.length > 2 ? (
          loading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50 animate-pulse">
              <Search className="w-16 h-16 text-slate-300 mb-4" />
              <h2 className="text-xl font-bold text-slate-400">Searching deep database indexes...</h2>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((r, i) => (
                <div key={i} onClick={() => r.link && navigate(r.link)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 cursor-pointer flex items-center justify-between group transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      {r.type === 'Student' ? <Users /> : r.type === 'Complaint' ? <AlertCircle /> : <Package />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{r.title}</h4>
                      <p className="text-sm text-slate-500">{r.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h3 className="text-2xl font-black text-slate-800 mb-2">No Results Found</h3>
              <p className="text-slate-500 font-medium">Try different keywords.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="flex gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center"><Users /></div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><Package /></div>
              <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center"><MapPin /></div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Awaiting Query</h3>
            <p className="text-slate-500 font-medium">Type at least 3 characters to search across the entire hostel database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
