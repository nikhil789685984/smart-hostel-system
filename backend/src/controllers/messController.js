import { get, all, run } from '../database/db.js';
import { createNotification, createBroadcastNotification } from './notificationController.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function getTodayMenu(req, res) {
  try {
    const todayIndex = new Date().getDay();
    const todayDayName = DAYS[todayIndex];

    const menu = await get('SELECT * FROM mess_menu WHERE day_of_week = ?', [todayDayName]);

    // Determine current active or upcoming meal
    const hour = new Date().getHours();
    let currentMeal = 'Dinner';
    let nextMeal = 'Breakfast';

    if (hour >= 6 && hour < 10) {
      currentMeal = 'Breakfast';
      nextMeal = 'Lunch';
    } else if (hour >= 10 && hour < 15) {
      currentMeal = 'Lunch';
      nextMeal = 'Snacks';
    } else if (hour >= 15 && hour < 18) {
      currentMeal = 'Snacks';
      nextMeal = 'Dinner';
    } else if (hour >= 18 && hour < 22) {
      currentMeal = 'Dinner';
      nextMeal = 'Breakfast (Tomorrow)';
    }

    res.json({
      success: true,
      day: todayDayName,
      currentMeal,
      nextMeal,
      menu: menu || {
        day_of_week: todayDayName,
        breakfast: 'Poha & Tea',
        lunch: 'Dal, Sabzi, Rice, Roti',
        snacks: 'Tea & Biscuits',
        dinner: 'Paneer Butter Masala, Dal, Roti, Rice',
        special_item: 'Gulab Jamun',
        dietary_tags: 'Veg, High-Protein'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getWeeklyMenu(req, res) {
  try {
    const menus = await all('SELECT * FROM mess_menu ORDER BY id ASC');
    res.json({ success: true, menus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateMenu(req, res) {
  try {
    const { day_of_week, breakfast, lunch, snacks, dinner, special_item, dietary_tags } = req.body;

    if (!day_of_week) {
      return res.status(400).json({ success: false, message: 'Day of week is required.' });
    }

    const existing = await get('SELECT id FROM mess_menu WHERE day_of_week = ?', [day_of_week]);
    if (existing) {
      await run(`
        UPDATE mess_menu 
        SET breakfast = ?, lunch = ?, snacks = ?, dinner = ?, special_item = ?, dietary_tags = ?
        WHERE day_of_week = ?
      `, [breakfast, lunch, snacks, dinner, special_item || null, dietary_tags || null, day_of_week]);
    } else {
      await run(`
        INSERT INTO mess_menu (day_of_week, breakfast, lunch, snacks, dinner, special_item, dietary_tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [day_of_week, breakfast, lunch, snacks, dinner, special_item || null, dietary_tags || null]);
    }

    // Broadcast update to all student residents
    try {
      await createBroadcastNotification(
        ['student'],
        `🍽️ Mess Menu Updated: ${day_of_week}`,
        `The culinary schedule for ${day_of_week} was updated by Mess Committee. Special: ${special_item || 'Daily Special'}.`,
        'notice',
        '/student/mess'
      );
    } catch (e) {}

    res.json({ success: true, message: `Menu for ${day_of_week} updated successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function submitFeedback(req, res) {
  try {
    const { meal_type, rating, taste_rating, quality_rating, cleanliness_rating, comments } = req.body;

    if (!meal_type || !rating) {
      return res.status(400).json({ success: false, message: 'Meal type and overall rating are required.' });
    }

    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    await run(`
      INSERT INTO mess_feedback (student_id, meal_type, rating, taste_rating, quality_rating, cleanliness_rating, comments, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
    `, [
      student.id,
      meal_type,
      rating,
      taste_rating || rating,
      quality_rating || rating,
      cleanliness_rating || rating,
      comments || null
    ]);

    // Send confirmation to student
    try {
      await createNotification(
        req.user.id,
        '🍲 Mess Feedback Acknowledged',
        `Thank you! Your feedback for ${meal_type} (${rating}★) was received by Mess Committee.`,
        'success',
        '/student/mess'
      );
    } catch (e) {}

    // Notify Mess Warden & Admin
    try {
      await createBroadcastNotification(
        ['warden', 'admin'],
        `🍲 Student Mess Feedback: ${meal_type} (${rating}★)`,
        `${req.user.name} reviewed ${meal_type} (${rating}★): "${comments || 'No written remarks'}".`,
        'notice',
        '/warden/dashboard',
        req.user.id
      );
    } catch (e) {}

    res.status(201).json({ success: true, message: 'Thank you! Your mess feedback has been recorded.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMessAnalytics(req, res) {
  try {
    const summary = await get(`
      SELECT 
        ROUND(AVG(rating), 1) as avg_rating,
        ROUND(AVG(taste_rating), 1) as avg_taste,
        ROUND(AVG(quality_rating), 1) as avg_quality,
        ROUND(AVG(cleanliness_rating), 1) as avg_cleanliness,
        COUNT(*) as total_feedback_count
      FROM mess_feedback
    `);

    const recentReviews = await all(`
      SELECT mf.*, u.name as student_name, s.roll_number
      FROM mess_feedback mf
      JOIN students s ON s.id = mf.student_id
      JOIN users u ON u.id = s.user_id
      ORDER BY mf.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      analytics: {
        avgRating: summary?.avg_rating || 4.2,
        avgTaste: summary?.avg_taste || 4.0,
        avgQuality: summary?.avg_quality || 4.3,
        avgCleanliness: summary?.avg_cleanliness || 4.5,
        totalFeedbackCount: summary?.total_feedback_count || 3,
        recentReviews
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Toggle meal absence for student
export async function toggleMealAbsence(req, res) {
  try {
    const { meal_type, date, reason } = req.body;
    if (!meal_type) {
      return res.status(400).json({ success: false, message: 'Meal type is required.' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const student = await get('SELECT s.id, s.roll_number, u.name FROM students s JOIN users u ON u.id = s.user_id WHERE s.user_id = ?', [req.user.id]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    // Check if already marked absent
    const existing = await get(
      'SELECT id, rebate_amount FROM meal_absences WHERE student_id = ? AND date = ? AND meal_type = ?',
      [student.id, targetDate, meal_type]
    );

    if (existing) {
      // Toggle off (cancel absence)
      await run('DELETE FROM meal_absences WHERE id = ?', [existing.id]);

      // Reverse fee deduction (add rebate back to pending)
      await run(
        'UPDATE fees SET pending_amount = pending_amount + ? WHERE id = (SELECT id FROM fees WHERE student_id = ? ORDER BY id DESC LIMIT 1)',
        [existing.rebate_amount, student.id]
      );

      // Notify student of cancellation
      try {
        await createNotification(
          req.user.id,
          `🍽️ Meal Attendance Restored`,
          `Your absence for ${meal_type} on ${targetDate} was cancelled. ₹${existing.rebate_amount} was added back to your fee dues.`,
          'info',
          '/student/mess'
        );
      } catch (e) {}

      return res.json({
        success: true,
        isAbsent: false,
        message: `Absence cancelled for ${meal_type} on ${targetDate}. You are marked attending.`
      });
    } else {
      // Toggle on (mark absent)
      const rebate = meal_type === 'Breakfast' ? 40.0 : 65.0;
      const finalReason = reason || 'Personal / Dining Out';

      await run(
        `INSERT INTO meal_absences (student_id, date, meal_type, reason, rebate_amount)
         VALUES (?, ?, ?, ?, ?)`,
        [student.id, targetDate, meal_type, finalReason, rebate]
      );

      // Deduct rebate from pending fees
      await run(
        'UPDATE fees SET pending_amount = pending_amount - ? WHERE id = (SELECT id FROM fees WHERE student_id = ? ORDER BY id DESC LIMIT 1)',
        [rebate, student.id]
      );

      // Notify student with rebate confirmation
      try {
        await createNotification(
          req.user.id,
          `🍽️ Meal Absence Logged (-₹${rebate} Dues)`,
          `Absence registered for ${meal_type} on ${targetDate} (${finalReason}). A ₹${rebate} rebate has been directly deducted from your pending fees.`,
          'success',
          '/student/mess'
        );
      } catch (e) {}

      // Notify kitchen warden & admin
      try {
        // Fetch room info if available
        const alloc = await get(`
          SELECT r.room_number, b.name as block_name
          FROM room_allocations ra
          JOIN beds bd ON bd.id = ra.bed_id
          JOIN rooms r ON r.id = bd.room_id
          JOIN blocks b ON b.id = r.block_id
          WHERE ra.student_id = ? AND ra.status = 'active'
        `, [student.id]);

        const roomStr = alloc ? `Room ${alloc.room_number} (${alloc.block_name})` : student.roll_number;

        await createBroadcastNotification(
          ['warden', 'admin'],
          `🍽️ Meal Skip Alert: ${meal_type} (${targetDate})`,
          `Student ${student.name} [${roomStr}] marked absent for ${meal_type}. Reason: "${finalReason}". Headcount adjusted.`,
          'notice',
          '/warden/mess',
          req.user.id
        );
      } catch (e) {}

      return res.json({
        success: true,
        isAbsent: true,
        rebate_amount: rebate,
        message: `Absence confirmed for ${meal_type} on ${targetDate}. ₹${rebate} deducted from pending fees.`
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Student self-view of their logged absences
export async function getMyMealAbsences(req, res) {
  try {
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const absences = await all(
      `SELECT * FROM meal_absences WHERE student_id = ? ORDER BY date DESC, created_at DESC`,
      [student.id]
    );

    const totalRebate = absences.reduce((sum, a) => sum + (a.rebate_amount || 0), 0);

    res.json({
      success: true,
      absences,
      totalRebate
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Warden Kitchen Headcount & Cook Sheet Roster
export async function getWardenMessRoster(req, res) {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    const mealFilter = req.query.meal;
    const blockFilter = req.query.block;

    // Total enrolled active students
    const totalStudentsRow = await get("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
    const totalStudents = totalStudentsRow?.count || 115;

    // Headcounts per meal for the date
    const counts = await all(`
      SELECT meal_type, COUNT(*) as absent_count
      FROM meal_absences
      WHERE date = ?
      GROUP BY meal_type
    `, [targetDate]);

    const headcountMap = {
      Breakfast: { absent: 0, attending: totalStudents },
      Lunch: { absent: 0, attending: totalStudents },
      Dinner: { absent: 0, attending: totalStudents },
    };

    for (const c of counts) {
      if (headcountMap[c.meal_type]) {
        headcountMap[c.meal_type].absent = c.absent_count;
        headcountMap[c.meal_type].attending = Math.max(0, totalStudents - c.absent_count);
      }
    }

    // Detailed student absence list with room & block
    let querySql = `
      SELECT 
        ma.id,
        ma.student_id,
        ma.date,
        ma.meal_type,
        ma.reason,
        ma.rebate_amount,
        ma.created_at,
        u.name as student_name,
        u.phone as student_phone,
        u.avatar_url,
        s.roll_number,
        b.name as block_name,
        b.id as block_id,
        r.room_number,
        bd.bed_number
      FROM meal_absences ma
      JOIN students s ON s.id = ma.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds bd ON bd.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = bd.room_id
      LEFT JOIN blocks b ON b.id = r.block_id
      WHERE ma.date = ?
    `;
    const params = [targetDate];

    if (mealFilter && mealFilter !== 'All') {
      querySql += ' AND ma.meal_type = ?';
      params.push(mealFilter);
    }
    if (blockFilter && blockFilter !== 'All') {
      querySql += ' AND (b.name LIKE ? OR b.id = ?)';
      params.push(`%${blockFilter}%`, blockFilter);
    }

    querySql += ' ORDER BY ma.meal_type ASC, b.name ASC, r.room_number ASC';

    const absentStudents = await all(querySql, params);

    // Available blocks for filter dropdown
    const availableBlocks = await all('SELECT id, name FROM blocks ORDER BY name ASC');

    res.json({
      success: true,
      date: targetDate,
      totalStudents,
      headcount: headcountMap,
      absentStudents,
      availableBlocks
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Admin Institutional Mess Waste & Catering Governance Analytics
export async function getAdminMessAnalytics(req, res) {
  try {
    // Total historical absences
    const totalStats = await get(`
      SELECT 
        COUNT(*) as total_absences,
        COALESCE(SUM(rebate_amount), 0) as total_rebate_disbursed,
        COUNT(DISTINCT student_id) as participating_students
      FROM meal_absences
    `);

    // This month absences
    const thisMonthStats = await get(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(rebate_amount), 0) as rebate
      FROM meal_absences
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `);

    // Total food waste saved calculation: ~0.45 kg raw food / plate
    const totalMealsSkipped = totalStats?.total_absences || 0;
    const foodWastePreventedKg = (totalMealsSkipped * 0.45).toFixed(1);
    const catererSavings = Math.round(totalMealsSkipped * 55.0);

    // Breakdown by meal type
    const mealBreakdown = await all(`
      SELECT meal_type, COUNT(*) as count, COALESCE(SUM(rebate_amount), 0) as total_rebate
      FROM meal_absences
      GROUP BY meal_type
      ORDER BY count DESC
    `);

    // Breakdown by block
    const blockBreakdown = await all(`
      SELECT 
        COALESCE(b.name, 'Unassigned / Day Scholar') as block_name,
        COUNT(ma.id) as absent_count
      FROM meal_absences ma
      JOIN students s ON s.id = ma.student_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds bd ON bd.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = bd.room_id
      LEFT JOIN blocks b ON b.id = r.block_id
      GROUP BY b.name
      ORDER BY absent_count DESC
    `);

    // Recent 15 audit ledger records
    const auditLedger = await all(`
      SELECT 
        ma.id,
        ma.date,
        ma.meal_type,
        ma.reason,
        ma.rebate_amount,
        ma.created_at,
        u.name as student_name,
        s.roll_number,
        b.name as block_name,
        r.room_number
      FROM meal_absences ma
      JOIN students s ON s.id = ma.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds bd ON bd.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = bd.room_id
      LEFT JOIN blocks b ON b.id = r.block_id
      ORDER BY ma.date DESC, ma.created_at DESC
      LIMIT 15
    `);

    res.json({
      success: true,
      analytics: {
        totalMealsSkipped,
        foodWastePreventedKg: Number(foodWastePreventedKg),
        totalRebateDisbursed: totalStats?.total_rebate_disbursed || 0,
        catererSavings,
        participatingStudents: totalStats?.participating_students || 0,
        thisMonthCount: thisMonthStats?.count || 0,
        thisMonthRebate: thisMonthStats?.rebate || 0,
        mealBreakdown,
        blockBreakdown,
        auditLedger
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
