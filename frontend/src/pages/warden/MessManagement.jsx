import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  UtensilsCrossed,
  Edit2,
  CheckCircle2,
  Star,
  Sparkles,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Users,
  Search,
  Printer,
  Calendar,
  AlertCircle,
  Phone,
  Building,
  Check,
  ChefHat,
  Filter,
  ArrowRight
} from 'lucide-react';

export default function MessManagement() {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'menu'
  
  // Weekly Menu states
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [editForm, setEditForm] = useState({
    day_of_week: 'Monday',
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: '',
    special_item: '',
    dietary_tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Kitchen Roster states (Operational Absenteeism)
  const [rosterDate, setRosterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mealFilter, setMealFilter] = useState('All');
  const [blockFilter, setBlockFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [rosterData, setRosterData] = useState({
    headcount: {
      Breakfast: { absent: 0, attending: 115 },
      Lunch: { absent: 0, attending: 115 },
      Dinner: { absent: 0, attending: 115 },
    },
    absentStudents: [],
    totalStudents: 115,
    availableBlocks: []
  });
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const loadMenuData = async () => {
    try {
      const [menuRes, analyticsRes] = await Promise.all([
        api.getWeeklyMessMenu(),
        api.getMessAnalytics(),
      ]);
      setWeeklyMenu(menuRes.menus || []);
      setAnalytics(analyticsRes.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRosterData = async () => {
    setLoadingRoster(true);
    try {
      const res = await api.getWardenMessRoster({
        date: rosterDate,
        meal: mealFilter,
        block: blockFilter
      });
      setRosterData(res);
    } catch (err) {
      console.error('Error fetching mess roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  useEffect(() => {
    loadRosterData();
  }, [rosterDate, mealFilter, blockFilter]);

  const openEditModal = (menu) => {
    setEditingDay(menu);
    setEditForm({
      day_of_week: menu.day_of_week,
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      snacks: menu.snacks,
      dinner: menu.dinner,
      special_item: menu.special_item || '',
      dietary_tags: menu.dietary_tags || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMessMenu(editForm);
      setMsg(`Weekly menu for ${editForm.day_of_week} updated successfully.`);
      setEditModalOpen(false);
      loadMenuData();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Error updating menu');
    } finally {
      setSaving(false);
    }
  };

  const filteredAbsentStudents = (rosterData.absentStudents || []).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.student_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.room_number?.toLowerCase().includes(q) ||
      s.block_name?.toLowerCase().includes(q)
    );
  });

  const { headcount = {}, totalStudents = 115 } = rosterData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-purple-200 border border-white/20 flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-purple-300" />
              Kitchen Operations & Mess Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Hostel Mess Oversight & Kitchen Roster</h1>
          <p className="text-xs text-purple-200 mt-1 max-w-xl">
            Live student meal headcount, breakfast/lunch/dinner absence roster, and contractor weekly menu scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => setPrintModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white text-purple-900 hover:bg-purple-50 text-xs font-black shadow-lg transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-purple-700" />
            <span>Print Chef Cook Sheet</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daily Kitchen Roster & Absences</span>
          {rosterData.absentStudents?.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-black">
              {rosterData.absentStudents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'menu'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Weekly Menu Schedule & Feedback</span>
        </button>
      </div>

      {/* TAB 1: KITCHEN ROSTER & ABSENTEEISM */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Controls Strip: Date & Filters */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-black text-slate-700">Date:</span>
                <input
                  type="date"
                  value={rosterDate}
                  onChange={(e) => setRosterDate(e.target.value)}
                  className="bg-transparent text-xs font-black text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRosterDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-black hover:bg-purple-100 transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    setRosterDate(tmrw.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-slate-200 transition"
                >
                  Tomorrow
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Block Filter */}
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <select
                  value={blockFilter}
                  onChange={(e) => setBlockFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800"
                >
                  <option value="All">All Hostel Blocks</option>
                  {(rosterData.availableBlocks || []).map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 w-48 sm:w-56 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* 3 Live Headcount Cards for Chief Chef */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Breakfast Card */}
            <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Coffee className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Breakfast Headcount</h3>
                    <span className="text-[10px] font-bold text-slate-400">07:30 AM - 09:30 AM</span>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {headcount.Breakfast?.absent || 0} Skipped
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Plates to Cook</span>
                  <span className="text-3xl font-black text-amber-600">
                    {headcount.Breakfast?.attending || totalStudents}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1">/ {totalStudents}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMealFilter(mealFilter === 'Breakfast' ? 'All' : 'Breakfast')}
                  className={`text-xs font-black px-3 py-1.5 rounded-xl border transition ${
                    mealFilter === 'Breakfast'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {mealFilter === 'Breakfast' ? 'Showing List' : 'Filter Roster'}
                </button>
              </div>
            </div>

            {/* Lunch Card */}
            <div className="bg-white rounded-3xl p-5 border border-orange-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
                    <Sun className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Lunch Headcount</h3>
                    <span className="text-[10px] font-bold text-slate-400">12:30 PM - 02:30 PM</span>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {headcount.Lunch?.absent || 0} Skipped
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Plates to Cook</span>
                  <span className="text-3xl font-black text-orange-600">
                    {headcount.Lunch?.attending || totalStudents}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1">/ {totalStudents}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMealFilter(mealFilter === 'Lunch' ? 'All' : 'Lunch')}
                  className={`text-xs font-black px-3 py-1.5 rounded-xl border transition ${
                    mealFilter === 'Lunch'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  {mealFilter === 'Lunch' ? 'Showing List' : 'Filter Roster'}
                </button>
              </div>
            </div>

            {/* Dinner Card */}
            <div className="bg-white rounded-3xl p-5 border border-indigo-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Moon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Dinner Headcount</h3>
                    <span className="text-[10px] font-bold text-slate-400">07:45 PM - 09:45 PM</span>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {headcount.Dinner?.absent || 0} Skipped
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Plates to Cook</span>
                  <span className="text-3xl font-black text-indigo-600">
                    {headcount.Dinner?.attending || totalStudents}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1">/ {totalStudents}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMealFilter(mealFilter === 'Dinner' ? 'All' : 'Dinner')}
                  className={`text-xs font-black px-3 py-1.5 rounded-xl border transition ${
                    mealFilter === 'Dinner'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {mealFilter === 'Dinner' ? 'Showing List' : 'Filter Roster'}
                </button>
              </div>
            </div>
          </div>

          {/* Operational Student Absence Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Registered Absences & Dining Headcount Adjustments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredAbsentStudents.length} student(s) marked absent for {rosterDate}
                  {mealFilter !== 'All' ? ` (${mealFilter})` : ''}
                  {blockFilter !== 'All' ? ` in ${blockFilter}` : ''}.
                </p>
              </div>

              {mealFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => setMealFilter('All')}
                  className="text-xs font-bold text-purple-600 hover:underline self-start sm:self-auto"
                >
                  Reset Meal Filter
                </button>
              )}
            </div>

            {loadingRoster ? (
              <div className="p-12 text-center text-xs text-slate-400 font-bold">
                Synchronizing kitchen headcount roster...
              </div>
            ) : filteredAbsentStudents.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-black">
                  ✓
                </div>
                <h4 className="text-sm font-black text-slate-800">100% Student Dining Headcount</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No meal absences are registered for the selected filters on {rosterDate}. Cook plates at full capacity.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-black uppercase text-slate-500">
                      <th className="py-3 px-5">Student Resident</th>
                      <th className="py-3 px-4">Room & Block</th>
                      <th className="py-3 px-4">Skipped Meal</th>
                      <th className="py-3 px-4">Reason Recorded</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-5 text-right">Rebate Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredAbsentStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-purple-50/40 transition">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                              alt={s.student_name}
                              className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{s.student_name}</span>
                              <span className="text-[11px] text-slate-400 font-semibold">{s.roll_number}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">
                              {s.room_number ? `Room ${s.room_number}` : 'Unassigned'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {s.block_name || 'Campus Hostel'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                            s.meal_type === 'Breakfast'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : s.meal_type === 'Lunch'
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}>
                            {s.meal_type}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 font-semibold">
                          {s.reason || 'Personal / Dining Out'}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600">
                          {s.student_phone ? (
                            <a
                              href={`tel:${s.student_phone}`}
                              className="flex items-center gap-1.5 hover:text-purple-600 transition"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{s.student_phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-5 text-right font-black text-emerald-600">
                          +₹{s.rebate_amount || 65}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY MENU & RATINGS */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Analytics Highlights */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Overall Rating</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{analytics.avgRating} / 5.0</h3>
                <p className="text-xs text-slate-500 mt-1">{analytics.totalFeedbackCount} student reviews</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Taste Score</span>
                <h3 className="text-2xl font-black text-orange-600 mt-1">{analytics.avgTaste} / 5.0</h3>
                <p className="text-xs text-slate-500 mt-1">Flavor & seasoning</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Food Quality</span>
                <h3 className="text-2xl font-black text-blue-600 mt-1">{analytics.avgQuality} / 5.0</h3>
                <p className="text-xs text-slate-500 mt-1">Freshness of ingredients</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cleanliness</span>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{analytics.avgCleanliness} / 5.0</h3>
                <p className="text-xs text-slate-500 mt-1">Kitchen hygiene</p>
              </div>
            </div>
          )}

          {/* 7-Day Menu Schedule */}
          <div className="space-y-4">
            {weeklyMenu.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-black text-sm flex items-center justify-center">
                      {m.day_of_week.slice(0, 2)}
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{m.day_of_week}</h3>
                      <span className="text-xs text-slate-400 font-semibold">{m.dietary_tags || 'Veg / Non-Veg options'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(m)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Day's Menu
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                      <Coffee className="w-3 h-3 text-amber-500" /> Breakfast
                    </span>
                    <p className="font-semibold text-slate-700 leading-snug">{m.breakfast}</p>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                      <Sun className="w-3 h-3 text-orange-500" /> Lunch
                    </span>
                    <p className="font-semibold text-slate-700 leading-snug">{m.lunch}</p>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                      <Sunset className="w-3 h-3 text-rose-500" /> Evening Snacks
                    </span>
                    <p className="font-semibold text-slate-700 leading-snug">{m.snacks}</p>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                      <Moon className="w-3 h-3 text-indigo-500" /> Dinner
                    </span>
                    <p className="font-semibold text-slate-700 leading-snug">{m.dinner}</p>
                  </div>
                </div>

                {m.special_item && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Chef Special:
                    </span>
                    <span className="text-xs font-bold text-slate-800">{m.special_item}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Weekly Menu Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Update Culinary Menu: ${editingDay?.day_of_week}`}
        subtitle="Changes are immediately synchronized and broadcasted to all resident students"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Breakfast (07:30 - 09:30 AM) *
            </label>
            <input
              type="text"
              required
              value={editForm.breakfast}
              onChange={(e) => setEditForm({ ...editForm, breakfast: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Lunch (12:30 - 02:30 PM) *
            </label>
            <input
              type="text"
              required
              value={editForm.lunch}
              onChange={(e) => setEditForm({ ...editForm, lunch: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Evening Snacks (05:00 - 06:00 PM) *
            </label>
            <input
              type="text"
              required
              value={editForm.snacks}
              onChange={(e) => setEditForm({ ...editForm, snacks: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Dinner (07:45 - 09:45 PM) *
            </label>
            <input
              type="text"
              required
              value={editForm.dinner}
              onChange={(e) => setEditForm({ ...editForm, dinner: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Special Item / Dessert
              </label>
              <input
                type="text"
                placeholder="e.g. Gulab Jamun (2 pcs)"
                value={editForm.special_item}
                onChange={(e) => setEditForm({ ...editForm, special_item: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Dietary Tags
              </label>
              <input
                type="text"
                placeholder="e.g. Pure Veg, High-Protein"
                value={editForm.dietary_tags}
                onChange={(e) => setEditForm({ ...editForm, dietary_tags: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow transition"
            >
              {saving ? 'Saving...' : 'Save & Broadcast'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Chef Cook Sheet Printable Modal */}
      <Modal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Institutional Kitchen Headcount Sheet"
        subtitle={`Target plate counts for Chef & Catering Staff • Date: ${rosterDate}`}
      >
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
            <h4 className="text-xs font-black uppercase text-purple-900 mb-2">Kitchen Production Order</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-slate-400 block">Breakfast</span>
                <span className="text-xl font-black text-amber-600">{headcount.Breakfast?.attending || totalStudents}</span>
                <span className="text-[10px] text-slate-400 block">plates</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-slate-400 block">Lunch</span>
                <span className="text-xl font-black text-orange-600">{headcount.Lunch?.attending || totalStudents}</span>
                <span className="text-[10px] text-slate-400 block">plates</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-slate-400 block">Dinner</span>
                <span className="text-xl font-black text-indigo-600">{headcount.Dinner?.attending || totalStudents}</span>
                <span className="text-[10px] text-slate-400 block">plates</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold text-slate-700 mb-2">
              Skipped Meals Roster ({rosterData.absentStudents?.length || 0} students):
            </h5>
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {(rosterData.absentStudents || []).map((s) => (
                <div key={s.id} className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">{s.student_name} ({s.roll_number})</span>
                    <span className="text-[10px] text-slate-400">{s.room_number ? `Room ${s.room_number} • ${s.block_name}` : 'Unassigned'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                    {s.meal_type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPrintModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" /> Print Document
            </button>
          </div>
        </div>
      </Modal>

    </motion.div>
  );
}
