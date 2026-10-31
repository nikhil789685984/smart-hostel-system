import { get, all, run } from '../database/db.js';

// Expanded 16 Default Venues with rich metadata
const DEFAULT_ZONES = [
  {
    name: 'Central Library Silent Reading Room',
    category: 'Library',
    floor: '1st Floor',
    block: 'Central Hub',
    capacity: 40,
    noise_level: 'Silent',
    amenities: '❄️ AC, 🔌 Power Sockets, 📶 5G Wi-Fi, 💡 Desk Lamps',
    operating_hours: '24/7 Open',
    description: 'Air-conditioned quiet reading room equipped with ergonomic study cubicles and individual desk lighting.',
    status: 'Active'
  },
  {
    name: 'Academic Group Study Pod A',
    category: 'Study Hall',
    floor: 'Ground Floor',
    block: 'Block A',
    capacity: 20,
    noise_level: 'Moderate',
    amenities: '🖊️ Whiteboard, 🖥️ HD Projector, 🔌 Power Strips',
    operating_hours: '06:00 AM - 12:00 AM',
    description: 'Ideal for group discussions, mock interviews, and team project coding sessions.',
    status: 'Active'
  },
  {
    name: 'Academic Group Study Pod B',
    category: 'Study Hall',
    floor: '1st Floor',
    block: 'Block B',
    capacity: 18,
    noise_level: 'Moderate',
    amenities: '📺 Smart Display, 🖊️ Glassboard, 📶 High-Speed Wi-Fi',
    operating_hours: '07:00 AM - 11:30 PM',
    description: 'Spacious discussion booth with wall-mounted screen for presentations and group reviews.',
    status: 'Active'
  },
  {
    name: 'Late-Night Quiet Lounge',
    category: 'Lounge',
    floor: '2nd Floor',
    block: 'Block B',
    capacity: 15,
    noise_level: 'Silent',
    amenities: '🛋️ Bean Bags, ☕ Coffee Dispenser, 💡 Warm Ambient Lighting',
    operating_hours: '24/7 Open',
    description: 'Cozy late-night sanctuary with plush seating and automated hot beverage dispenser.',
    status: 'Active'
  },
  {
    name: 'Digital Innovation & Computer Lab',
    category: 'Computer Lab',
    floor: '1st Floor',
    block: 'Block A',
    capacity: 30,
    noise_level: 'Silent',
    amenities: '🖥️ Dual Monitors, ⚡ 1Gbps Fiber LAN, ❄️ AC',
    operating_hours: '24/7 Open',
    description: 'High-performance workstation computers preloaded with coding IDEs and software tools.',
    status: 'Active'
  },
  {
    name: 'Resident Gym & Fitness Center',
    category: 'Gym',
    floor: 'Ground Floor',
    block: 'Central Hub',
    capacity: 25,
    noise_level: 'Loud',
    amenities: '🎵 Surround Sound, 🏃 Treadmills, 🏋️ Free Weights, 🚿 Lockers',
    operating_hours: '05:30 AM - 10:00 PM',
    description: 'Fully equipped fitness center with cardio equipment, weight racks, and audio sound system.',
    status: 'Active'
  },
  {
    name: 'Mess Dining Hall Study Alcove',
    category: 'Mess',
    floor: 'Ground Floor',
    block: 'Central Hub',
    capacity: 50,
    noise_level: 'Moderate',
    amenities: '🍫 Vending Machine, 🪑 High Stools, 📶 Wi-Fi Access',
    operating_hours: '06:00 AM - 11:00 PM',
    description: 'Spacious alcove connected to the dining hall with snack machines and open seating.',
    status: 'Active'
  },
  {
    name: 'Top Floor Sky Lounge & Quiet Zone',
    category: 'Lounge',
    floor: '3rd Floor',
    block: 'Block C',
    capacity: 18,
    noise_level: 'Silent',
    amenities: '🌅 Sunset View, 🌿 Indoor Plants, 🪑 Outdoor Deck Benches',
    operating_hours: '06:00 AM - 11:00 PM',
    description: 'Scenic rooftop lounge providing fresh air and panoramic campus views for relaxed studying.',
    status: 'Active'
  },
  {
    name: 'Block A 2nd Floor Quiet Cubicles',
    category: 'Study Hall',
    floor: '2nd Floor',
    block: 'Block A',
    capacity: 16,
    noise_level: 'Silent',
    amenities: '🗄️ Lockable Drawers, 🔌 Individual Outlets, 🤫 Strict Silence Rules',
    operating_hours: '24/7 Open',
    description: 'Individual single-occupancy sound-buffered study booths for intense exam focus.',
    status: 'Active'
  },
  {
    name: 'Block C 1st Floor Hardware & IoT Lab',
    category: 'Computer Lab',
    floor: '1st Floor',
    block: 'Block C',
    capacity: 22,
    noise_level: 'Moderate',
    amenities: '🔬 Oscilloscopes, 🖨️ 3D Printers, 🔌 Soldering Stations',
    operating_hours: '08:00 AM - 10:00 PM',
    description: 'Hands-on engineering lab equipped for robotics, electronics, and hardware prototyping.',
    status: 'Active'
  },
  {
    name: 'Central Campus Innovation Sandbox',
    category: 'Study Hall',
    floor: 'Ground Floor',
    block: 'Central Hub',
    capacity: 35,
    noise_level: 'Moderate',
    amenities: '💡 Smart Boards, ☕ Express Bar, 🛋️ Modular Couches',
    operating_hours: '07:00 AM - 12:00 AM',
    description: 'Collaborative startup space designed for hackathons, group brainstorming, and pitches.',
    status: 'Active'
  },
  {
    name: 'Block B 3rd Floor Intensive Exam Suite',
    category: 'Study Hall',
    floor: '3rd Floor',
    block: 'Block B',
    capacity: 14,
    noise_level: 'Silent',
    amenities: '🎧 Noise-Canceling Headsets, 💡 Eye-Care Lamps, ❄️ Climate Control',
    operating_hours: '24/7 Open',
    description: 'Zero-distraction zone dedicated for competitive exam prep and thesis writing.',
    status: 'Active'
  },
  {
    name: 'Hostel Courtyard Outdoor Reading Bench',
    category: 'Lounge',
    floor: 'Ground Floor',
    block: 'Outdoor',
    capacity: 25,
    noise_level: 'Moderate',
    amenities: '☀️ Solar Power Benches, 🌳 Tree Shade, 📶 Campus Outdoor Wi-Fi',
    operating_hours: '06:00 AM - 10:00 PM',
    description: 'Open-air courtyard seating surrounded by greenery and solar-powered phone charging stations.',
    status: 'Active'
  },
  {
    name: 'Block D Soundproof Music & Media Pod',
    category: 'Lounge',
    floor: '1st Floor',
    block: 'Block D',
    capacity: 10,
    noise_level: 'Moderate',
    amenities: '🎙️ Studio Microphones, 🎸 Acoustics Insulation, 🎧 Audio Monitors',
    operating_hours: '09:00 AM - 09:30 PM',
    description: 'Acoustically treated studio booth for podcast recording, music practice, and video creation.',
    status: 'Active'
  },
  {
    name: 'Recreation & Gaming Arcade',
    category: 'Gym',
    floor: 'Ground Floor',
    block: 'Central Hub',
    capacity: 30,
    noise_level: 'Loud',
    amenities: '🎮 PS5 Console, 🎱 Pool Table, ⚽ Foosball, 📺 4K OLED Displays',
    operating_hours: '10:00 AM - 11:00 PM',
    description: 'High-energy student recreation hub for gaming tournaments, pool, and table tennis.',
    status: 'Active'
  },
  {
    name: 'Terrace Star-Gazing & Quiet Deck',
    category: 'Lounge',
    floor: 'Terrace',
    block: 'Block A',
    capacity: 15,
    noise_level: 'Silent',
    amenities: '🔭 Astronomical Telescope, 🌌 Starlight Lighting, 🪑 Wooden Deck Recliners',
    operating_hours: '07:00 PM - 02:00 AM',
    description: 'Rooftop night deck equipped with telescope and recliners for quiet late-night relaxation.',
    status: 'Active'
  }
];

