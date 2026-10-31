import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, UserCheck, LogOut, ArrowRight, X } from 'lucide-react';
import api from '../../services/api';

const SecurityScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode;
    
    if (isScanning) {
      setScanResult(null);
      setError('');
      setSuccessMsg('');
      
      setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode("reader");
          html5QrCode.start(
            { facingMode: "environment" }, // Prefer back camera
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            onScanFailure
          ).catch((err) => {
            console.error("Camera start error:", err);
            setError("Camera error: " + err.message);
            setIsScanning(false);
          });
        } catch (err) {
          console.error("Scanner init error:", err);
          setError("Could not start camera system.");
          setIsScanning(false);
        }
      }, 100);
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(e => console.log(e));
      }
    };
  }, [isScanning]);

  const onScanSuccess = async (decodedText, decodedResult) => {
    try {
      const data = JSON.parse(decodedText);
      if (!data.type || !data.id) throw new Error("Invalid QR format");
      
      setIsScanning(false);
      setLoading(true);
      
      const res = await api.verifyPassForScanner(data.type, data.id);
      if (res.success) {
        setScanResult(res);
      } else {
        setError(res.message);
      }
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      setError("Unrecognized QR Code Format");
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error) => {};

  const handleAction = async (action) => {
    if (!scanResult) return;
    setLoading(true);
    try {
      const res = await api.processScanAction(scanResult.type, scanResult.pass.id, action);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          setScanResult(null);
          setSuccessMsg('');
          setIsScanning(true);
        }, 2000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Security Scanner</h1>
          <p className="text-slate-500 mt-1">Live webcam QR verification for Gate & Guest Passes</p>
        </div>
        {!isScanning && !scanResult && (
          <button 
            onClick={() => setIsScanning(true)}
            className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition flex items-center gap-2"
          >
            Start Camera Scanner <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Scanner Side */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-slate-800">Live Camera Feed</h2>
             {isScanning && (
               <button onClick={() => setIsScanning(false)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg flex items-center gap-1 text-sm font-bold">
                 <X className="w-4 h-4" /> Stop
               </button>
             )}
          </div>
          
          <div className="w-full min-h-[300px] bg-slate-100 rounded-xl overflow-hidden relative flex items-center justify-center border-2 border-dashed border-slate-300">
            {/* Always mount reader, but hide it if not scanning */}
            <div id="reader" className="w-full h-full" style={{ border: 'none', display: isScanning ? 'block' : 'none' }}></div>
            
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10 text-center p-8">
                <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
                </div>
                <p className="text-slate-500 font-medium">Camera is offline.</p>
                <button onClick={() => setIsScanning(true)} className="mt-4 text-emerald-500 font-bold hover:underline">Tap to activate</button>
              </div>
            )}
          </div>
        </div>

        {/* Results Side */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Verification Panel</h2>
          
          {loading && (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Verifying Pass...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-start gap-3">
              <XCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold">Scan Error</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold">{successMsg}</h3>
            </div>
          )}

          {scanResult && !loading && !successMsg && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className={`p-4 text-white flex items-center justify-between ${scanResult.pass.status === 'Approved' ? 'bg-emerald-500' : scanResult.pass.status === 'Active' ? 'bg-blue-500' : 'bg-rose-500'}`}>
                <div className="flex items-center gap-2">
                  {scanResult.pass.status === 'Approved' || scanResult.pass.status === 'Active' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <span className="font-bold tracking-wide">{scanResult.type} PASS</span>
                </div>
                <div className="text-xs font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded">
                  {scanResult.pass.status}
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID</p>
                    <p className="font-mono text-slate-800">{scanResult.type === 'GATE' ? 'GT-' : 'GS-'}{scanResult.pass.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Student / Host</p>
                    <p className="font-bold text-slate-800">{scanResult.pass.student_name}</p>
                    <p className="text-xs text-slate-500">{scanResult.pass.roll_number}</p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {scanResult.type === 'GATE' ? (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Gate Pass Details</p>
                    <p className="text-sm text-slate-700"><strong>Reason:</strong> {scanResult.pass.reason}</p>
                    <p className="text-sm text-slate-700"><strong>Valid Until:</strong> {new Date(scanResult.pass.expected_return).toLocaleString()}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Guest Details</p>
                    <p className="text-sm text-slate-700"><strong>Name:</strong> {scanResult.pass.guest_name} ({scanResult.pass.relation})</p>
                    <p className="text-sm text-slate-700"><strong>Valid:</strong> {new Date(scanResult.pass.start_date).toLocaleDateString()} to {new Date(scanResult.pass.end_date).toLocaleDateString()}</p>
                  </div>
                )}
                
                <div className="pt-2 flex gap-3">
                  {scanResult.type === 'GATE' && (
                    <>
                      <button onClick={() => handleAction('MARK_DEPARTED')} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition">
                        <LogOut className="w-4 h-4" /> Mark Departed
                      </button>
                      <button onClick={() => handleAction('MARK_RETURNED')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition">
                        <UserCheck className="w-4 h-4" /> Mark Returned
                      </button>
                    </>
                  )}
                  {scanResult.type === 'GUEST' && (
                    <>
                      <button onClick={() => handleAction('MARK_CHECKIN')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition">
                        <UserCheck className="w-4 h-4" /> Check In Guest
                      </button>
                      <button onClick={() => handleAction('MARK_CHECKOUT')} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition">
                        <LogOut className="w-4 h-4" /> Check Out Guest
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {!scanResult && !loading && !error && !successMsg && (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/><path d="M9 11h6"/></svg>
               <p>Scan a QR code to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityScanner;
