
import React, { useState } from 'react';
import { UploadCloud, Folder, File, Video, Image as ImageIcon, FileText, PlayCircle, Share2, Download, Trash2, HardDrive } from 'lucide-react';

export default function FileVideoShare() {
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'videos'

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/30 blur-3xl rounded-full"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-3">Media & File Vault 🗄️</h1>
          <p className="text-indigo-200 text-lg font-medium">Securely share documents, lectures, and surveillance clips.</p>
        </div>
        
        <div className="relative z-10 flex gap-4 mt-6 md:mt-0">
          <button onClick={() => setActiveTab('files')} className={`px-6 py-3 rounded-2xl font-black transition-all ${activeTab === 'files' ? 'bg-white text-indigo-900 shadow-xl scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}>Files & Docs</button>
          <button onClick={() => setActiveTab('videos')} className={`px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 ${activeTab === 'videos' ? 'bg-fuchsia-500 text-white shadow-xl shadow-fuchsia-500/30 scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}><PlayCircle className="w-5 h-5"/> Video Hub</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100">
            <div className="w-full h-32 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl flex flex-col items-center justify-center text-indigo-500 hover:bg-indigo-50 hover:border-indigo-400 transition-colors cursor-pointer group">
              <UploadCloud className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">Drag & Drop to Upload</span>
            </div>
            
            <div className="mt-8 space-y-1">
              <div className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold cursor-pointer"><HardDrive className="w-5 h-5"/> All Media</div>
              <div className="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"><FileText className="w-5 h-5"/> Documents</div>
              <div className="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"><Video className="w-5 h-5"/> Videos</div>
              <div className="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"><ImageIcon className="w-5 h-5"/> Images</div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 min-h-[500px]">
            {activeTab === 'files' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow group flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm truncate w-32">Hostel_Rulebook_2026.pdf</h4>
                      <p className="text-xs text-slate-500 mt-1">2.4 MB • 2 hrs ago</p>
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600"><Download className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-shadow group cursor-pointer">
                    <div className="h-48 bg-slate-800 relative flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
                      <PlayCircle className="w-16 h-16 text-white/80 group-hover:text-white group-hover:scale-110 transition-all relative z-10" />
                      <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg">12:04</span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-slate-800">Freshers Orientation 2026</h4>
                      <p className="text-sm text-slate-500 mt-1">Uploaded by Admin • 4K UHD</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
