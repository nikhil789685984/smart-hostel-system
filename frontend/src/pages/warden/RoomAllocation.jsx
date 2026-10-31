import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import BedVisualizer from '../../components/ui/BedVisualizer';
import Modal from '../../components/ui/Modal';
import {
  Bed,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building,
  Filter,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Check
} from 'lucide-react';

const ROOMS_PER_PAGE = 24;

export default function RoomAllocation() {
  const [matrixData, setMatrixData] = useState({ blocks: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [studentIdToAllocate, setStudentIdToAllocate] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [allocating, setAllocating] = useState(false);

  // Vacate Modal
  const [vacateModalOpen, setVacateModalOpen] = useState(false);
  const [vacating, setVacating] = useState(false);

  // Add Room Modal
  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    block_id: '2',
    room_number: '',
    floor: '2',
    capacity: '2',
    room_type: 'AC',
    fee_per_semester: '42000',
  });
  const [addingRoom, setAddingRoom] = useState(false);

  const [notification, setNotification] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getRoomMatrix({
        blockId: selectedBlockId,
        floor: selectedFloor,
      });
      setMatrixData(res);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBlockId, selectedFloor]);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await api.getAdminStudents();
        const unallocatedOrAll = res.students || [];
        setStudentsList(unallocatedOrAll);
        if (unallocatedOrAll[0]) {
          setStudentIdToAllocate(unallocatedOrAll[0].id.toString());
        }
      } catch (err) {}
    }
    loadStudents();
  }, []);

  // Filter Rooms based on Room Search
  const filteredRooms = (matrixData.rooms || []).filter((r) => {
    const query = roomSearch.toLowerCase();
    return (
      r.room_number.toLowerCase().includes(query) ||
      (r.block_name && r.block_name.toLowerCase().includes(query)) ||
      (r.room_type && r.room_type.toLowerCase().includes(query))
    );
  });

  // Paginated Rooms for instant zero-lag rendering
  const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE) || 1;
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * ROOMS_PER_PAGE,
    currentPage * ROOMS_PER_PAGE
  );

  // Filter Student List for Allocation Modal
  const filteredStudents = studentsList.filter((s) => {
    const q = studentSearchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.roll_number.toLowerCase().includes(q) ||
      (s.branch && s.branch.toLowerCase().includes(q))
    );
  });

  const handleBedClick = (bed, room) => {
    setSelectedBed(bed);
    setSelectedRoom(room);
    if (bed.bed_status === 'vacant') {
      setStudentSearchQuery('');
      setAllocateModalOpen(true);
    } else if (bed.bed_status === 'occupied') {
      setVacateModalOpen(true);
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!studentIdToAllocate) {
      alert('Please select a student to allocate.');
      return;
    }
    setAllocating(true);
    try {
      await api.allocateBed(parseInt(studentIdToAllocate, 10), selectedBed.bed_id);
      setNotification(`Bed ${selectedBed.bed_number} in Room ${selectedRoom.room_number} allocated successfully.`);
      setAllocateModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error allocating bed');
    } finally {
      setAllocating(false);
    }
  };

  const handleVacateSubmit = async () => {
    setVacating(true);
    try {
      await api.vacateBed(selectedBed.bed_id);
      setNotification(`Bed ${selectedBed.bed_number} vacated.`);
      setVacateModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error vacating bed');
    } finally {
      setVacating(false);
    }
  };

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    setAddingRoom(true);
    try {
      await api.addRoom(newRoomData);
      setNotification(`Room ${newRoomData.room_number} with ${newRoomData.capacity} beds created successfully.`);
      setAddRoomModalOpen(false);
      setNewRoomData({
        block_id: '2',
        room_number: '',
        floor: '2',
        capacity: '2',
        room_type: 'AC',
        fee_per_semester: '42000',
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Error creating room');
    } finally {
      setAddingRoom(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Room & Bed Allocation Visualizer</h1>
          <p className="text-xs text-slate-500 mt-1">
            Architectural layout of hostel rooms & real-time bed allotment matrix (Fast Paginated Engine).
          </p>
        </div>

        <button
          onClick={() => setAddRoomModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md shadow-purple-500/20 transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" /> Add New Room
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs font-bold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs uppercase font-black text-emerald-600">Dismiss</button>
        </div>
      )}

      {/* Filter Toolbar & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs font-semibold">
        
        {/* Block & Floor Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">Hostel Block:</span>
            <select
              value={selectedBlockId}
              onChange={(e) => {
                setSelectedBlockId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Blocks</option>
              {matrixData.blocks?.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">Floor Level:</span>
            <select
              value={selectedFloor}
              onChange={(e) => {
                setSelectedFloor(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Floors</option>
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
              <option value="3">3rd Floor</option>
            </select>
          </div>
        </div>

        {/* Room Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search room number/block..."
            value={roomSearch}
            onChange={(e) => {
              setRoomSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

      </div>

      {/* Interactive Visualizer Grid (Paginated) */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <BedVisualizer
            rooms={paginatedRooms}
            onSelectBed={handleBedClick}
            isWarden={true}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center text-xs font-bold text-slate-700">
              <span>
                Showing {((currentPage - 1) * ROOMS_PER_PAGE) + 1} to {Math.min(currentPage * ROOMS_PER_PAGE, filteredRooms.length)} of {filteredRooms.length} Rooms
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-black text-slate-900 px-3">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Allocate Bed Modal with Student Search Bar */}
      <Modal
        isOpen={allocateModalOpen}
        onClose={() => setAllocateModalOpen(false)}
        title={`Allocate Bed: ${selectedBed?.bed_number} (Room ${selectedRoom?.room_number})`}
        subtitle="Search and select a student to allocate to this vacant bed"
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <p><strong>Room:</strong> {selectedRoom?.room_number} ({selectedRoom?.block_name}, Floor {selectedRoom?.floor})</p>
            <p className="mt-1"><strong>Type:</strong> {selectedRoom?.room_type} • <strong>Tariff:</strong> ₹{Number(selectedRoom?.fee_per_semester || 0).toLocaleString()}/sem</p>
          </div>

          {/* Student Search Bar in Modal */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              🔍 Search Student Name / Roll Number
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type name (e.g. Aarav, Rohan) or Roll No..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Filtered Selectable Student List */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-400">
              Select Student from Results ({filteredStudents.length} Matching)
            </label>
            
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-1.5 space-y-1 bg-white">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold p-3 text-center">No students found matching "{studentSearchQuery}"</p>
              ) : (
                filteredStudents.slice(0, 15).map((s) => {
                  const isSelected = studentIdToAllocate === s.id.toString();
                  return (
                    <div
                      key={s.id}
                      onClick={() => setStudentIdToAllocate(s.id.toString())}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex justify-between items-center ${
                        isSelected
                          ? 'bg-purple-50 border-purple-300 text-purple-950 font-black shadow-xs'
                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100 text-slate-700 font-medium'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{s.name} <span className="text-[10px] text-slate-400 font-normal">({s.roll_number})</span></p>
                        <p className="text-[10px] text-slate-400">{s.branch} • Sem {s.semester}</p>
                      </div>
                      {isSelected && (
                        <span className="p-1 bg-purple-600 text-white rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAllocateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={allocating || !studentIdToAllocate}
              className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow transition disabled:opacity-50"
            >
              {allocating ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Vacate Bed Modal */}
      <Modal
        isOpen={vacateModalOpen}
        onClose={() => setVacateModalOpen(false)}
        title={`Vacate Bed: ${selectedBed?.bed_number} (Room ${selectedRoom?.room_number})`}
        subtitle="Deallocate current resident and mark bed available"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <p><strong>Current Resident:</strong> {selectedBed?.student_name} ({selectedBed?.roll_number})</p>
            <p className="mt-1">Are you sure you want to mark this bed as vacant? The student's allocation status will be set to 'vacated'.</p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setVacateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={vacating}
              onClick={handleVacateSubmit}
              className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow transition"
            >
              {vacating ? 'Vacating...' : 'Yes, Vacate Bed'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Room Modal */}
      <Modal
        isOpen={addRoomModalOpen}
        onClose={() => setAddRoomModalOpen(false)}
        title="Add New Hostel Room"
        subtitle="Create a new room in the hostel matrix"
      >
        <form onSubmit={handleAddRoomSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Hostel Block</label>
            <select
              value={newRoomData.block_id}
              onChange={(e) => setNewRoomData({ ...newRoomData, block_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
            >
              {matrixData.blocks?.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Room Number (e.g. B-305)</label>
            <input
              type="text"
              required
              placeholder="e.g. A-105"
              value={newRoomData.room_number}
              onChange={(e) => setNewRoomData({ ...newRoomData, room_number: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Floor Level</label>
              <select
                value={newRoomData.floor}
                onChange={(e) => setNewRoomData({ ...newRoomData, floor: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
              >
                <option value="1">1st Floor</option>
                <option value="2">2nd Floor</option>
                <option value="3">3rd Floor</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bed Capacity</label>
              <select
                value={newRoomData.capacity}
                onChange={(e) => setNewRoomData({ ...newRoomData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
              >
                <option value="1">Single (1 Bed)</option>
                <option value="2">Double (2 Beds)</option>
                <option value="3">Triple (3 Beds)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Room Type</label>
              <select
                value={newRoomData.room_type}
                onChange={(e) => setNewRoomData({ ...newRoomData, room_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
              >
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
                <option value="Deluxe">Deluxe</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fee Per Semester (₹)</label>
              <input
                type="number"
                required
                value={newRoomData.fee_per_semester}
                onChange={(e) => setNewRoomData({ ...newRoomData, fee_per_semester: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddRoomModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingRoom}
              className="px-5 py-2 font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow transition"
            >
              {addingRoom ? 'Creating Room...' : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
