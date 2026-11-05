import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Tag, Plus, CheckCircle2, ShieldAlert, PackageSearch, 
  Upload, Image as ImageIcon, Camera, X, Loader2, Link2, ExternalLink, AlertTriangle 
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

export default function LostAndFound() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('FOUND'); // LOST or FOUND
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState(false);
  const [claimModal, setClaimModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewModalImage, setPreviewModalImage] = useState(null);

  // Photo Attachment Mode: 'file' | 'url'
  const [photoMode, setPhotoMode] = useState('file');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    item_name: '', category: 'Electronics', description: '', location: '', image_url: ''
  });
  const [submittingReport, setSubmittingReport] = useState(false);
  const [claimProof, setClaimProof] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getLostFoundItems(activeTab, 'Active');
      if (res.success) setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  // Handle direct file upload from device / phone gallery
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setUploadingImage(true);
    setImageLoadError(false);
    try {
      const res = await api.uploadFile(file);
      if (res.success && res.fileUrl) {
        setFormData(prev => ({ ...prev, image_url: res.fileUrl }));
      } else {
        alert(res.message || 'File upload failed');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert(err.message || 'Failed to upload photo from your device. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Convert Google Drive share links into direct viewable image URLs
  const normalizeAndSetUrl = (val) => {
    setImageLoadError(false);
    let clean = (val || '').trim();
    const driveMatch = clean.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      clean = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    } else if (clean.includes('dropbox.com')) {
      clean = clean.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
      if (!clean.includes('raw=1')) {
        clean += clean.includes('?') ? '&raw=1' : '?raw=1';
      }
    }
    setFormData(prev => ({ ...prev, image_url: clean }));
  };

  const handleReport = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const res = await api.reportLostFoundItem({ ...formData, type: activeTab });
      if (res.success) {
        setReportModal(false);
        setFormData({ item_name: '', category: 'Electronics', description: '', location: '', image_url: '' });
        setImageLoadError(false);
        fetchItems();
      } else {
        alert(res.message || 'Failed to submit report.');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error reporting item.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    try {
      const res = await api.claimFoundItem(selectedItem.id, claimProof);
      if (res.success) {
        setClaimModal(false);
        setClaimProof('');
        setSelectedItem(null);
        fetchItems();
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error claiming item.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <PackageSearch className="w-8 h-8 text-indigo-500" />
            Digital Lost & Found
          </h1>
          <p className="text-slate-500 font-medium mt-1">Report lost items or claim what you found with verified photos.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ item_name: '', category: 'Electronics', description: '', location: '', image_url: '' });
            setImageLoadError(false);
            setReportModal(true);
          }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Report {activeTab === 'LOST' ? 'Lost Item' : 'Found Item'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/50 rounded-2xl w-full max-w-sm">
        <button
          onClick={() => setActiveTab('FOUND')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'FOUND' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Found Items Hub
        </button>
        <button
          onClick={() => setActiveTab('LOST')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'LOST' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Missing Board
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <PackageSearch className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">No {activeTab} items right now</h3>
          <p className="text-slate-500 mt-2">Everything seems to be in its right place.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              {item.image_url ? (
                <div 
                  onClick={() => setPreviewModalImage({ url: item.image_url, title: item.item_name })}
                  className="w-full h-48 bg-slate-100 relative overflow-hidden cursor-pointer"
                  title="Click to view full image"
                >
                  <img 
                    src={item.image_url} 
                    alt={item.item_name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.classList.add('flex', 'items-center', 'justify-center', 'bg-slate-100');
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold uppercase rounded-lg backdrop-blur-md shadow-sm ${activeTab === 'FOUND' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                    {activeTab}
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    🔍 View Photo
                  </div>
                </div>
              ) : (
                <div className={`w-full h-36 flex flex-col items-center justify-center relative ${activeTab === 'FOUND' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <PackageSearch className={`w-10 h-10 ${activeTab === 'FOUND' ? 'text-emerald-300' : 'text-rose-300'}`} />
                  <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold uppercase rounded-lg ${activeTab === 'FOUND' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {activeTab}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">No Photo Attached</span>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-black text-slate-800 line-clamp-1">{item.item_name}</h3>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">{item.category}</span>
                </div>
                
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
                
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {item.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" /> Reported by {item.reporter_name}
                  </div>
                </div>

                {activeTab === 'FOUND' ? (
                  <button 
                    onClick={() => { setSelectedItem(item); setClaimModal(true); }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Claim This Item
                  </button>
                ) : (
                  <button className="w-full py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl cursor-default">
                    Keep an eye out!
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      <Modal isOpen={reportModal} onClose={() => setReportModal(false)} title={`Report ${activeTab === 'LOST' ? 'Lost' : 'Found'} Item`}>
        <form onSubmit={handleReport} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Item Name *</label>
            <input 
              required 
              type="text" 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-indigo-500" 
              placeholder="e.g. Blue Hydro Flask / Boat Earphones / College ID" 
              value={formData.item_name} 
              onChange={e => setFormData({...formData, item_name: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Category *</label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-indigo-500" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option>Electronics</option>
                <option>Clothing</option>
                <option>Keys</option>
                <option>Books</option>
                <option>Wallet/ID</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Location {activeTab==='LOST' ? 'Lost' : 'Found'} *
              </label>
              <input 
                required 
                type="text" 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-indigo-500" 
                placeholder="e.g. Block B Mess, 2nd Floor Library" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Detailed Description *</label>
            <textarea 
              required 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 h-20 resize-none text-xs font-medium focus:outline-indigo-500" 
              placeholder="Provide color, brand, stickers, unique identification marks..." 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Photo Attachment Section with Dual Modes: File Upload & Web Link */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                Item Photo (Recommended)
              </label>

              {/* Mode Switcher */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPhotoMode('file')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    photoMode === 'file' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Device Upload
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode('url')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    photoMode === 'url' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste Link
                </button>
              </div>
            </div>

            {/* Mode 1: File Upload from Phone / Device */}
            {photoMode === 'file' ? (
              <div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  id="lost-found-file-picker" 
                  onChange={handleFileUpload} 
                />
                
                {!formData.image_url ? (
                  <label 
                    htmlFor="lost-found-file-picker"
                    className={`flex flex-col items-center justify-center p-5 border-2 border-dashed border-indigo-200 rounded-xl bg-white hover:bg-indigo-50/50 transition cursor-pointer ${
                      uploadingImage ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Uploading photo from device...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Tap to Choose Photo / Open Camera</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG from your gallery</span>
                      </>
                    )}
                  </label>
                ) : null}
              </div>
            ) : (
              /* Mode 2: Paste Link / Google Drive */
              <div className="space-y-2">
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-indigo-500" 
                    placeholder="Paste image link, Imgur, or Google Drive share link..." 
                    value={formData.image_url} 
                    onChange={e => normalizeAndSetUrl(e.target.value)} 
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Tip: Google Drive share links are automatically converted into viewable photos.
                </p>
              </div>
            )}

            {/* Live Photo Preview Box */}
            {formData.image_url && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      onError={() => setImageLoadError(true)}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    {imageLoadError ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Could not load image from URL</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Photo attached & verified</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
                      {formData.image_url}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, image_url: '' }));
                    setImageLoadError(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={submittingReport || uploadingImage}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {submittingReport ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Report...</span>
              </>
            ) : (
              `Submit ${activeTab === 'LOST' ? 'Lost' : 'Found'} Report`
            )}
          </button>
        </form>
      </Modal>

      {/* Full-Screen Image Lightbox Modal */}
      {previewModalImage && (
        <Modal 
          isOpen={Boolean(previewModalImage)} 
          onClose={() => setPreviewModalImage(null)} 
          title={previewModalImage.title || 'Item Photo'}
          maxWidth="max-w-3xl"
        >
          <div className="flex flex-col items-center justify-center p-2">
            <div className="max-h-[70vh] rounded-2xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
              <img 
                src={previewModalImage.url} 
                alt="Item Full Preview" 
                className="max-h-[70vh] max-w-full object-contain" 
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <a 
                href={previewModalImage.url} 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Image in New Tab
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Claim Modal */}
      <Modal isOpen={claimModal} onClose={() => setClaimModal(false)} title="Claim Found Item">
        {selectedItem && (
          <form onSubmit={handleClaim} className="space-y-4 pt-2">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-4 flex items-start gap-3">
              {selectedItem.image_url && (
                <img 
                  src={selectedItem.image_url} 
                  alt={selectedItem.item_name} 
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-indigo-200" 
                />
              )}
              <div>
                <h4 className="font-bold text-indigo-900">{selectedItem.item_name}</h4>
                <p className="text-xs text-indigo-700 mt-0.5">Found at: {selectedItem.location}</p>
                <span className="text-[10px] font-bold uppercase text-indigo-600 bg-white/70 px-2 py-0.5 rounded mt-1 inline-block">
                  {selectedItem.category}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Digital Proof of Ownership *
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Describe a unique feature, serial number, scratch, lock screen wallpaper, or what was inside it to prove it's yours.
              </p>
              <textarea 
                required 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 h-28 resize-none text-xs font-medium focus:outline-indigo-500" 
                placeholder="e.g. It has a sticker of Iron Man on the back, or the volume button is slightly loose..." 
                value={claimProof} 
                onChange={e => setClaimProof(e.target.value)}
              />
            </div>

            <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer">
              Submit Ownership Claim
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
