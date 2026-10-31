import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Folder, FileText, Upload, Search, Download, Trash2,
  Plus, Video, Music, Link2, ExternalLink, Play, Star,
  Edit2, X, Eye, Sparkles, AlertCircle, Check, Tag, Volume2,
  ArrowUpRight, HardDrive, RefreshCw
} from 'lucide-react';
import api, { API_BASE } from '../../services/api';

const COLOR_THEMES = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', activeBg: 'bg-indigo-600' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', activeBg: 'bg-emerald-600' },
  { id: 'sky', label: 'Sky Blue', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', activeBg: 'bg-sky-600' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', activeBg: 'bg-purple-600' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', activeBg: 'bg-amber-600' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', activeBg: 'bg-rose-600' }
];

export default function StudyHub() {
  // State: Subjects & Materials (Starts at 0)
  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [storageInfo, setStorageInfo] = useState({ usedMb: 0, totalMb: 1024, totalItems: 0 });
  const [activeSubjectId, setActiveSubjectId] = useState('all');
  const [activeTypeTab, setActiveTypeTab] = useState('all'); // all | pdf | video | audio | link | favorite
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Modals
  const [subjectModal, setSubjectModal] = useState({ isOpen: false, mode: 'create', subject: null });
  const [materialModal, setMaterialModal] = useState({ isOpen: false, mode: 'create', material: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: '', id: null, title: '' });
  const [mediaPreview, setMediaPreview] = useState(null); // { type: 'video' | 'audio' | 'pdf', url: '', title: '' }

  // Form states: Subject
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    color: 'indigo',
    semester: 6,
    description: ''
  });

  // Form states: Material
  const [materialUploadMode, setMaterialUploadMode] = useState('file'); // 'file' | 'link'
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileDetails, setUploadedFileDetails] = useState(null); // { fileUrl, fileName, size, type }
  const [materialForm, setMaterialForm] = useState({
    title: '',
    subject_id: '',
    description: '',
    material_type: 'pdf',
    external_url: '',
    tags: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMsg({ text: message, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjRes, matRes] = await Promise.all([
        api.getStudySubjects(),
        api.getStudyMaterials()
      ]);

      if (subjRes.success) {
        setSubjects(subjRes.subjects || []);
      }
      if (matRes.success) {
        setMaterials(matRes.data || []);
        if (matRes.storage) setStorageInfo(matRes.storage);
      }
    } catch (err) {
      console.error('Error loading study hub data:', err);
      showToast('Failed to load study hub resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  // SUBJECT OPERATIONS
  const openAddSubject = () => {
    setSubjectForm({
      name: '',
      code: '',
      color: 'indigo',
      semester: 6,
      description: ''
    });
    setSubjectModal({ isOpen: true, mode: 'create', subject: null });
  };

  const openEditSubject = (sub, e) => {
    e.stopPropagation();
    setSubjectForm({
      name: sub.name,
      code: sub.code || '',
      color: sub.color || 'indigo',
      semester: sub.semester || 6,
      description: sub.description || ''
    });
    setSubjectModal({ isOpen: true, mode: 'edit', subject: sub });
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) {
      showToast('Please enter a subject name', 'error');
      return;
    }

    try {
      if (subjectModal.mode === 'create') {
        const res = await api.createStudySubject(subjectForm);
        if (res.success) {
          setSubjects(prev => [...prev, res.subject]);
          showToast(`Subject "${res.subject.name}" added!`);
          setActiveSubjectId(res.subject.id);
        }
      } else {
        const res = await api.updateStudySubject(subjectModal.subject.id, subjectForm);
        if (res.success) {
          setSubjects(prev => prev.map(s => s.id === res.subject.id ? res.subject : s));
          showToast(`Subject "${res.subject.name}" updated!`);
        }
      }
      setSubjectModal({ isOpen: false, mode: 'create', subject: null });
    } catch (err) {
      showToast(err.message || 'Error saving subject', 'error');
    }
  };

  const confirmDeleteSubject = (sub, e) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      type: 'subject',
      id: sub.id,
      title: sub.name
    });
  };

  const executeDelete = async () => {
    try {
      if (deleteConfirm.type === 'subject') {
        await api.deleteStudySubject(deleteConfirm.id);
        setSubjects(prev => prev.filter(s => s.id !== deleteConfirm.id));
        setMaterials(prev => prev.filter(m => m.subject_id !== deleteConfirm.id));
        if (activeSubjectId === deleteConfirm.id) setActiveSubjectId('all');
        showToast('Subject and materials removed');
      } else if (deleteConfirm.type === 'material') {
        await api.deleteStudyMaterial(deleteConfirm.id);
        setMaterials(prev => prev.filter(m => m.id !== deleteConfirm.id));
        showToast('Study material deleted');
      }
    } catch (err) {
      showToast(err.message || 'Delete operation failed', 'error');
    } finally {
      setDeleteConfirm({ isOpen: false, type: '', id: null, title: '' });
    }
  };

  // MATERIAL OPERATIONS
  const openAddMaterial = (preselectedSubjectId = null) => {
    if (subjects.length === 0) {
      showToast('Please create a subject folder first before uploading files.', 'error');
      openAddSubject();
      return;
    }

    const defaultSubId = preselectedSubjectId && preselectedSubjectId !== 'all' 
      ? preselectedSubjectId 
      : (subjects[0]?.id || '');

    setMaterialForm({
      title: '',
      subject_id: defaultSubId,
      description: '',
      material_type: 'pdf',
      external_url: '',
      tags: ''
    });
    setMaterialUploadMode('file');
    setUploadedFileDetails(null);
    setMaterialModal({ isOpen: true, mode: 'create', material: null });
  };

  const openEditMaterial = (mat) => {
    setMaterialForm({
      title: mat.title,
      subject_id: mat.subject_id,
      description: mat.description || '',
      material_type: mat.material_type || 'document',
      external_url: mat.external_url || '',
      tags: mat.tags || ''
    });
    setMaterialModal({ isOpen: true, mode: 'edit', material: mat });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      showToast('File size exceeds 100MB limit', 'error');
      return;
    }

    try {
      setUploadingFile(true);
      const res = await api.uploadFile(file);
      if (res.success) {
        setUploadedFileDetails({
          fileUrl: res.fileUrl,
          fileName: res.fileName || file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: res.type || 'document'
        });

        if (!materialForm.title) {
          const rawName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          setMaterialForm(prev => ({
            ...prev,
            title: rawName,
            material_type: res.type || prev.material_type
          }));
        } else {
          setMaterialForm(prev => ({
            ...prev,
            material_type: res.type || prev.material_type
          }));
        }
        showToast(`File "${file.name}" uploaded!`);
      }
    } catch (err) {
      console.error('File upload error:', err);
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.title.trim()) {
      showToast('Please enter a title for the material', 'error');
      return;
    }
    if (!materialForm.subject_id) {
      showToast('Please select a subject', 'error');
      return;
    }

    try {
      if (materialModal.mode === 'create') {
        const payload = {
          title: materialForm.title.trim(),
          subject_id: parseInt(materialForm.subject_id, 10),
          description: materialForm.description,
          tags: materialForm.tags,
          material_type: materialForm.material_type
        };

        if (materialUploadMode === 'file') {
          if (!uploadedFileDetails?.fileUrl) {
            showToast('Please upload a file first', 'error');
            return;
          }
          payload.file_url = uploadedFileDetails.fileUrl;
          payload.file_name = uploadedFileDetails.fileName;
          payload.file_size = uploadedFileDetails.size;
          payload.material_type = uploadedFileDetails.type;
        } else {
          if (!materialForm.external_url.trim()) {
            showToast('Please enter a valid URL or link', 'error');
            return;
          }
          payload.external_url = materialForm.external_url.trim();
          payload.file_size = 'Web Link';
          
          const url = payload.external_url;
          if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) payload.material_type = 'video';
          else if (/\.(mp3|wav|ogg)$/i.test(url)) payload.material_type = 'audio';
          else if (/\.pdf$/i.test(url)) payload.material_type = 'pdf';
          else payload.material_type = 'link';
        }

        const res = await api.uploadStudyMaterial(payload);
        if (res.success) {
          setMaterials(prev => [res.material, ...prev]);
          setSubjects(prev => prev.map(s => s.id === payload.subject_id ? { ...s, material_count: (s.material_count || 0) + 1 } : s));
          showToast('Study material saved!');
          setMaterialModal({ isOpen: false, mode: 'create', material: null });
        }
      } else {
        const res = await api.updateStudyMaterial(materialModal.material.id, {
          title: materialForm.title.trim(),
          description: materialForm.description,
          subject_id: parseInt(materialForm.subject_id, 10),
          external_url: materialForm.external_url,
          tags: materialForm.tags
        });

        if (res.success) {
          setMaterials(prev => prev.map(m => m.id === res.material.id ? res.material : m));
          showToast('Material updated successfully!');
          setMaterialModal({ isOpen: false, mode: 'edit', material: null });
        }
      }
    } catch (err) {
      showToast(err.message || 'Error saving material', 'error');
    }
  };

  const toggleFavorite = async (mat, e) => {
    e.stopPropagation();
    try {
      const res = await api.toggleStudyMaterialFavorite(mat.id);
      if (res.success) {
        setMaterials(prev => prev.map(m => m.id === mat.id ? { ...m, is_favorite: res.is_favorite } : m));
        showToast(res.message);
      }
    } catch (err) {
      showToast('Could not update favorite', 'error');
    }
  };

  // PREVIEW & OPEN HANDLER
  const handleOpenMaterial = (mat) => {
    const fullUrl = mat.file_url 
      ? (mat.file_url.startsWith('http') ? mat.file_url : `${API_BASE.replace('/api', '')}${mat.file_url}`)
      : mat.external_url;

    if (!fullUrl) {
      showToast('No URL available for this material', 'error');
      return;
    }

    if (mat.material_type === 'video') {
      setMediaPreview({
        type: 'video',
        url: fullUrl,
        isYouTube: /youtube\.com|youtu\.be/.test(fullUrl),
        title: mat.title
      });
    } else if (mat.material_type === 'audio') {
      setMediaPreview({
        type: 'audio',
        url: fullUrl,
        title: mat.title
      });
    } else if (mat.material_type === 'pdf') {
      setMediaPreview({
        type: 'pdf',
        url: fullUrl,
        title: mat.title
      });
    } else {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  // FILTER LOGIC
  const filteredMaterials = materials.filter(m => {
    if (activeSubjectId !== 'all' && m.subject_id !== Number(activeSubjectId)) {
      return false;
    }

    if (activeTypeTab === 'favorite' && !m.is_favorite) return false;
    if (activeTypeTab === 'pdf' && m.material_type !== 'pdf' && m.material_type !== 'document') return false;
    if (activeTypeTab === 'video' && m.material_type !== 'video') return false;
    if (activeTypeTab === 'audio' && m.material_type !== 'audio') return false;
    if (activeTypeTab === 'link' && m.material_type !== 'link') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (m.title || '').toLowerCase().includes(q);
      const matchDesc = (m.description || '').toLowerCase().includes(q);
      const matchSub = (m.subject_name || '').toLowerCase().includes(q);
      const matchFile = (m.file_name || '').toLowerCase().includes(q);
      const matchTags = (m.tags || '').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchSub || matchFile || matchTags;
    }

    return true;
  });

  const activeSubject = subjects.find(s => s.id === Number(activeSubjectId));

  const countPdfs = materials.filter(m => m.material_type === 'pdf' || m.material_type === 'document').length;
  const countVideos = materials.filter(m => m.material_type === 'video').length;
  const countAudios = materials.filter(m => m.material_type === 'audio').length;
  const countLinks = materials.filter(m => m.material_type === 'link').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-xs font-medium text-white ${toastMsg.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          {toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toastMsg.text}
        </div>
      )}

      {/* Header Banner - Clean Simple Font */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Study Hub
            </div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Study Hub & Notes Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Manage custom subjects, store handwritten notes, lecture videos, audios, and web resources.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={openAddSubject}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              Add Subject
            </button>

            <button
              onClick={() => openAddMaterial(activeSubjectId)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Material
            </button>
          </div>
        </div>

        {/* Quick Material Stats - Simple & Clean */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{countPdfs}</p>
              <p className="text-xs text-slate-500 font-normal">PDFs & Notes</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{countVideos}</p>
              <p className="text-xs text-slate-500 font-normal">Video Lectures</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{countAudios}</p>
              <p className="text-xs text-slate-500 font-normal">Audio Notes</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{countLinks}</p>
              <p className="text-xs text-slate-500 font-normal">Online Links</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Subjects (Left) + Materials Library (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Subjects Sidebar & Storage */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Subjects Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-indigo-600" />
                Subjects ({subjects.length})
              </h3>
              <button
                onClick={openAddSubject}
                className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                title="Add New Subject"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[260px] lg:max-h-[420px] overflow-y-auto pr-1">
              {/* All Subjects Option */}
              <button
                onClick={() => setActiveSubjectId('all')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer ${
                  activeSubjectId === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeSubjectId === 'all' ? 'bg-white' : 'bg-slate-400'}`}></div>
                  <span>All Subjects</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeSubjectId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {materials.length}
                </span>
              </button>

              {/* Empty state when 0 subjects */}
              {subjects.length === 0 ? (
                <div className="py-6 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl my-2">
                  <Folder className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-slate-700">0 Subjects Added</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Create your first subject folder to begin.</p>
                  <button
                    onClick={openAddSubject}
                    className="mt-2.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium rounded-lg cursor-pointer"
                  >
                    + Add Subject
                  </button>
                </div>
              ) : (
                subjects.map(sub => {
                  const isSelected = activeSubjectId === sub.id;
                  const matCount = materials.filter(m => m.subject_id === sub.id).length;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setActiveSubjectId(sub.id)}
                      className={`group relative w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                        <div className="truncate">
                          <p className="truncate font-medium">{sub.name}</p>
                          {sub.code && (
                            <p className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {sub.code} • Sem {sub.semester || 6}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {matCount}
                        </span>

                        <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={(e) => openEditSubject(sub, e)}
                            className={`p-1 rounded-md ${
                              isSelected ? 'text-white hover:bg-white/20' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                            title="Edit Subject"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => confirmDeleteSubject(sub, e)}
                            className={`p-1 rounded-md ${
                              isSelected ? 'text-white hover:bg-white/20' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Delete Subject"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={openAddSubject}
              className="w-full mt-3 py-2 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Subject Folder</span>
            </button>
          </div>

          {/* Storage Meter - Clean Simple Font */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-600" /> Storage Usage
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 text-[11px] font-medium">
                1 GB Free Tier
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-800">{storageInfo.usedMb}</span>
              <span className="text-xs text-slate-500 font-normal">MB used of {storageInfo.totalMb} MB</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, Math.max(2, (storageInfo.usedMb / storageInfo.totalMb) * 100))}%` }}
              ></div>
            </div>

            <p className="text-[11px] text-slate-500 font-normal leading-normal">
              Stored notes, audio lectures, and video clips stream directly in your browser.
            </p>
          </div>
        </div>

        {/* Right Column: Study Materials Explorer */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 min-h-[560px] flex flex-col shadow-sm">
            
            {/* Top Toolbar: Search & View Tabs */}
            <div className="space-y-3.5 mb-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>{activeSubjectId === 'all' ? 'All Resources & Materials' : (activeSubject?.name || 'Subject Materials')}</span>
                    {activeSubject?.code && (
                      <span className="text-xs font-normal px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {activeSubject.code}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 font-normal">
                    {filteredMaterials.length} item(s) found
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search titles, tags, notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 w-full sm:w-56"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Media Type Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
                {[
                  { id: 'all', label: 'All', icon: Sparkles },
                  { id: 'pdf', label: `PDFs & Docs (${countPdfs})`, icon: FileText },
                  { id: 'video', label: `Videos (${countVideos})`, icon: Video },
                  { id: 'audio', label: `Audios (${countAudios})`, icon: Music },
                  { id: 'link', label: `Links (${countLinks})`, icon: Link2 },
                  { id: 'favorite', label: 'Pinned ⭐', icon: Star }
                ].map(tab => {
                  const isActive = activeTypeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTypeTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Materials List / Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600" />
                  <p className="text-xs font-normal">Loading materials...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mb-2">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">No study materials found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-0.5 mb-3 font-normal">
                    {subjects.length === 0 
                      ? 'Create a subject folder first, then start uploading notes, audio recordings, or video clips.'
                      : 'Upload handwritten notes, lecture recordings, formula PDFs, or save tutorial links.'}
                  </p>
                  <button
                    onClick={() => subjects.length === 0 ? openAddSubject() : openAddMaterial(activeSubjectId)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> {subjects.length === 0 ? 'Create Subject First' : 'Add Material Now'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredMaterials.map(mat => {
                    const isPdf = mat.material_type === 'pdf' || mat.material_type === 'document';
                    const isVideo = mat.material_type === 'video';
                    const isAudio = mat.material_type === 'audio';
                    const isLink = mat.material_type === 'link';

                    return (
                      <div
                        key={mat.id}
                        className={`group relative p-4 rounded-xl border flex flex-col justify-between bg-white ${
                          mat.is_favorite ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2.5 mb-1.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isPdf ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                isVideo ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                                isAudio ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                'bg-sky-50 text-sky-600 border border-sky-200'
                              }`}>
                                {isPdf && <FileText className="w-4 h-4" />}
                                {isVideo && <Video className="w-4 h-4" />}
                                {isAudio && <Music className="w-4 h-4" />}
                                {isLink && <Link2 className="w-4 h-4" />}
                              </div>

                              <div className="min-w-0">
                                <span className="inline-block text-[10px] font-medium text-indigo-600">
                                  {mat.subject_name || 'General'}
                                </span>
                                <h4
                                  onClick={() => handleOpenMaterial(mat)}
                                  className="text-xs font-semibold text-slate-800 truncate hover:text-indigo-600 cursor-pointer"
                                  title={mat.title}
                                >
                                  {mat.title}
                                </h4>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(mat, e)}
                              className={`p-1 rounded cursor-pointer ${
                                mat.is_favorite 
                                  ? 'text-amber-500 bg-amber-50' 
                                  : 'text-slate-300 hover:text-amber-500'
                              }`}
                              title={mat.is_favorite ? 'Unpin' : 'Pin to Favorites'}
                            >
                              <Star className={`w-4 h-4 ${mat.is_favorite ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>

                          {mat.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-2 font-normal leading-normal">
                              {mat.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {mat.file_size || 'Resource'}
                            </span>

                            {mat.tags && mat.tags.split(',').map((t, idx) => (
                              <span key={idx} className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => handleOpenMaterial(mat)}
                            className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer bg-slate-800 text-white hover:bg-indigo-600"
                          >
                            {isVideo ? <Play className="w-3 h-3 fill-white" /> :
                             isAudio ? <Volume2 className="w-3 h-3" /> :
                             isLink ? <ExternalLink className="w-3 h-3" /> :
                             <Eye className="w-3 h-3" />}
                            <span>{isVideo ? 'Play Video' : isAudio ? 'Listen' : isLink ? 'Open Link' : 'View'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditMaterial(mat)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                              title="Edit Material Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, type: 'material', id: mat.id, title: mat.title })}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete Material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT SUBJECT - SIMPLE FONT */}
      {/* ========================================================================= */}
      {subjectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800">{subjectModal.mode === 'create' ? 'Create Subject Folder' : 'Edit Subject'}</h3>
                  <p className="text-[11px] text-slate-400 font-normal">Organize your course notes</p>
                </div>
              </div>
              <button
                onClick={() => setSubjectModal({ isOpen: false, mode: 'create', subject: null })}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-4 space-y-3 text-xs font-normal">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Subject Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS302"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 uppercase focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Semester</label>
                  <select
                    value={subjectForm.semester}
                    onChange={(e) => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Color Tag</label>
                <div className="flex items-center gap-2 pt-0.5">
                  {COLOR_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSubjectForm({ ...subjectForm, color: theme.id })}
                      className={`w-5 h-5 rounded-full cursor-pointer ${theme.activeBg} ${
                        subjectForm.color === theme.id ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={theme.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Concurrency, memory management, and lab exercises"
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubjectModal({ isOpen: false, mode: 'create', subject: null })}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm cursor-pointer"
                >
                  {subjectModal.mode === 'create' ? 'Create Subject' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT MATERIAL - SIMPLE FONT */}
      {/* ========================================================================= */}
      {materialModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800">
                    {materialModal.mode === 'create' ? 'Add Study Material' : 'Edit Material Details'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-normal">PDFs, Videos, Audios, or Web Links</p>
                </div>
              </div>
              <button
                onClick={() => setMaterialModal({ isOpen: false, mode: 'create', material: null })}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-4 space-y-3 text-xs font-normal">
              
              {materialModal.mode === 'create' && (
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMaterialUploadMode('file')}
                    className={`flex-1 py-1 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                      materialUploadMode === 'file' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File (PDF/Video/Audio)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialUploadMode('link')}
                    className={`flex-1 py-1 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                      materialUploadMode === 'link' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Web Link / YouTube URL
                  </button>
                </div>
              )}

              {materialModal.mode === 'create' && materialUploadMode === 'file' && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.webm,.mkv,.mov,.mp3,.wav,.m4a"
                  />

                  {uploadedFileDetails ? (
                    <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 truncate max-w-[220px]">{uploadedFileDetails.fileName}</p>
                          <p className="text-[10px] text-slate-500">{uploadedFileDetails.size} • {uploadedFileDetails.type.toUpperCase()}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
                    >
                      {uploadingFile ? (
                        <>
                          <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                          <p className="font-medium text-slate-700">Uploading file...</p>
                        </>
                      ) : (
                        <>
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">Click to select file</p>
                            <p className="text-[10px] text-slate-400">PDFs, Videos, Audios (Max 100MB)</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {materialUploadMode === 'link' && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Resource Link / URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=... or https://..."
                      value={materialForm.external_url}
                      onChange={(e) => setMaterialForm({ ...materialForm, external_url: e.target.value })}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600"
                      required={materialUploadMode === 'link'}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Subject Folder <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={materialForm.subject_id}
                    onChange={(e) => setMaterialForm({ ...materialForm, subject_id: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600"
                    required
                  >
                    <option value="">Select Subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code || 'Gen'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 2, PYQs, Formula"
                    value={materialForm.tags}
                    onChange={(e) => setMaterialForm({ ...materialForm, tags: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Title / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Trees and AVL Balancing Notes"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Summary / Quick Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key concepts or important exam questions covered..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMaterialModal({ isOpen: false, mode: 'create', material: null })}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {materialModal.mode === 'create' ? 'Save Material' : 'Update Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: IN-BROWSER MEDIA PLAYER & VIEWER */}
      {/* ========================================================================= */}
      {mediaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3.5 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  {mediaPreview.type === 'video' ? <Video className="w-3.5 h-3.5" /> :
                   mediaPreview.type === 'audio' ? <Music className="w-3.5 h-3.5" /> :
                   <FileText className="w-3.5 h-3.5" />}
                </div>
                <h3 className="font-semibold text-xs sm:text-sm text-white truncate max-w-md">{mediaPreview.title}</h3>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={mediaPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  title="Open in Full Window"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setMediaPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center p-3 overflow-hidden">
              {mediaPreview.type === 'video' && (
                mediaPreview.isYouTube ? (
                  <iframe
                    src={getYouTubeEmbedUrl(mediaPreview.url)}
                    title={mediaPreview.title}
                    className="w-full aspect-video rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={mediaPreview.url}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-auto max-w-full rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                )
              )}

              {mediaPreview.type === 'audio' && (
                <div className="w-full max-w-lg p-5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{mediaPreview.title}</h4>
                    <p className="text-xs text-slate-400 font-normal">Audio Lecture / Voice Note</p>
                  </div>
                  <audio
                    src={mediaPreview.url}
                    controls
                    autoPlay
                    className="w-full"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {mediaPreview.type === 'pdf' && (
                <iframe
                  src={mediaPreview.url}
                  title={mediaPreview.title}
                  className="w-full h-[75vh] rounded-lg bg-white border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION - SIMPLE FONT */}
      {/* ========================================================================= */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-sm p-4 text-center space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Are you sure you want to remove <span className="font-semibold text-slate-700">"{deleteConfirm.title}"</span>?
                {deleteConfirm.type === 'subject' && ' All files stored inside this subject folder will also be removed.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, type: '', id: null, title: '' })}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
