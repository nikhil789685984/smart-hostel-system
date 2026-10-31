import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  UtensilsCrossed,
  Star,
  CheckCircle2,
  Calendar,
  Sparkles,
  Heart,
  MessageSquare,
  ShieldCheck,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Clock,
  Flame,
  Award,
  Leaf,
  Check,
  ChevronRight
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudentMess() {
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [loading, setLoading] = useState(true);

  // Feedback modal
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    meal_type: 'Dinner',
    rating: 5,
    taste_rating: 5,
    quality_rating: 5,
    cleanliness_rating: 5,
    comments: '',
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Absence/Rebate states
  const [myAbsences, setMyAbsences] = useState([]);
  const [totalRebate, setTotalRebate] = useState(0);
  const [absenceDate, setAbsenceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [absenceReason, setAbsenceReason] = useState('Personal / Dining Out');
  const [togglingMeal, setTogglingMeal] = useState(null);

  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [absenceStep, setAbsenceStep] = useState(1);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [absenceAgreement, setAbsenceAgreement] = useState(false);

  const fetchMessData = async () => {
    try {
      const [todayRes, weeklyRes, analyticsRes, absencesRes] = await Promise.all([
        api.getTodayMessMenu(),
        api.getWeeklyMessMenu(),
        api.getMessAnalytics(),
        api.getMyMealAbsences().catch(() => ({ absences: [], totalRebate: 0 })),
      ]);
      setTodayData(todayRes);
      setWeeklyMenu(weeklyRes.menus || []);
      setAnalytics(analyticsRes.analytics);
      setMyAbsences(absencesRes.absences || []);
      setTotalRebate(absencesRes.totalRebate || 0);
      if (todayRes?.day) {
        setSelectedDay(todayRes.day);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initiateAbsence = (mealType, isAbsent, dateToCancel = absenceDate) => {
    if (isAbsent) {
      // Direct cancel
      handleToggleAbsence(mealType, dateToCancel, 'Cancellation');
    } else {
      setSelectedMealType(mealType);
      setAbsenceStep(1);
      setAbsenceAgreement(false);
      setAbsenceModalOpen(true);
    }
  };

  const handleToggleAbsence = async (mealType, dateStr = absenceDate, reasonStr = absenceReason) => {
    setTogglingMeal(mealType);
    try {
      const res = await api.toggleMealAbsence({
        meal_type: mealType,
        date: dateStr,
        reason: reasonStr,
      });
      setFeedbackMsg(res.message);
      // Refresh absences list
      const updated = await api.getMyMealAbsences();
      setMyAbsences(updated.absences || []);
      setTotalRebate(updated.totalRebate || 0);
      setAbsenceModalOpen(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Error updating meal absence');
    } finally {
      setTogglingMeal(null);
    }
  };

  useEffect(() => {
    fetchMessData();
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.submitMessFeedback(feedbackForm);
      setFeedbackMsg('Thank you! Your feedback has been forwarded to the Mess Committee.');
      setFeedbackOpen(false);
      fetchMessData();
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Error submitting feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const currentDayMenu = weeklyMenu.find(m => m.day_of_week === selectedDay) || (todayData?.menu || {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/20 flex items-center gap-1.5">
              <Leaf className="w-3 h-3 text-emerald-300" />
              FSSAI Certified Institutional Kitchen
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Campus Mess & Dining Hub</h1>
          <p className="text-xs text-orange-100 mt-1 max-w-xl">
            Revolving 7-day culinary menu, live dietary nutrition indicators, and student-powered quality rating committee.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setFeedbackOpen(true)}
          className="relative z-10 px-5 py-3 rounded-2xl bg-white text-orange-700 hover:bg-orange-50 text-xs font-black shadow-lg shadow-black/10 transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>Rate Today's Meal</span>
        </motion.button>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mess Rating Summary Banner */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <span className="text-2xl font-black leading-none">{analytics.avgRating}</span>
              <span className="text-[9px] font-bold text-amber-100 uppercase tracking-wider mt-0.5">/ 5.0</span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(analytics.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">Audit Score</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Calculated from <strong className="text-slate-800">{analytics.totalFeedbackCount}</strong> verified hostel resident meal logs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center w-full md:w-auto shrink-0">
            <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Taste Index</span>
              <p className="text-base font-black text-slate-900 mt-0.5">{analytics.avgTaste} <span className="text-xs text-slate-400 font-normal">/ 5</span></p>
            </div>
            <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Hygiene & Prep</span>
              <p className="text-base font-black text-slate-900 mt-0.5">{analytics.avgQuality} <span className="text-xs text-slate-400 font-normal">/ 5</span></p>
            </div>
            <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Dining Cleanliness</span>
              <p className="text-base font-black text-slate-900 mt-0.5">{analytics.avgCleanliness} <span className="text-xs text-slate-400 font-normal">/ 5</span></p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Day Selector Tabs with Animated Sliding Pill */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {DAYS.map((day) => {
          const isToday = todayData?.day === day;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`relative px-4 py-2.5 rounded-2xl transition flex items-center gap-2 whitespace-nowrap text-xs font-bold ${
                isSelected
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeMessDayPill"
                  className="absolute inset-0 bg-slate-900 rounded-2xl shadow-md -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span>{day}</span>
              {isToday && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Breakfast */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Breakfast</h4>
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" /> 07:30 AM - 09:00 AM
                </span>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Meal Active
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 leading-relaxed min-h-[40px]">
            {currentDayMenu.breakfast || 'Masala Dosa, Sambar, Coconut Chutney, Boiled Eggs / Banana, Tea & Filter Coffee'}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> ~480 kcal
            </span>
            <span className="font-semibold text-slate-700">18g Protein • Pure Veg Available</span>
          </div>
        </motion.div>

        {/* Lunch */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Lunch</h4>
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" /> 12:30 PM - 02:00 PM
                </span>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Full Meal
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 leading-relaxed min-h-[40px]">
            {currentDayMenu.lunch || 'Rajma Masala, Steamed Basmati Rice, Butter Phulka Roti, Mix Veg Raita, Fresh Green Salad'}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> ~650 kcal
            </span>
            <span className="font-semibold text-slate-700">24g Protein • Unlimited Buffet</span>
          </div>
        </motion.div>

        {/* Evening Snacks */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center border border-yellow-100">
                <Sunset className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">High Tea & Snacks</h4>
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" /> 05:00 PM - 06:00 PM
                </span>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Beverage + Snack
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 leading-relaxed min-h-[40px]">
            {currentDayMenu.snacks || 'Crispy Vegetable Cutlet / Samosa, Mint Chutney, Adrak Masala Chai / Cold Coffee'}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> ~280 kcal
            </span>
            <span className="font-semibold text-slate-700">Freshly Fried / Baked</span>
          </div>
        </motion.div>

        {/* Dinner */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-6 border border-blue-200 shadow-sm space-y-3 bg-gradient-to-br from-white to-blue-50/30 relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Grand Dinner</h4>
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" /> 07:30 PM - 09:30 PM
                </span>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              Chef Special
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 leading-relaxed min-h-[40px]">
            {currentDayMenu.dinner || 'Shahi Paneer Butter Masala, Dal Makhani, Hot Tawa Phulka, Jeera Rice, Gulab Jamun'}
          </p>
          {currentDayMenu.special_item && (
            <div className="mt-2 pt-2.5 border-t border-blue-100 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Sweet Delight:
              </span>
              <span className="text-xs font-black text-slate-900 bg-amber-100/60 px-2.5 py-0.5 rounded-lg border border-amber-200">
                {currentDayMenu.special_item}
              </span>
            </div>
          )}
        </motion.div>

      </div>

      {/* Smart Meal Attendance & Zero-Waste Rebate Hub */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-slate-700/60 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Leaf className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-black tracking-tight">Zero-Waste Meal Attendance & Rebate Planner</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Dining out, fasting, or traveling on gate pass? Mark your meal absence in advance.
              The kitchen adjusts cooking quantities to eliminate food waste, and <strong className="text-emerald-400">up to ₹65/meal</strong> is credited to your hostel fee ledger!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 flex items-center gap-3 shrink-0">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">Total Rebate Earned</span>
              <span className="text-xl font-black text-emerald-400">₹{totalRebate.toLocaleString()}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-xs">
              ✓
            </div>
          </div>
        </div>

        {/* Removed Date and Reason Controls - Moved to Verification Modal */}

        {/* 3 Meals Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              meal: 'Breakfast',
              time: '07:30 AM - 09:30 AM',
              rebate: 40,
              icon: Coffee,
              color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30'
            },
            {
              meal: 'Lunch',
              time: '12:30 PM - 02:30 PM',
              rebate: 65,
              icon: Sun,
              color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30'
            },
            {
              meal: 'Dinner',
              time: '07:45 PM - 09:45 PM',
              rebate: 65,
              icon: Moon,
              color: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30'
            },
          ].map((item) => {
            const isAbsent = myAbsences.some(
              (a) => a.date === absenceDate && a.meal_type === item.meal
            );
            const Icon = item.icon;
            const isPending = togglingMeal === item.meal;

            return (
              <div
                key={item.meal}
                className={`p-5 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between gap-4 ${
                  isAbsent
                    ? 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-white/10 text-amber-300">
                        <Icon className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-black">{item.meal}</h4>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      isAbsent 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {isAbsent ? 'Skipped / Absent' : 'Attending'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {item.time}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-300">
                    <span>Rebate Benefit:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">
                      +₹{item.rebate}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => initiateAbsence(item.meal, isAbsent)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                    isPending
                      ? 'opacity-50 cursor-wait bg-slate-700 text-white'
                      : isAbsent
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
                      : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/20'
                  }`}
                >
                  {isPending ? (
                    'Updating Headcount...'
                  ) : isAbsent ? (
                    <>
                      <span>Restore Plate (Cancel Absence)</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Mark Absent & Claim ₹{item.rebate}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Student's Logged Absences History */}
        {myAbsences.length > 0 && (
          <div className="border-t border-white/10 pt-4 space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Your Registered Meal Absences & Fee Ledger Rebates ({myAbsences.length})
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Meal</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3 text-right">Rebate Credited</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {myAbsences.slice(0, 5).map((a) => (
                    <tr key={a.id} className="hover:bg-white/5 transition">
                      <td className="py-2 px-3 text-white font-bold">{a.date}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                          {a.meal_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">{a.reason}</td>
                      <td className="py-2 px-3 text-right font-black text-emerald-400">
                        +₹{a.rebate_amount || 65}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => initiateAbsence(a.meal_type, true, a.date)}
                          className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Mess Rating Modal */}
      <Modal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="Submit Dining Feedback"
        subtitle="Your ratings directly affect mess contractor quality evaluation"
      >
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Select Meal
            </label>
            <select
              value={feedbackForm.meal_type}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, meal_type: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-bold"
            >
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Snacks</option>
              <option>Dinner</option>
            </select>
          </div>

          {/* Interactive Star Rating Rows */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Overall Meal Experience:</span>
                <span className="text-xs font-black text-amber-600">{feedbackForm.rating} / 5 Stars</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                    className="p-1 text-slate-300 hover:text-amber-400 transition transform hover:scale-125"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= feedbackForm.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Taste & Flavor Profile:</span>
                <span className="text-xs font-black text-amber-600">{feedbackForm.taste_rating} / 5</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, taste_rating: star })}
                    className="p-1 text-slate-300 hover:text-amber-400 transition transform hover:scale-125"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= feedbackForm.taste_rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Hygiene & Cutlery Cleanliness:</span>
                <span className="text-xs font-black text-amber-600">{feedbackForm.cleanliness_rating} / 5</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, cleanliness_rating: star })}
                    className="p-1 text-slate-300 hover:text-amber-400 transition transform hover:scale-125"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= feedbackForm.cleanliness_rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Food Quality Comments / Suggestions
            </label>
            <textarea
              rows={3}
              value={feedbackForm.comments}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
              placeholder="e.g. Sambar was hot and flavorful. Please ensure rotis are served softer during peak rush."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-600 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFeedbackOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingFeedback}
              className="px-5 py-2.5 text-xs font-black bg-orange-600 text-white rounded-xl hover:bg-orange-700 shadow-md shadow-orange-500/25 transition"
            >
              {submittingFeedback ? 'Transmitting Rating...' : 'Submit Audit Feedback'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Multi-Step Meal Absence Verification Modal */}
      <Modal
        isOpen={absenceModalOpen}
        onClose={() => setAbsenceModalOpen(false)}
        title="Meal Absence Verification"
        subtitle={`Opting out of ${selectedMealType}`}
      >
        <div className="space-y-5">
          {absenceStep === 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Step 1: Select Date</h4>
                  <p className="text-[10px] text-blue-700 mt-1">Please confirm the date you will be absent for this meal.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Absence</label>
                <input
                  type="date"
                  value={absenceDate}
                  onChange={(e) => setAbsenceDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAbsenceStep(2)}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Next Step &rarr;
                </button>
              </div>
            </motion.div>
          )}

          {absenceStep === 2 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Step 2: Provide Reason</h4>
                  <p className="text-[10px] text-amber-700 mt-1">Warden tracking requires a valid reason for missing hostel meals.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Absence Reason</label>
                <select
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option>Personal / Dining Out with Friends</option>
                  <option>Traveling Home / Approved Gate Pass Leave</option>
                  <option>Academic Lab / Late Night Hackathon</option>
                  <option>Religious Fasting / Personal Observance</option>
                  <option>Medical Health Rest / Infirmary Diet</option>
                </select>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setAbsenceStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={() => setAbsenceStep(3)}
                  className="px-5 py-2 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600"
                >
                  Proceed to Final Verification &rarr;
                </button>
              </div>
            </motion.div>
          )}

          {absenceStep === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-black text-emerald-900">Final Verification</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  You are marking an absence for <strong>{selectedMealType}</strong> on <strong>{absenceDate}</strong>.
                </p>
                <div className="mt-3 inline-block bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-800">
                  Estimated Rebate: +₹65
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input 
                  type="checkbox" 
                  checked={absenceAgreement}
                  onChange={(e) => setAbsenceAgreement(e.target.checked)}
                  className="mt-0.5" 
                />
                <span className="text-xs text-slate-600">
                  I confirm that I will not be consuming the hostel {selectedMealType?.toLowerCase()} on this date. 
                  I understand that false claims may lead to disciplinary fines.
                </span>
              </label>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setAbsenceStep(2)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  disabled={!absenceAgreement || togglingMeal}
                  onClick={() => handleToggleAbsence(selectedMealType)}
                  className={`px-5 py-2 text-xs font-black text-white rounded-xl shadow-md transition ${
                    absenceAgreement && !togglingMeal
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {togglingMeal ? 'Processing...' : 'Confirm & Claim Rebate'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </Modal>

    </motion.div>
  );
}
