import { get, all } from '../database/db.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function getDashboard(req, res) {
  try {
    const student = await get(`
      SELECT s.*, u.name, u.email, u.phone, u.avatar_url,
             ct.name as caretaker_name, ct.phone as caretaker_phone, ct.email as caretaker_email,
             ct.staff_id as caretaker_staff_id, ct.shift as caretaker_shift, ct.duty_role as caretaker_role,
             ct.assigned_block as caretaker_block, ct.floor as caretaker_floor
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN caretakers ct ON ct.id = s.caretaker_id
      WHERE s.user_id = ?
    `, [req.user.id]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Room and bed info
    const roomInfo = await get(`
      SELECT r.id as room_id, r.room_number, r.floor, r.capacity, r.room_type, r.fee_per_semester,
             b.id as bed_id, b.bed_number, COALESCE(blk.name, 'Main Block') as block_name, COALESCE(h.name, 'Campus Hostel') as hostel_name
      FROM room_allocations ra
      JOIN beds b ON b.id = ra.bed_id
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      LEFT JOIN hostels h ON h.id = blk.hostel_id
      WHERE ra.student_id = ? AND ra.status = 'active'
    `, [student.id]);

    // Roommates
    let roommates = [];
    if (roomInfo) {
      roommates = await all(`
        SELECT u.name, u.phone, u.email, u.avatar_url, s.roll_number, s.branch, b.bed_number
        FROM room_allocations ra
        JOIN beds b ON b.id = ra.bed_id
        JOIN students s ON s.id = ra.student_id
        JOIN users u ON u.id = s.user_id
        WHERE b.room_id = ? AND ra.status = 'active' AND s.id != ?
      `, [roomInfo.room_id, student.id]);
    }

    // Attendance stats
    const totalAttendanceDays = (await get('SELECT COUNT(*) as count FROM attendance WHERE student_id = ?', [student.id]))?.count || 0;
    const presentDays = (await get("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'Present'", [student.id]))?.count || 0;
    const attendancePercentage = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 95;
    const recentAttendance = await all('SELECT date, status, remarks FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 5', [student.id]);

    // Complaints stats
    const totalComplaints = (await get('SELECT COUNT(*) as count FROM complaints WHERE student_id = ?', [student.id]))?.count || 0;
    const pendingComplaints = (await get("SELECT COUNT(*) as count FROM complaints WHERE student_id = ? AND status != 'Resolved'", [student.id]))?.count || 0;
    const recentComplaints = await all('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC LIMIT 3', [student.id]);

    // Fee status
    const fee = await get('SELECT * FROM fees WHERE student_id = ? ORDER BY semester DESC LIMIT 1', [student.id]);

    // Today's mess menu
    const todayDayName = DAYS[new Date().getDay()];
    const todayMenu = await get('SELECT * FROM mess_menu WHERE day_of_week = ?', [todayDayName]);

    // Active notices
    const notices = await all('SELECT * FROM notices WHERE target_audience IN (\'all\', \'students\') ORDER BY date DESC LIMIT 4');

    // Recent gate pass
    const gatePass = await get('SELECT * FROM gate_passes WHERE student_id = ? ORDER BY created_at DESC LIMIT 1', [student.id]);

    // Latest Depression / Wellness Screening Status
    const latestWellness = await get(`
      SELECT id, total_score, severity, status, counselor_name, session_time, session_venue, admin_notes, approved_at, created_at
      FROM depression_screenings
      WHERE student_id = ? OR user_id = ? OR roll_number = ? COLLATE NOCASE
      ORDER BY id DESC LIMIT 1
    `, [student.id, student.user_id, student.roll_number]);

    res.json({
      success: true,
      dashboard: {
        student,
        roomInfo,
        roommates,
        attendance: {
          percentage: attendancePercentage,
          totalDays: totalAttendanceDays,
          presentDays,
          recent: recentAttendance
        },
        complaints: {
          total: totalComplaints,
          pending: pendingComplaints,
          recent: recentComplaints
        },
        fee: fee || {
          total_amount: 45000,
          paid_amount: 0,
          pending_amount: 45000,
          status: 'Pending',
          due_date: '2026-09-30'
        },
        todayMenu,
        notices,
        gatePass,
        latestWellness: latestWellness ? {
          ...latestWellness,
          displayMessage: latestWellness.status === 'Approved'
            ? 'Your details are verified by counselor. They will call you soon.'
            : 'Your details are being reviewed by the counselor.'
        } : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
