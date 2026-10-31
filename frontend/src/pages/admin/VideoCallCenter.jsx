
import React, { useState } from 'react';
import { PhoneCall, Video, Mic, MicOff, VideoOff, PhoneMissed, MonitorUp, Users, MessageSquare } from 'lucide-react';

export default function VideoCallCenter() {
  const [inCall, setInCall] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  if (!inCall) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-slate-100">
          <div className="w-24 h-24 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-4">Warden/Student VC Hub</h1>
          <p className="text-slate-500 font-medium max-w-lg mx-auto mb-10">Start an encrypted, high-definition video call with students, wardens, or host an emergency broadcast.</p>
          
          <button onClick={() => setInCall(true)} className="bg-teal-500 hover:bg-teal-600 text-white text-xl font-black px-10 py-5 rounded-full shadow-xl shadow-teal-500/30 hover:scale-105 transition-all flex items-center gap-3 mx-auto">
            <Video className="w-6 h-6" /> Start New Meeting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[80vh] bg-slate-950 rounded-[2rem] overflow-hidden flex flex-col relative shadow-2xl">
      {/* Main Video Area */}
      <div className="flex-1 p-4 flex gap-4">
        {/* Main Speaker */}
        <div className="flex-1 bg-slate-800 rounded-[1.5rem] relative overflow-hidden flex items-center justify-center group border border-slate-700">
          <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-bold text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Chief Warden 
          </div>
        </div>
        
        {/* Sidebar Gallery */}
        <div className="w-64 flex flex-col gap-4">
          <div className="h-40 bg-slate-800 rounded-[1.5rem] relative overflow-hidden border border-slate-700">
            <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white font-bold text-xs">Admin (You)</div>
          </div>
          <div className="h-40 bg-slate-800 rounded-[1.5rem] relative overflow-hidden border border-slate-700 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white">SK</div>
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white font-bold text-xs flex items-center gap-1"><MicOff className="w-3 h-3 text-rose-500"/> Student 1</div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-24 bg-slate-900 flex items-center justify-center gap-4 px-8 border-t border-slate-800">
        <button onClick={() => setMicOn(!micOn)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>
          {micOn ? <Mic className="w-6 h-6"/> : <MicOff className="w-6 h-6"/>}
        </button>
        <button onClick={() => setCamOn(!camOn)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${camOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>
          {camOn ? <Video className="w-6 h-6"/> : <VideoOff className="w-6 h-6"/>}
        </button>
        <button className="w-14 h-14 rounded-full bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center transition-all">
          <MonitorUp className="w-6 h-6"/>
        </button>
        
        <div className="w-px h-10 bg-slate-800 mx-2"></div>
        
        <button onClick={() => setInCall(false)} className="px-8 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all">
          <PhoneMissed className="w-5 h-5"/> End Call
        </button>
      </div>
    </div>
  );
}
