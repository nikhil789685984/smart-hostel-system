import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Users,
  Building,
  MapPin,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Filter,
  Search,
  BookOpen,
  Dumbbell,
  Laptop,
  Coffee,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  LayoutGrid,
  Map,
  Activity,
  Flame,
  MessageSquare,
  Compass,
  Check,
  Star
} from 'lucide-react';

export default function LiveNoiseHeatmap() {
  const [zones, setZones] = useState([]);
  const [activeCheckin, setActiveCheckin] = useState(null);
  const [recommendedZone, setRecommendedZone] = useState(null);
  const [liveStream, setLiveStream] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // View mode switcher: 'grid' vs 'floorplan'
  const [viewMode, setViewMode] = useState('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedFloor, setSelectedFloor] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Noise reporting modal
  const [reportingZone, setReportingZone] = useState(null);
  const [noiseRating, setNoiseRating] = useState('Silent');
  const [noiseComment, setNoiseComment] = useState('');

  // Zone details drawer modal
  const [selectedZoneDetail, setSelectedZoneDetail] = useState(null);

  const token = localStorage.getItem('token');

  const fetchZoneData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/zones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setZones(data.zones || []);
        setActiveCheckin(data.activeCheckin || null);
        setRecommendedZone(data.recommendedZone || null);
        setLiveStream(data.liveStream || []);
      } else {
        setError(data.message || 'Failed to load heatmap data.');
      }
    } catch (err) {
      setError('Network error connecting to live heatmap service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZoneData();
    const interval = setInterval(fetchZoneData, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const showFeedback = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCheckIn = async (zoneId) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/zones/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ zone_id: zoneId })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message);
        await fetchZoneData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to check in.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/zones/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message);
        await fetchZoneData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to check out.');
    } finally {
      setActionLoading(false);
    }
  };

  const submitNoiseReport = async () => {
    if (!reportingZone) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/zones/report-noise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          zone_id: reportingZone.id,
          noise_level: noiseRating,
          comment: noiseComment
        })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message);
        setReportingZone(null);
        setNoiseComment('');
        await fetchZoneData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to submit noise report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetZones = async () => {
    if (!window.confirm('Reset and re-seed 16 live study zones simulation data?')) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/zones/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Live zone heatmap reset successfully with 16 venues!');
        await fetchZoneData();
      }
    } catch (e) {
      alert('Reset failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper Category Icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Library': return <BookOpen className="w-5 h-5 text-indigo-600" />;
      case 'Study Hall': return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'Computer Lab': return <Laptop className="w-5 h-5 text-purple-600" />;
      case 'Gym': return <Dumbbell className="w-5 h-5 text-rose-600" />;
      case 'Lounge': return <Coffee className="w-5 h-5 text-amber-600" />;
      case 'Mess': return <Coffee className="w-5 h-5 text-emerald-600" />;
      default: return <Building className="w-5 h-5 text-slate-600" />;
    }
  };

  // Helper Noise Badge
  const getNoiseBadge = (noiseLevel) => {
    switch (noiseLevel) {
      case 'Silent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <VolumeX className="w-3.5 h-3.5 text-emerald-600" />
            Pin-Drop Silent
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Volume1 className="w-3.5 h-3.5 text-amber-600" />
            Moderate Activity
          </span>
        );
      case 'Loud':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <Volume2 className="w-3.5 h-3.5 text-rose-600" />
            High Activity / Loud
          </span>
        );
      default:
        return null;
    }
  };

  // Filtered Zones
  const filteredZones = zones.filter((z) => {
    const matchesQuery = z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.block.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (z.amenities && z.amenities.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBlock = selectedBlock === 'All' || z.block === selectedBlock;
    const matchesFloor = selectedFloor === 'All' || z.floor === selectedFloor;
    const matchesCategory = selectedCategory === 'All' || z.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || (
      selectedStatus === 'Silent' ? z.status_color === 'green' :
      selectedStatus === 'Moderate' ? z.status_color === 'yellow' :
      z.status_color === 'red'
    );
    return matchesQuery && matchesBlock && matchesFloor && matchesCategory && matchesStatus;
  });

  const totalOccupants = zones.reduce((sum, z) => sum + (z.live_occupancy || 0), 0);
  const totalCapacity = zones.reduce((sum, z) => sum + (z.capacity || 0), 0);
  const quietZonesCount = zones.filter(z => z.status_color === 'green').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-medium border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Real-Time Hostel Spatial Intelligence • 16 Venues Connected
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              🤫 Live Floor Noise & Study Zone Density Heatmap
            </h1>
            <p className="text-indigo-200/90 text-sm max-w-2xl">
              Check real-time quietness, seat availability, power outlets, and crowd density across all hostel floors and study pods before leaving your room.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchZoneData}
              disabled={loading || actionLoading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Live Spatial Data
            </button>
            <button
              onClick={handleResetZones}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600/80 text-white text-xs font-semibold border border-indigo-400/30 transition-all shadow-sm"
            >
              Re-seed 16 Campus Venues
            </button>
          </div>
        </div>

        {/* Key Spatial Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-indigo-200 text-xs font-medium block">Total Mapped Venues</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{zones.length} Study Zones</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-indigo-200 text-xs font-medium block">Quiet Spots Available</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{quietZonesCount} Silent Zones</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-indigo-200 text-xs font-medium block">Total Live Occupancy</span>
            <span className="text-xl font-bold text-amber-300 mt-0.5 block">{totalOccupants} / {totalCapacity} Seats ({Math.round((totalOccupants/totalCapacity)*100)}%)</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-indigo-200 text-xs font-medium block">Crowd Density Status</span>
            <span className="text-xl font-bold text-blue-300 mt-0.5 block">🟢 Optimal Study Hours</span>
          </div>
        </div>
      </div>

      {/* Live Activity Feed Ticker Stream */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md flex items-center gap-3 overflow-hidden border border-slate-800">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600/80 text-xs font-bold text-white shrink-0">
          <Activity className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Live Feed
        </div>
        <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none text-xs text-indigo-200">
          {liveStream.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <strong className="text-white">{item.user_name}</strong> {item.action} <span className="font-semibold text-amber-300">{item.zone}</span> <span className="text-slate-400">({item.time})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Alert Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Active Student Check-in Status Banner */}
      {activeCheckin && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider text-emerald-100">
                Current Active Resident Check-In
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Checked into: {activeCheckin.zone_name} ({activeCheckin.floor}, {activeCheckin.block})
              </h3>
            </div>
          </div>
          <button
            onClick={handleCheckOut}
            disabled={actionLoading}
            className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
          >
            <LogOut className="w-4 h-4 text-emerald-700" />
            Check Out of Zone
          </button>
        </div>
      )}

      {/* AI Smart Spot Recommendation Badge */}
      {recommendedZone && !activeCheckin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/80 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Recommended Quiet Spot Right Now
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                {recommendedZone.name} ({recommendedZone.floor}, {recommendedZone.block})
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Current Occupancy: <span className="font-semibold text-emerald-600">{recommendedZone.occupancy_percentage}%</span> ({recommendedZone.live_occupancy}/{recommendedZone.capacity} seats) • Status: <span className="font-semibold text-indigo-600">{recommendedZone.noise_level}</span> • {recommendedZone.operating_hours}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCheckIn(recommendedZone.id)}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all shrink-0 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Quick Check-In Now
          </button>
        </div>
      )}

      {/* Search & Filter Controls Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search zone, block, AC, Wi-Fi, 24/7..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* View Mode & Filters */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid Cards
              </button>
              <button
                onClick={() => setViewMode('floorplan')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'floorplan' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'hover:text-slate-900'
                }`}
              >
                <Map className="w-3.5 h-3.5" /> Architectural Map
              </button>
            </div>

            {/* Block Filter */}
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Blocks</option>
              <option value="Central Hub">Central Hub</option>
              <option value="Block A">Block A</option>
              <option value="Block B">Block B</option>
              <option value="Block C">Block C</option>
              <option value="Block D">Block D</option>
              <option value="Outdoor">Outdoor</option>
            </select>

            {/* Floor Filter */}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Floors</option>
              <option value="Ground Floor">Ground Floor</option>
              <option value="1st Floor">1st Floor</option>
              <option value="2nd Floor">2nd Floor</option>
              <option value="3rd Floor">3rd Floor</option>
              <option value="Terrace">Terrace Deck</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Categories</option>
              <option value="Library">Library</option>
              <option value="Study Hall">Study Pods</option>
              <option value="Computer Lab">Computer Labs</option>
              <option value="Lounge">Lounges</option>
              <option value="Gym">Gym & Fitness</option>
              <option value="Mess">Mess Alcove</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Noise Levels</option>
              <option value="Silent">🟢 Silent & Quiet</option>
              <option value="Moderate">🟡 Moderate Activity</option>
              <option value="Crowded">🔴 Crowded / Loud</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Grid View vs Architectural Blueprint Map View */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading live campus spatial noise heatmap...</p>
        </div>
      ) : filteredZones.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <Info className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">No zones match your selected filters.</h3>
          <p className="text-xs text-slate-500">Try adjusting your search term, floor, or block filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredZones.map((zone) => {
            const isUserHere = activeCheckin && activeCheckin.zone_id === zone.id;

            return (
              <div
                key={zone.id}
                className={`relative rounded-3xl p-5 border transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between space-y-4 bg-white ${
                  isUserHere
                    ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/20'
                    : zone.status_color === 'green'
                    ? 'border-emerald-200 hover:border-emerald-400'
                    : zone.status_color === 'yellow'
                    ? 'border-amber-200 hover:border-amber-400'
                    : 'border-rose-200 hover:border-rose-400'
                }`}
              >
                {/* Zone Top Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200">
                        {getCategoryIcon(zone.category)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          {zone.category} • {zone.block}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {zone.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Floor & Noise Badge */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      📍 {zone.floor}
                    </span>
                    {getNoiseBadge(zone.noise_level)}
                    {isUserHere && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                        ✓ Checked In
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 pt-1">
                    {zone.description || 'Quiet hostel facility for resident students.'}
                  </p>
                </div>

                {/* Amenities & Operating Hours */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{zone.operating_hours || '24/7 Open'}</span>
                  </div>
                  {zone.amenities && (
                    <div className="text-xs text-indigo-950 font-semibold bg-indigo-50/70 p-2 rounded-xl border border-indigo-100/80">
                      {zone.amenities}
                    </div>
                  )}
                </div>

                {/* Occupancy Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Live Density
                    </span>
                    <span className={`font-bold ${
                      zone.occupancy_percentage >= 75 ? 'text-rose-600' :
                      zone.occupancy_percentage >= 40 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {zone.live_occupancy} / {zone.capacity} Seats ({zone.occupancy_percentage}%)
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        zone.occupancy_percentage >= 75 ? 'bg-gradient-to-r from-amber-500 to-rose-600' :
                        zone.occupancy_percentage >= 40 ? 'bg-gradient-to-r from-emerald-500 to-amber-500' : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, zone.occupancy_percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {isUserHere ? (
                    <button
                      onClick={handleCheckOut}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition-all border border-slate-200"
                    >
                      Check Out
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(zone.id)}
                      disabled={actionLoading}
                      className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                        zone.occupancy_percentage >= 95
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Check In
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setReportingZone(zone);
                      setNoiseRating(zone.noise_level);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1"
                    title="Report Noise Feedback"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                    Feedback
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Architectural 2D Floorplan Blueprint View */
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" /> Architectural Campus Spatial Map
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Interactive Hostel Block Blueprint Layout
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Silent</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> Loud</span>
            </div>
          </div>

          {/* Spatial Grid Layout of Hostel Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Central Hub', 'Block A', 'Block B', 'Block C', 'Block D', 'Outdoor'].map((blockName) => {
              const blockZones = filteredZones.filter(z => z.block === blockName);
              if (blockZones.length === 0) return null;

              return (
                <div key={blockName} className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-400" /> {blockName}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {blockZones.length} Venues
                    </span>
                  </div>

                  <div className="space-y-3">
                    {blockZones.map((z) => (
                      <div
                        key={z.id}
                        onClick={() => setSelectedZoneDetail(z)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          z.status_color === 'green'
                            ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400'
                            : z.status_color === 'yellow'
                            ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400'
                            : 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {z.floor} • {z.category}
                          </span>
                          <h4 className="text-xs font-bold text-white leading-tight">
                            {z.name}
                          </h4>
                          <span className="text-[10px] text-slate-300 block">
                            {z.live_occupancy}/{z.capacity} seats ({z.occupancy_percentage}%)
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`w-3.5 h-3.5 rounded-full inline-block ${
                            z.status_color === 'green' ? 'bg-emerald-500 shadow-emerald-500/50 shadow-md' :
                            z.status_color === 'yellow' ? 'bg-amber-500 shadow-amber-500/50 shadow-md' : 'bg-rose-500 shadow-rose-500/50 shadow-md'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Noise Feedback Rating Dialog Modal */}
      {reportingZone && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-600" /> Report Live Noise Status
              </h3>
              <button
                onClick={() => setReportingZone(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Reporting noise for: <span className="font-bold text-slate-800">{reportingZone.name}</span> ({reportingZone.floor}, {reportingZone.block})
              </p>
            </div>

            {/* Noise Level Rating Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select Observed Noise Level:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { level: 'Silent', label: '🤫 Silent', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                  { level: 'Moderate', label: '🔉 Moderate', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
                  { level: 'Loud', label: '🔊 Loud / Noisy', bg: 'bg-rose-50 text-rose-800 border-rose-300' }
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setNoiseRating(item.level)}
                    className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all text-center ${
                      noiseRating === item.level
                        ? `${item.bg} ring-2 ring-indigo-500 shadow-sm`
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Comment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Optional Comment / Review Note:</label>
              <input
                type="text"
                placeholder="e.g., Desk lamps working well, zero disturbance..."
                value={noiseComment}
                onChange={(e) => setNoiseComment(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReportingZone(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNoiseReport}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Detail Modal (when clicked from Floorplan) */}
      {selectedZoneDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  {selectedZoneDetail.category} • {selectedZoneDetail.block}
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {selectedZoneDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedZoneDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  📍 {selectedZoneDetail.floor}
                </span>
                {getNoiseBadge(selectedZoneDetail.noise_level)}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedZoneDetail.description}
              </p>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Operating Hours: <span className="font-normal text-slate-600">{selectedZoneDetail.operating_hours}</span>
                </div>
                {selectedZoneDetail.amenities && (
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Amenities: <span className="font-semibold text-indigo-900">{selectedZoneDetail.amenities}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Occupancy</span>
                  <span>{selectedZoneDetail.live_occupancy} / {selectedZoneDetail.capacity} Seats ({selectedZoneDetail.occupancy_percentage}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedZoneDetail.occupancy_percentage >= 75 ? 'bg-rose-500' :
                      selectedZoneDetail.occupancy_percentage >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, selectedZoneDetail.occupancy_percentage)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedZoneDetail(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCheckIn(selectedZoneDetail.id);
                  setSelectedZoneDetail(null);
                }}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Check In Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
