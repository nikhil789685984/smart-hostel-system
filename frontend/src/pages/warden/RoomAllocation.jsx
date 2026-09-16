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
  Search
} from 'lucide-react';

export default function RoomAllocation() {
  const [matrixData, setMatrixData] = useState({ blocks: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');

  // Modals
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [studentIdToAllocate, setStudentIdToAllocate] = useState('');
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
      const res = await api.getRoomMatrix({
        blockId: selectedBlockId,
        floor: selectedFloor,
      });
      setMatrixData(res);
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
        setStudentsList(res.students || []);
        if (res.students?.[0]) {
          setStudentIdToAllocate(res.students[0].id.toString());
        }
      } catch (err) {}
    }
    loadStudents();
  }, []);

  const handleBedClick = (bed, room) => {
    setSelectedBed(bed);
    setSelectedRoom(room);
    if (bed.bed_status === 'vacant') {
      setAllocateModalOpen(true);
    } else if (bed.bed_status === 'occupied') {
      setVacateModalOpen(true);
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Room & Bed Allocation Visualizer</h1>
          <p className="text-xs text-slate-500 mt-1">
            Architectural layout of hostel rooms and real-time bed allotment matrix.
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">Hostel Block:</span>
            <select
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800"
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
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800"
            >
              <option value="">All Floors</option>
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
              <option value="3">3rd Floor</option>
            </select>
          </div>
        </div>

        <p className="text-slate-500 text-[11px]">
          Showing <strong>{matrixData.rooms?.length || 0}</strong> rooms
        </p>
      </div>

      {/* Interactive Visualizer */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <BedVisualizer
          rooms={matrixData.rooms}
          onSelectBed={handleBedClick}
          isWarden={true}
        />
      )}

      {/* Allocate Bed Modal */}
      <Modal
        isOpen={allocateModalOpen}
        onClose={() => setAllocateModalOpen(false)}
        title={`Allocate Bed: ${selectedBed?.bed_number} (Room ${selectedRoom?.room_number})`}
        subtitle="Assign an enrolled student to this vacant bed"
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <p><strong>Room:</strong> {selectedRoom?.room_number} ({selectedRoom?.block_name}, Floor {selectedRoom?.floor})</p>
            <p className="mt-1"><strong>Type:</strong> {selectedRoom?.room_type} • <strong>Tariff:</strong> ₹{Number(selectedRoom?.fee_per_semester || 0).toLocaleString()}/sem</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Select Student to Allocate *
            </label>
            <select
              value={studentIdToAllocate}
              onChange={(e) => setStudentIdToAllocate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              {studentsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.roll_number}) - {s.branch}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAllocateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={allocating}
              className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow transition"
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
        title="Add New Room & Auto-Generate Beds"
        subtitle="Configure room details and capacity"
      >
        <form onSubmit={handleAddRoomSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Hostel Block</label>
            <select
              value={newRoomData.block_id}
              onChange={(e) => setNewRoomData({ ...newRoomData, block_id: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            >
              {matrixData.blocks?.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. B-206"
                value={newRoomData.room_number}
                onChange={(e) => setNewRoomData({ ...newRoomData, room_number: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Floor Level</label>
              <input
                type="number"
                min={1}
                max={5}
                value={newRoomData.floor}
                onChange={(e) => setNewRoomData({ ...newRoomData, floor: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Bed Capacity</label>
              <select
                value={newRoomData.capacity}
                onChange={(e) => setNewRoomData({ ...newRoomData, capacity: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="1">1 Bed (Single Suite)</option>
                <option value="2">2 Beds (Double Sharing)</option>
                <option value="3">3 Beds (Triple Sharing)</option>
                <option value="4">4 Beds (Quad Sharing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Room Type</label>
              <select
                value={newRoomData.room_type}
                onChange={(e) => setNewRoomData({ ...newRoomData, room_type: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
                <option value="Deluxe">Deluxe</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Semester Fee (INR)</label>
            <input
              type="number"
              value={newRoomData.fee_per_semester}
              onChange={(e) => setNewRoomData({ ...newRoomData, fee_per_semester: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddRoomModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingRoom}
              className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow transition"
            >
              {addingRoom ? 'Creating...' : 'Create Room & Beds'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
