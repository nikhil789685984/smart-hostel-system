import { get, all } from '../database/db.js';

export async function getCommandCenterStats(req, res) {
  try {
    // ---- 1. ACTIONABLE PENDING ITEMS ----
    const pendingComplaints = await all(`SELECT c.id, c.title, u.name as student_name, c.created_at FROM complaints c JOIN students s ON c.student_id = s.id JOIN users u ON s.user_id = u.id WHERE c.status != 'Resolved' ORDER BY c.created_at ASC`);
    const criticalComplaints = await all(`SELECT c.id, c.title, u.name as student_name, c.created_at FROM complaints c JOIN students s ON c.student_id = s.id JOIN users u ON s.user_id = u.id WHERE c.status != 'Resolved' AND (julianday('now') - julianday(c.created_at)) >= 2 ORDER BY c.created_at ASC`);
    const pendingGuestPasses = await all(`SELECT gp.id, gp.guest_name as title, u.name as student_name, gp.created_at FROM guest_passes gp JOIN students s ON gp.student_id = s.id JOIN users u ON s.user_id = u.id WHERE gp.status = 'Pending' ORDER BY gp.created_at ASC`);
    const pendingGatePasses = await all(`SELECT g.id, g.destination as title, u.name as student_name, g.created_at FROM gate_passes g JOIN students s ON g.student_id = s.id JOIN users u ON s.user_id = u.id WHERE g.status = 'Pending' ORDER BY g.created_at ASC`);
    const studentsOutside = await all(`SELECT g.id, g.destination as title, u.name as student_name, g.created_at FROM gate_passes g JOIN students s ON g.student_id = s.id JOIN users u ON s.user_id = u.id WHERE g.status = 'Active' ORDER BY g.created_at ASC`);
    
    let pendingRoomRequests = [];
    try { pendingRoomRequests = await all(`SELECT rr.id, rr.reason as title, u.name as student_name, rr.created_at FROM room_requests rr JOIN students s ON rr.student_id = s.id JOIN users u ON s.user_id = u.id WHERE rr.status = 'Pending' ORDER BY rr.created_at ASC`); } catch(e){}
    
    let pendingLostFound = [];
    try { pendingLostFound = await all(`SELECT lf.id, lf.item_name as title, u.name as student_name, lf.resolved_at as created_at FROM lost_found_items lf JOIN students s ON lf.claimed_by_student_id = s.id JOIN users u ON s.user_id = u.id WHERE lf.status = 'Claim_Pending'`); } catch(e){}
    
    const pendingCheckouts = await all(`SELECT cr.id, cr.reason as title, u.name as student_name, cr.created_at FROM checkout_requests cr JOIN students s ON cr.student_id = s.id JOIN users u ON s.user_id = u.id WHERE cr.status IN ('Pending_Warden', 'Pending_Admin') ORDER BY cr.created_at ASC`);
    
    let pendingCanteenOrders = [];
    try { pendingCanteenOrders = await all(`SELECT o.id, 'Order #' || o.id as title, u.name as student_name, o.created_at FROM canteen_orders o JOIN students s ON o.student_id = s.id JOIN users u ON s.user_id = u.id WHERE o.status IN ('Pending', 'Preparing') ORDER BY o.created_at ASC`); } catch(e){}
    
    let unpaidFees = [];
    try { unpaidFees = await all(`SELECT f.id, 'Sem ' || f.semester || ' Fees (₹' || f.pending_amount || ')' as title, u.name as student_name, f.due_date as created_at FROM fees f JOIN students s ON f.student_id = s.id JOIN users u ON s.user_id = u.id WHERE f.status != 'Paid' ORDER BY f.due_date ASC`); } catch(e){}

    let activeMarketplace = [];
    try { activeMarketplace = await all(`SELECT m.id, m.title, u.name as student_name, m.created_at FROM marketplace_items m JOIN students s ON m.student_id = s.id JOIN users u ON s.user_id = u.id WHERE m.status = 'Available'`); } catch(e){}

    let studentRefunds = [];
    try {
      studentRefunds = await all(`
        SELECT f.id, 
               'Refund Payable: ₹' || CAST((f.paid_amount - f.total_amount) AS INT) || ' (' || u.name || ' - Roll: ' || s.roll_number || ')' as title,
               u.name as student_name,
               (f.paid_amount - f.total_amount) as amount,
               s.roll_number, s.branch,
               f.created_at
        FROM fees f
        JOIN students s ON f.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE f.paid_amount > f.total_amount
        ORDER BY f.id ASC
      `);
    } catch(e){}

    // ---- 2. SYSTEM HEALTH & METRICS ----
    const totalStudentsData = await get(`SELECT count(*) as count FROM students WHERE status = 'Active'`);
    const totalWardensData = await get(`SELECT count(*) as count FROM users WHERE role = 'warden'`);
    const totalRoomsData = await get(`SELECT count(*) as count FROM rooms`);
    const totalResolvedComplaints = await get(`SELECT count(*) as count FROM complaints WHERE status = 'Resolved'`);
    
    res.json({
      success: true,
      data: {
        actions: {
          complaints: { count: pendingComplaints.length, items: pendingComplaints },
          criticalComplaints: { count: criticalComplaints.length, items: criticalComplaints },
          guestPasses: { count: pendingGuestPasses.length, items: pendingGuestPasses },
          gatePasses: { count: pendingGatePasses.length, items: pendingGatePasses },
          studentsOutside: { count: studentsOutside.length, items: studentsOutside },
          roomRequests: { count: pendingRoomRequests.length, items: pendingRoomRequests },
          lostFound: { count: pendingLostFound.length, items: pendingLostFound },
          checkouts: { count: pendingCheckouts.length, items: pendingCheckouts },
          canteenOrders: { count: pendingCanteenOrders.length, items: pendingCanteenOrders },
          unpaidFees: { count: unpaidFees.length, items: unpaidFees },
          studentRefunds: { count: studentRefunds.length, items: studentRefunds },
          marketplace: { count: activeMarketplace.length, items: activeMarketplace }
        },
        health: {
          totalStudents: totalStudentsData?.count || 0,
          totalWardens: totalWardensData?.count || 0,
          totalRooms: totalRoomsData?.count || 0,
          resolvedComplaints: totalResolvedComplaints?.count || 0,
          serverUptime: process.uptime(),
          lastSync: new Date().toISOString()
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}