// Sample activity logs to seed initial live activity stream
const SEED_ACTIVITIES = [
  { user_name: 'Aarav Sharma', action: 'checked into', zone: 'Central Library Silent Reading Room', time: '5 minutes ago' },
  { user_name: 'Priya Verma', action: 'reported "Pin-Drop Silent" for', zone: 'Block B 3rd Floor Intensive Exam Suite', time: '12 minutes ago' },
  { user_name: 'Rohan Gupta', action: 'checked into', zone: 'Digital Innovation & Computer Lab', time: '18 minutes ago' },
  { user_name: 'Ananya Singh', action: 'checked out of', zone: 'Late-Night Quiet Lounge', time: '25 minutes ago' },
  { user_name: 'Vikram Patel', action: 'reported "Moderate Activity" for', zone: 'Academic Group Study Pod A', time: '35 minutes ago' },
  { user_name: 'Sneha Reddy', action: 'checked into', zone: 'Top Floor Sky Lounge & Quiet Zone', time: '42 minutes ago' },
];

export async function initZoneTables() {
  try {
    // Drop old schema tables if needed
    try {
      const checkCol = await get('SELECT amenities FROM study_zones LIMIT 1');
    } catch (colErr) {
      await run('DROP TABLE IF EXISTS noise_reports');
      await run('DROP TABLE IF EXISTS zone_checkins');
      await run('DROP TABLE IF EXISTS study_zones');
    }

    // Create study_zones table
    await run(`
      CREATE TABLE IF NOT EXISTS study_zones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        floor TEXT NOT NULL,
        block TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 20,
        current_occupancy INTEGER NOT NULL DEFAULT 0,
        noise_level TEXT NOT NULL DEFAULT 'Silent',
        amenities TEXT,
        operating_hours TEXT,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create zone_checkins table
    await run(`
      CREATE TABLE IF NOT EXISTS zone_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT,
        checkin_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        checkout_time DATETIME,
        status TEXT NOT NULL DEFAULT 'Active',
        FOREIGN KEY (zone_id) REFERENCES study_zones(id)
      )
    `);

    // Create noise_reports table
    await run(`
      CREATE TABLE IF NOT EXISTS noise_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT,
        noise_level TEXT NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (zone_id) REFERENCES study_zones(id)
      )
    `);

    // Seed default zones if table has fewer than 16 zones
    const existing = await get('SELECT COUNT(*) as count FROM study_zones');
    if (!existing || existing.count < 12) {
      await run('DELETE FROM noise_reports');
      await run('DELETE FROM zone_checkins');
      await run('DELETE FROM study_zones');

      for (const z of DEFAULT_ZONES) {
        // Randomize initial occupancy between 15% and 65% capacity
        const initOccupancy = Math.floor(z.capacity * (0.15 + Math.random() * 0.5));
        await run(`
          INSERT INTO study_zones (name, category, floor, block, capacity, current_occupancy, noise_level, amenities, operating_hours, description, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [z.name, z.category, z.floor, z.block, z.capacity, initOccupancy, z.noise_level, z.amenities, z.operating_hours, z.description, z.status]);
      }

      // Seed initial noise feedback reports
      const zones = await all('SELECT id, name FROM study_zones');
      if (zones && zones.length > 0) {
        await run(`
          INSERT INTO noise_reports (zone_id, user_id, user_name, noise_level, comment)
          VALUES 
          (?, 1, 'Aarav Sharma', 'Silent', 'Very peaceful atmosphere, desk lamps working great!'),
          (?, 2, 'Priya Verma', 'Moderate', 'A few students discussing code near the whiteboard.'),
          (?, 3, 'Rohan Gupta', 'Silent', 'Perfect quiet pod for exam revision.')
        `, [zones[0].id, zones[1].id, zones[2].id]);
      }

      console.log('✅ 16 Default hostel study & common zones seeded with rich metadata!');
    }
  } catch (err) {
    console.error('Error initializing zone tables:', err);
  }
}

