import { get, all, run } from '../database/db.js';
import { createNotification } from './notificationController.js';

export async function getBlockLeaderboard(req, res) {
  try {
    const blocks = await all(`
      SELECT b.id, b.name as block_name, h.name as hostel_name, b.floors_count
      FROM blocks b
      JOIN hostels h ON h.id = b.hostel_id
    `);

    const leaderboardData = await Promise.all(
      blocks.map(async (blk) => {
        // 1. Get latest or average cleanliness inspection score
        const insp = await get(`
          SELECT AVG(cleanliness_score) as avg_score, MAX(cleanliness_score) as latest_score, remarks, MAX(inspected_at) as last_inspected
          FROM block_inspections
          WHERE block_id = ?
        `, [blk.id]);

        const cleanlinessScore = insp?.avg_score ? parseFloat(Number(insp.avg_score).toFixed(1)) : 9.0;

        // 2. Get complaints stats for residents living in this block
        const compStats = await get(`
          SELECT 
            COUNT(c.id) as total_complaints,
            SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) as resolved_complaints
          FROM rooms r
          JOIN beds bd ON bd.room_id = r.id
          JOIN room_allocations ra ON ra.bed_id = bd.id AND ra.status = 'active'
          JOIN complaints c ON c.student_id = ra.student_id
          WHERE r.block_id = ?
        `, [blk.id]);

        const totalComplaints = compStats?.total_complaints || 0;
        const resolvedComplaints = compStats?.resolved_complaints || 0;
        const resolutionRate = totalComplaints > 0 
          ? Math.round((resolvedComplaints / totalComplaints) * 100)
          : 100;

        // 3. Calculate Overall Score out of 100
        // Cleanliness: max 50 points
        // Resolution Rate: max 40 points
        // Base Participation: 10 points
        const cleanlinessPoints = (cleanlinessScore / 10) * 50;
        const resolutionPoints = (resolutionRate / 100) * 40;
        const totalScore = Math.min(100, Math.round(cleanlinessPoints + resolutionPoints + 10));

        return {
          id: blk.id,
          block_name: blk.block_name,
          hostel_name: blk.hostel_name,
          cleanliness_score: cleanlinessScore,
          total_complaints: totalComplaints,
          resolved_complaints: resolvedComplaints,
          resolution_rate: resolutionRate,
          total_score: totalScore,
          remarks: insp?.remarks || 'Routine maintenance and cleanliness audit.',
          last_inspected: insp?.last_inspected || null
        };
      })
    );

    // Sort descending by total_score, then cleanliness_score
    leaderboardData.sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      return b.cleanliness_score - a.cleanliness_score;
    });

    // Assign Rank Badges & Titles
    const rankedBlocks = leaderboardData.map((item, idx) => {
      const rank = idx + 1;
      let badge = '🏅 Top Contender';
      let title = 'Active Resident Block';
      let accentColor = 'border-slate-200 bg-white';
      let medal = null;

      if (rank === 1) {
        badge = '🥇 1st Place - Champion';
        title = 'Cleanest Block of the Month';
        accentColor = 'border-amber-400 bg-gradient-to-r from-amber-500/10 via-yellow-400/5 to-amber-500/10';
        medal = '🥇';
      } else if (rank === 2) {
        badge = '🥈 2nd Place - Runner Up';
        title = 'Excellence in Sanitation';
        accentColor = 'border-slate-400 bg-gradient-to-r from-slate-200/20 via-slate-100/10 to-slate-200/20';
        medal = '🥈';
      } else if (rank === 3) {
        badge = '🥉 3rd Place - Bronze Tier';
        title = 'High Hygiene Standards';
        accentColor = 'border-amber-700/40 bg-gradient-to-r from-amber-700/10 via-amber-600/5 to-amber-700/10';
        medal = '🥉';
      }

      return {
        ...item,
        rank,
        badge,
        title,
        accentColor,
        medal
      };
    });

    res.json({
      success: true,
      rankings: rankedBlocks,
      champion: rankedBlocks[0] || null,
      month: 'September 2026'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function submitBlockInspection(req, res) {
  try {
    const { block_id, cleanliness_score, remarks } = req.body;

    if (!block_id || cleanliness_score === undefined) {
      return res.status(400).json({ success: false, message: 'Block ID and Cleanliness Score are required.' });
    }

    const score = parseFloat(cleanliness_score);
    if (isNaN(score) || score < 1 || score > 10) {
      return res.status(400).json({ success: false, message: 'Cleanliness score must be between 1 and 10.' });
    }

    const block = await get('SELECT name FROM blocks WHERE id = ?', [block_id]);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found.' });
    }

    await run(`
      INSERT INTO block_inspections (block_id, warden_id, cleanliness_score, remarks)
      VALUES (?, ?, ?, ?)
    `, [block_id, req.user ? req.user.id : null, score, remarks || 'Sanitation inspection completed.']);

    res.status(201).json({
      success: true,
      message: `Cleanliness audit score (${score}/10) logged successfully for ${block.name}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
