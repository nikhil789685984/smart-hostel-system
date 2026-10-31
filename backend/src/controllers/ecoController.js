import { get, all, run } from '../database/db.js';
import { createNotification } from './notificationController.js';

// Initialize and seed eco metrics
export async function initEcoMetrics() {
  await run(`
    CREATE TABLE IF NOT EXISTS eco_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER UNIQUE,
      electricity_usage REAL, 
      water_usage REAL, 
      eco_points INTEGER,
      badge TEXT,
      reward_claimed BOOLEAN DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  const count = await get("SELECT COUNT(*) as count FROM eco_metrics");
  if (count.count === 0) {
    console.log("Seeding Eco Metrics...");
    const students = await all("SELECT id FROM students");
    for (const student of students) {
      const elec = Math.floor(Math.random() * 150) + 50; 
      const water = Math.floor(Math.random() * 2000) + 1000; 
      
      let points = 1000 - (elec * 2) - (water * 0.1);
      points = Math.max(10, Math.floor(points));
      
      let badge = 'Seedling';
      if (points > 750) badge = 'Eco-Warrior 👑';
      else if (points > 500) badge = 'Green Ranger 🌿';
      else if (points > 300) badge = 'Earth Saver 🌍';

      await run(`
        INSERT INTO eco_metrics (student_id, electricity_usage, water_usage, eco_points, badge)
        VALUES (?, ?, ?, ?, ?)
      `, [student.id, elec, water, points, badge]);
    }
  }
}

// Background simulator to make it "Live"
setInterval(async () => {
  try {
    await run(`
      UPDATE eco_metrics 
      SET 
        electricity_usage = electricity_usage + (ABS(RANDOM() % 3) * 0.1),
        water_usage = water_usage + ABS(RANDOM() % 5),
        eco_points = eco_points - (ABS(RANDOM() % 3))
      WHERE reward_claimed = 0
    `);
  } catch(e) {}
}, 10000);

export async function getLeaderboard(req, res) {
  try {
    await initEcoMetrics(); 
    const leaderboard = await all(`
      SELECT e.*, u.name, s.roll_number, r.room_number 
      FROM eco_metrics e
      JOIN students s ON s.id = e.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      ORDER BY e.eco_points DESC
      LIMIT 20
    `);
    
    // Overall hostel stats
    const stats = await get(`
      SELECT 
        SUM(electricity_usage) as total_elec, 
        SUM(water_usage) as total_water,
        AVG(eco_points) as avg_points
      FROM eco_metrics
    `);

    res.json({ success: true, leaderboard, stats });
  } catch (err) {
    console.error("DEBUG500", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMyEcoStats(req, res) {
  try {
    await initEcoMetrics();
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const stats = await get(`
      SELECT e.*, u.name, r.room_number 
      FROM eco_metrics e
      JOIN students s ON s.id = e.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      WHERE e.student_id = ?
    `, [student.id]);
    
    // Get rank
    const rankData = await get(`
      SELECT COUNT(*) + 1 as rank 
      FROM eco_metrics 
      WHERE eco_points > ?
    `, [stats.eco_points]);

    res.json({ success: true, stats: { ...stats, rank: rankData.rank } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function claimEcoReward(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const eco = await get('SELECT * FROM eco_metrics WHERE student_id = ?', [student.id]);
    
    // Get rank
    const rankData = await get('SELECT COUNT(*) + 1 as rank FROM eco_metrics WHERE eco_points > ?', [eco.eco_points]);
    
    if (rankData.rank > 5) {
      return res.status(400).json({ success: false, message: 'Only the Top 5 Eco-Warriors can claim the financial reward.' });
    }
    if (eco.reward_claimed) {
      return res.status(400).json({ success: false, message: 'Reward already claimed for this month!' });
    }

    // Apply ₹500 discount to fees
    const fee = await get("SELECT * FROM fees WHERE student_id = ? ORDER BY semester DESC LIMIT 1", [student.id]);
    if (fee && fee.pending_amount > 0) {
      const discount = Math.min(500, fee.pending_amount);
      await run("UPDATE fees SET pending_amount = pending_amount - ?, paid_amount = paid_amount + ? WHERE id = ?", [discount, discount, fee.id]);
      
      // Log transaction
      const receiptNo = `ECO-${Date.now()}`;
      await run(`
        INSERT INTO fee_transactions (fee_id, student_id, amount, payment_method, transaction_id, receipt_number)
        VALUES (?, ?, ?, 'Eco-Reward Grant', 'GRANT_500', ?)
      `, [fee.id, student.id, discount, receiptNo]);

      // Mark claimed
      await run("UPDATE eco_metrics SET reward_claimed = 1 WHERE student_id = ?", [student.id]);

      // Notify
      await createNotification(
        req.user.id,
        '🌍 Eco-Warrior Reward Claimed!',
        `Congratulations! ₹${discount} has been credited to your fee balance for being in the Top 5 most energy-efficient residents.`,
        'success',
        '/eco-leaderboard'
      );

      res.json({ success: true, message: `Awesome! ₹${discount} Eco-Reward has been credited to your fee balance.` });
    } else {
      res.status(400).json({ success: false, message: 'You have no pending fee dues to apply the discount to.' });
    }
  } catch (err) {
    console.error("DEBUG500", err); res.status(500).json({ success: false, message: err.message });
  }
}