/**
 * GET /api/zones - Get all zones with live stats, activity feed, and student active check-in
 */
export async function getZones(req, res) {
  try {
    const zones = await all("SELECT * FROM study_zones WHERE status = 'Active' ORDER BY block ASC, floor ASC");

    // Compute live occupancy % and density badges per zone
    for (const zone of zones) {
      const activeCheckins = await get(
        "SELECT COUNT(*) as cnt FROM zone_checkins WHERE zone_id = ? AND status = 'Active'",
        [zone.id]
      );
      
      const baseOccupancy = Number(zone.current_occupancy || 0);
      const totalOccupancy = Math.min(zone.capacity, baseOccupancy + (activeCheckins ? activeCheckins.cnt : 0));
      const occupancyPercentage = Math.round((totalOccupancy / zone.capacity) * 100);

      zone.live_occupancy = totalOccupancy;
      zone.occupancy_percentage = occupancyPercentage;

      // Density status badge
      if (occupancyPercentage >= 75 || zone.noise_level === 'Loud') {
        zone.density_badge = 'Crowded / High Noise';
        zone.status_color = 'red';
      } else if (occupancyPercentage >= 40 || zone.noise_level === 'Moderate') {
        zone.density_badge = 'Moderate Activity';
        zone.status_color = 'yellow';
      } else {
        zone.density_badge = 'Silent & Quiet';
        zone.status_color = 'green';
      }

      // Fetch recent noise feedback reviews for this zone
      const recentReports = await all(
        `SELECT noise_level, comment, user_name, strftime('%H:%M', created_at) as time_str 
         FROM noise_reports 
         WHERE zone_id = ? 
         ORDER BY created_at DESC LIMIT 3`,
        [zone.id]
      );
      zone.recent_noise_reports = recentReports || [];
    }

    // Check if requesting student has active check-in
    let activeCheckin = null;
    if (req.user) {
      activeCheckin = await get(
        `SELECT zc.*, sz.name as zone_name, sz.block, sz.floor 
         FROM zone_checkins zc 
         JOIN study_zones sz ON zc.zone_id = sz.id 
         WHERE zc.user_id = ? AND zc.status = 'Active' 
         LIMIT 1`,
        [req.user.id]
      );
    }

    // Live Activity Stream (Combine DB check-ins + seed activities)
    const recentCheckins = await all(
      `SELECT zc.user_name, zc.checkin_time, sz.name as zone_name, sz.block 
       FROM zone_checkins zc 
       JOIN study_zones sz ON zc.zone_id = sz.id 
       ORDER BY zc.checkin_time DESC LIMIT 6`
    );

    const liveStream = (recentCheckins && recentCheckins.length > 0)
      ? recentCheckins.map(c => ({
          user_name: c.user_name || 'Resident Student',
          action: 'checked into',
          zone: c.zone_name,
          time: new Date(c.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
      : SEED_ACTIVITIES;

    // AI Recommender: Quietest zone with lowest occupancy
    const recommendedZone = [...zones]
      .filter(z => z.occupancy_percentage < 70 && z.noise_level === 'Silent')
      .sort((a, b) => a.occupancy_percentage - b.occupancy_percentage)[0] || zones[0];

    res.json({
      success: true,
      zones,
      activeCheckin: activeCheckin || null,
      recommendedZone: recommendedZone || null,
      liveStream
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/zones/checkin - Check into a study/common zone
 */
export async function checkInZone(req, res) {
  try {
    const { zone_id } = req.body;
    if (!zone_id) return res.status(400).json({ success: false, message: 'Zone ID is required.' });

    const zone = await get('SELECT * FROM study_zones WHERE id = ?', [zone_id]);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found.' });

    // Check-out any existing active check-in for this user
    await run(
      `UPDATE zone_checkins 
       SET status = 'CheckedOut', checkout_time = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND status = 'Active'`,
      [req.user.id]
    );

    // Insert new check-in
    await run(
      `INSERT INTO zone_checkins (zone_id, user_id, user_name, status)
       VALUES (?, ?, ?, 'Active')`,
      [zone.id, req.user.id, req.user.name]
    );

    // Update current occupancy
    await run('UPDATE study_zones SET current_occupancy = current_occupancy + 1 WHERE id = ?', [zone.id]);

    res.json({
      success: true,
      message: `Successfully checked into ${zone.name} (${zone.floor}, ${zone.block})!`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/zones/checkout - Check out of current active zone
 */
export async function checkOutZone(req, res) {
  try {
    const activeCheckin = await get(
      "SELECT * FROM zone_checkins WHERE user_id = ? AND status = 'Active' LIMIT 1",
      [req.user.id]
    );

    if (!activeCheckin) {
      return res.status(400).json({ success: false, message: 'You have no active check-in.' });
    }

    await run(
      `UPDATE zone_checkins 
       SET status = 'CheckedOut', checkout_time = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [activeCheckin.id]
    );

    // Decrement current occupancy safely
    await run(
      'UPDATE study_zones SET current_occupancy = MAX(0, current_occupancy - 1) WHERE id = ?',
      [activeCheckin.zone_id]
    );

    res.json({
      success: true,
      message: 'Successfully checked out of the zone.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/zones/report-noise - Report noise level for a zone
 */
export async function reportNoise(req, res) {
  try {
    const { zone_id, noise_level, comment } = req.body;
    if (!zone_id || !noise_level) {
      return res.status(400).json({ success: false, message: 'Zone ID and noise level (Silent, Moderate, Loud) are required.' });
    }

    const zone = await get('SELECT * FROM study_zones WHERE id = ?', [zone_id]);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found.' });

    // Insert noise report
    await run(
      `INSERT INTO noise_reports (zone_id, user_id, user_name, noise_level, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [zone_id, req.user.id, req.user.name, noise_level, comment || '']
    );

    // Update zone noise_level directly
    await run('UPDATE study_zones SET noise_level = ? WHERE id = ?', [noise_level, zone_id]);

    res.json({
      success: true,
      message: `Noise feedback reported as "${noise_level}" for ${zone.name}. Thank you!`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/zones/seed - Force re-seed default study zones (Admin/Warden)
 */
export async function seedZones(req, res) {
  try {
    await run('DELETE FROM noise_reports');
    await run('DELETE FROM zone_checkins');
    await run('DELETE FROM study_zones');

    for (const z of DEFAULT_ZONES) {
      const initOccupancy = Math.floor(z.capacity * (0.15 + Math.random() * 0.5));
      await run(`
        INSERT INTO study_zones (name, category, floor, block, capacity, current_occupancy, noise_level, amenities, operating_hours, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [z.name, z.category, z.floor, z.block, z.capacity, initOccupancy, z.noise_level, z.amenities, z.operating_hours, z.description, z.status]);
    }

    res.json({ success: true, message: 'Study zones successfully reset and re-seeded with 16 venues.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
