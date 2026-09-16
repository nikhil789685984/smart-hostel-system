import { get, all, run } from '../database/db.js';
import { createNotification } from './notificationController.js';

export async function getOverview(req, res) {
  try {
    const totalRooms = (await get('SELECT COUNT(*) as count FROM rooms'))?.count || 0;
    const totalBeds = (await get('SELECT COUNT(*) as count FROM beds'))?.count || 0;
    const occupiedBeds = (await get("SELECT COUNT(*) as count FROM beds WHERE status = 'occupied'"))?.count || 0;
    const vacantBeds = (await get("SELECT COUNT(*) as count FROM beds WHERE status = 'vacant'"))?.count || 0;
    const maintenanceBeds = (await get("SELECT COUNT(*) as count FROM beds WHERE status = 'maintenance'"))?.count || 0;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        maintenanceBeds,
        occupancyRate,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getRoomsMatrix(req, res) {
  try {
    const { blockId, floor } = req.query;

    let sql = `
      SELECT r.id as room_id, r.room_number, r.floor, r.capacity, r.room_type, r.fee_per_semester, r.status as room_status,
             blk.id as block_id, COALESCE(blk.name, 'Block A') as block_name, COALESCE(h.name, 'Campus Hostel') as hostel_name
      FROM rooms r
      LEFT JOIN blocks blk ON blk.id = r.block_id
      LEFT JOIN hostels h ON h.id = blk.hostel_id
      WHERE 1=1
    `;
    const params = [];

    if (blockId) {
      sql += ' AND r.block_id = ?';
      params.push(blockId);
    }
    if (floor) {
      sql += ' AND r.floor = ?';
      params.push(floor);
    }

    sql += ' ORDER BY r.floor ASC, r.room_number ASC';

    const rooms = await all(sql, params);

    // Fetch beds with student info for each room
    const roomsWithBeds = await Promise.all(
      rooms.map(async (room) => {
        const beds = await all(`
          SELECT b.id as bed_id, b.bed_number, b.status as bed_status,
                 s.id as student_id, s.roll_number, s.branch, s.year,
                 u.name as student_name, u.phone as student_phone, u.avatar_url
          FROM beds b
          LEFT JOIN room_allocations ra ON ra.bed_id = b.id AND ra.status = 'active'
          LEFT JOIN students s ON s.id = ra.student_id
          LEFT JOIN users u ON u.id = s.user_id
          WHERE b.room_id = ?
          ORDER BY b.bed_number ASC
        `, [room.room_id]);

        return {
          ...room,
          beds,
          occupiedCount: beds.filter(b => b.bed_status === 'occupied').length,
          vacantCount: beds.filter(b => b.bed_status === 'vacant').length,
        };
      })
    );

    const blocks = await all("SELECT b.*, COALESCE(h.name, 'Campus Hostel') as hostel_name FROM blocks b LEFT JOIN hostels h ON h.id = b.hostel_id");

    res.json({
      success: true,
      blocks,
      rooms: roomsWithBeds
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getStudentRoom(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const allocation = await get(`
      SELECT ra.id as allocation_id, ra.allocated_from,
             b.id as bed_id, b.bed_number,
             r.id as room_id, r.room_number, r.floor, r.capacity, r.room_type, r.fee_per_semester,
             COALESCE(blk.name, 'Main Block') as block_name, COALESCE(h.name, 'Campus Hostel') as hostel_name
      FROM room_allocations ra
      JOIN beds b ON b.id = ra.bed_id
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      LEFT JOIN hostels h ON h.id = blk.hostel_id
      WHERE ra.student_id = ? AND ra.status = 'active'
    `, [student.id]);

    if (!allocation) {
      return res.json({
        success: true,
        allocated: false,
        message: 'No room currently allocated.'
      });
    }

    // Fetch roommates
    const roommates = await all(`
      SELECT s.id, s.roll_number, s.branch, s.year, s.blood_group,
             u.name, u.phone, u.email, u.avatar_url,
             b.bed_number
      FROM room_allocations ra
      JOIN beds b ON b.id = ra.bed_id
      JOIN students s ON s.id = ra.student_id
      JOIN users u ON u.id = s.user_id
      WHERE b.room_id = ? AND ra.status = 'active' AND s.id != ?
    `, [allocation.room_id, student.id]);

    // Check if student has pending room change request
    const pendingRequest = await get(`
      SELECT * FROM room_change_requests 
      WHERE student_id = ? AND status = 'Pending' 
      ORDER BY created_at DESC LIMIT 1
    `, [student.id]);

    res.json({
      success: true,
      allocated: true,
      room: {
        ...allocation,
        roommates,
        pendingRequest
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function allocateBed(req, res) {
  try {
    const { studentId, bedId } = req.body;

    if (!studentId || !bedId) {
      return res.status(400).json({ success: false, message: 'Student ID and Bed ID are required.' });
    }

    const bed = await get(`
      SELECT b.*, r.room_number, COALESCE(blk.name, 'Main Block') as block_name
      FROM beds b
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      WHERE b.id = ?
    `, [bedId]);

    if (!bed) return res.status(404).json({ success: false, message: 'Bed not found.' });
    if (bed.status !== 'vacant') {
      return res.status(400).json({ success: false, message: `Bed is already ${bed.status}.` });
    }

    const student = await get('SELECT s.*, u.name, u.id as user_id FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = ?', [studentId]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Deactivate any existing active allocation for this student
    await run("UPDATE room_allocations SET status = 'transferred' WHERE student_id = ? AND status = 'active'", [studentId]);

    // Insert new active allocation
    await run(`
      INSERT INTO room_allocations (student_id, bed_id, allocated_from, status)
      VALUES (?, ?, CURRENT_DATE, 'active')
    `, [studentId, bedId]);

    // Update bed status to occupied
    await run("UPDATE beds SET status = 'occupied' WHERE id = ?", [bedId]);

    // Set student status to active
    await run("UPDATE students SET status = 'active' WHERE id = ?", [studentId]);

    // Check if all beds in room are occupied to update room status
    const remainingVacant = await get("SELECT COUNT(*) as count FROM beds WHERE room_id = ? AND status = 'vacant'", [bed.room_id]);
    if (remainingVacant.count === 0) {
      await run("UPDATE rooms SET status = 'full' WHERE id = ?", [bed.room_id]);
    }

    // Send real-time notification to student
    try {
      await createNotification(
        student.user_id,
        '🏠 Hostel Room Allocated!',
        `Congratulations ${student.name}! You have been officially allocated Room ${bed.room_number} (${bed.bed_number}) in ${bed.block_name}.`,
        'success',
        '/student/room'
      );
    } catch (notifErr) {
      console.warn('Room allocation notification error:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Bed ${bed.bed_number} in Room ${bed.room_number} (${bed.block_name}) allocated successfully to ${student.name}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function vacateBed(req, res) {
  try {
    const { bedId } = req.body;
    if (!bedId) return res.status(400).json({ success: false, message: 'Bed ID is required.' });

    const bed = await get('SELECT * FROM beds WHERE id = ?', [bedId]);
    if (!bed) return res.status(404).json({ success: false, message: 'Bed not found.' });

    // Mark allocation vacated
    await run("UPDATE room_allocations SET status = 'vacated', allocated_to = CURRENT_DATE WHERE bed_id = ? AND status = 'active'", [bedId]);

    // Update bed status to vacant
    await run("UPDATE beds SET status = 'vacant' WHERE id = ?", [bedId]);

    // Update room status to available
    await run("UPDATE rooms SET status = 'available' WHERE id = ?", [bed.room_id]);

    res.json({ success: true, message: 'Bed vacated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function addRoom(req, res) {
  try {
    const { block_id, room_number, floor, capacity, room_type, fee_per_semester } = req.body;

    if (!block_id || !room_number || !capacity) {
      return res.status(400).json({ success: false, message: 'Block, room number, and capacity are required.' });
    }

    const roomResult = await run(`
      INSERT INTO rooms (block_id, room_number, floor, capacity, room_type, fee_per_semester, status)
      VALUES (?, ?, ?, ?, ?, ?, 'available')
    `, [
      block_id,
      room_number,
      parseInt(floor || '1', 10),
      parseInt(capacity, 10),
      room_type || 'Non-AC',
      parseFloat(fee_per_semester || '35000')
    ]);

    const roomId = roomResult.insertId;

    // Automatically create beds for this room
    for (let i = 1; i <= parseInt(capacity, 10); i++) {
      await run(`
        INSERT INTO beds (room_id, bed_number, status)
        VALUES (?, ?, 'vacant')
      `, [roomId, `Bed-${i}`]);
    }

    res.status(201).json({ success: true, message: `Room ${room_number} with ${capacity} beds created successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function requestRoomChange(req, res) {
  try {
    const { preferred_block, preferred_room_type, reason } = req.body;
    if (!preferred_block || !reason) {
      return res.status(400).json({ success: false, message: 'Preferred block and reason are required.' });
    }

    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const currentAllocation = await get("SELECT bed_id FROM room_allocations WHERE student_id = ? AND status = 'active'", [student.id]);
    if (!currentAllocation) {
      return res.status(400).json({ success: false, message: 'You must have an active room allocation to request a room change.' });
    }

    await run(`
      INSERT INTO room_change_requests (student_id, current_bed_id, preferred_block, preferred_room_type, reason, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `, [student.id, currentAllocation.bed_id, preferred_block, preferred_room_type || 'AC', reason]);

    res.status(201).json({ success: true, message: 'Room change request submitted for Warden review.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getRoomChangeRequests(req, res) {
  try {
    const requests = await all(`
      SELECT rcr.*, 
             u.name as student_name, u.phone as student_phone,
             s.roll_number, s.branch,
             r.room_number as current_room, b.bed_number as current_bed,
             blk.name as current_block
      FROM room_change_requests rcr
      JOIN students s ON s.id = rcr.student_id
      JOIN users u ON u.id = s.user_id
      JOIN beds b ON b.id = rcr.current_bed_id
      JOIN rooms r ON r.id = b.room_id
      JOIN blocks blk ON blk.id = r.block_id
      ORDER BY rcr.created_at DESC
    `);

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateRoomChangeRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, warden_notes } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
    }

    await run(`
      UPDATE room_change_requests 
      SET status = ?, warden_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, warden_notes || null, id]);

    res.json({ success: true, message: `Room change request ${status.toLowerCase()} successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function cancelRoomAllocation(req, res) {
  try {
    const { student_id, bed_id, allocation_id } = req.body;

    let alloc;
    if (allocation_id) {
      alloc = await get("SELECT * FROM room_allocations WHERE id = ?", [allocation_id]);
    } else if (student_id) {
      alloc = await get("SELECT * FROM room_allocations WHERE student_id = ? AND status = 'active'", [student_id]);
    } else if (bed_id) {
      alloc = await get("SELECT * FROM room_allocations WHERE bed_id = ? AND status = 'active'", [bed_id]);
    } else if (req.user && req.user.role === 'student') {
      const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (student) {
        alloc = await get("SELECT * FROM room_allocations WHERE student_id = ? AND status = 'active'", [student.id]);
      }
    }

    if (!alloc) {
      return res.status(404).json({ success: false, message: 'Active room allocation record not found.' });
    }

    // Cancel allocation
    await run("UPDATE room_allocations SET status = 'cancelled', allocated_to = CURRENT_DATE WHERE id = ?", [alloc.id]);

    // Vacate bed
    await run("UPDATE beds SET status = 'vacant' WHERE id = ?", [alloc.bed_id]);

    // Update student status to pending_allocation
    await run("UPDATE students SET status = 'pending_allocation' WHERE id = ?", [alloc.student_id]);

    // Check if room has any active beds left
    const bedInfo = await get("SELECT room_id FROM beds WHERE id = ?", [alloc.bed_id]);
    if (bedInfo) {
      const activeBeds = await get("SELECT COUNT(*) as count FROM beds WHERE room_id = ? AND status = 'occupied'", [bedInfo.room_id]);
      if (!activeBeds || activeBeds.count === 0) {
        await run("UPDATE rooms SET status = 'available' WHERE id = ?", [bedInfo.room_id]);
      }
    }

    // Send notification to student
    try {
      await createNotification(
        alloc.student_id,
        'system',
        '🚫 Room Allocation Cancelled',
        `Your room allocation for Bed ID ${alloc.bed_id} has been cancelled. Please contact hostel warden for re-allocation.`,
        '/student/room'
      );
    } catch (e) {
      console.warn('Failed to send cancellation notification:', e.message);
    }

    res.json({ success: true, message: 'Room allocation cancelled successfully. Bed is now vacant.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function cancelRoomChangeRequest(req, res) {
  try {
    const { id } = req.params;
    let request;

    if (req.user.role === 'student') {
      const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      
      if (id && id !== 'latest') {
        request = await get("SELECT * FROM room_change_requests WHERE id = ? AND student_id = ? AND status = 'Pending'", [id, student.id]);
      } else {
        request = await get("SELECT * FROM room_change_requests WHERE student_id = ? AND status = 'Pending' ORDER BY created_at DESC LIMIT 1", [student.id]);
      }
    } else {
      request = await get("SELECT * FROM room_change_requests WHERE id = ?", [id]);
    }

    if (!request) {
      return res.status(404).json({ success: false, message: 'Pending room change request not found.' });
    }

    await run("UPDATE room_change_requests SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [request.id]);

    res.json({ success: true, message: 'Room change request cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

