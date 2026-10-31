import crypto from 'crypto';
import { get, all, run } from '../database/db.js';
import { createNotification } from './notificationController.js';
import { sendDepressionReportToAdmin, sendApprovalNotificationToStudent } from '../services/emailService.js';

export function getVerificationToken(screeningId) {
  const secret = process.env.JWT_SECRET || 'apex-hostel-jwt-secret-key-2026-btech-cse';
  return crypto.createHmac('sha256', secret).update(`verify-wellness-${screeningId}`).digest('hex').substring(0, 24);
}

export const PHQ9_QUESTIONS = [
  {
    id: 1,
    question: "Little interest or pleasure in doing things (Kisi kaam me dil ya khushi na lagna)",
    short: "Little interest/pleasure"
  },
  {
    id: 2,
    question: "Feeling down, depressed, or hopeless (Udaasi, mayoosi ya nirasha mehsoos hona)",
    short: "Depressed/hopeless mood"
  },
  {
    id: 3,
    question: "Trouble falling or staying asleep, or sleeping too much (Neend na aana, baar-baar tootna ya bohot zyada sona)",
    short: "Sleep difficulties"
  },
  {
    id: 4,
    question: "Feeling tired or having little energy (Thakaan ya bina energy ke mehsoos karna)",
    short: "Low energy/fatigue"
  },
  {
    id: 5,
    question: "Poor appetite or overeating (Bhookh bilkul na lagna ya emotional overeating)",
    short: "Appetite changes"
  },
  {
    id: 6,
    question: "Feeling bad about yourself — that you are a failure or have let down family (Apne aap ko bekaar ya parivaar ko nirash karne wala samajhna)",
    short: "Feelings of worthlessness/failure"
  },
  {
    id: 7,
    question: "Trouble concentrating on things, such as studying or reading (Padhai, classes ya rozmarra ke kaamon me focus na kar pana)",
    short: "Concentration troubles"
  },
  {
    id: 8,
    question: "Moving or speaking slowly, or being so restless/fidgety that others noticed (Bohot dheeme bolna/chalna ya andar se bechaini)",
    short: "Psychomotor agitation/retardation"
  },
  {
    id: 9,
    question: "Thoughts that you would be better off dead, or thoughts of hurting yourself (Aise khayal aana ki zindagi se behtar maut hai ya khud ko chot pahunchana)",
    short: "Self-harm / Suicidal ideation"
  }
];

export const RESPONSE_OPTIONS = [
  { score: 0, label: "Not at all (Kabhi nahi)", desc: "0 din" },
  { score: 1, label: "Several days (Kuch din)", desc: "1-6 din" },
  { score: 2, label: "More than half the days (Aadhe se zyada din)", desc: "7-11 din" },
  { score: 3, label: "Nearly every day (Lagbhag rozana)", desc: "12-14 din" }
];

export function calculatePHQ9Severity(totalScore) {
  if (totalScore <= 4) {
    return {
      severity: 'Minimal',
      color: 'emerald',
      description: 'Minimal or no depressive symptoms. Your emotional well-being is currently in a healthy range.',
      actionGuide: 'Maintain your healthy routine, regular sleep, physical activities, and stay connected with friends.'
    };
  } else if (totalScore <= 9) {
    return {
      severity: 'Mild',
      color: 'amber',
      description: 'Mild depressive symptoms detected. You may be experiencing temporary academic pressure, fatigue, or stress.',
      actionGuide: 'Practice daily mindfulness, structured sleep schedule, talk with close roommates or student mentors.'
    };
  } else if (totalScore <= 14) {
    return {
      severity: 'Moderate',
      color: 'orange',
      description: 'Moderate depressive symptoms identified. Emotional stress is beginning to noticeably interfere with studies and daily campus life.',
      actionGuide: 'A confidential 1-on-1 counseling session is strongly recommended to build personalized coping strategies.'
    };
  } else if (totalScore <= 19) {
    return {
      severity: 'Moderately Severe',
      color: 'rose',
      description: 'Moderately severe depressive symptoms. Persistent sadness, loss of vitality, and self-doubt require timely professional support.',
      actionGuide: 'Our resident student counselor will review your assessment and prioritize a scheduled supportive meeting.'
    };
  } else {
    return {
      severity: 'Severe',
      color: 'red',
      description: 'Severe depressive symptoms detected. You are dealing with significant emotional pain and distress.',
      actionGuide: 'Immediate compassionate support is prioritized. Please know you are not alone; we are here with immediate confidential care.'
    };
  }
}

/**
 * 1. Submit Free Depression Screening Test (Student / Resident)
 */
export async function submitDepressionScreening(req, res) {
  try {
    const {
      name,
      email,
      phone,
      roll_number,
      block_name,
      room_number,
      answers, // array of numbers [0..3] of length 9 or objects { questionId, score }
      notes,
      counseling_requested,
      preferred_mode
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Student Name is required.' });
    }

    if (!email || !email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required so we can notify you.' });
    }

    if (!answers || !Array.isArray(answers) || answers.length !== 9) {
      return res.status(400).json({ success: false, message: 'Please answer all 9 standard questions.' });
    }

    // Calculate score & build detailed answer records
    let totalScore = 0;
    const detailedAnswers = [];

    for (let i = 0; i < 9; i++) {
      const q = PHQ9_QUESTIONS[i];
      let rawScore = 0;
      if (typeof answers[i] === 'object' && answers[i] !== null) {
        rawScore = Number(answers[i].score) || 0;
      } else {
        rawScore = Number(answers[i]) || 0;
      }

      const score = Math.max(0, Math.min(3, rawScore));
      totalScore += score;

      const opt = RESPONSE_OPTIONS.find(o => o.score === score) || RESPONSE_OPTIONS[0];
      detailedAnswers.push({
        questionId: q.id,
        question: q.question,
        short: q.short,
        score,
        label: opt.label
      });
    }

    const severityInfo = calculatePHQ9Severity(totalScore);

    // Optional logged-in user link, or auto-lookup by roll_number or email
    let userId = req.user ? req.user.id : null;
    let studentId = null;

    if (userId) {
      const studentRow = await get('SELECT id FROM students WHERE user_id = ?', [userId]);
      if (studentRow) studentId = studentRow.id;
    } else {
      if (roll_number) {
        const studentRow = await get('SELECT id, user_id FROM students WHERE roll_number = ? COLLATE NOCASE', [roll_number.trim()]);
        if (studentRow) {
          studentId = studentRow.id;
          userId = studentRow.user_id;
        }
      }
      if (!userId && email) {
        const userRow = await get('SELECT id FROM users WHERE email = ? COLLATE NOCASE', [email.trim()]);
        if (userRow) userId = userRow.id;
      }
    }

    // Insert into database
    const result = await run(
      `INSERT INTO depression_screenings (
        student_id, user_id, name, email, phone, roll_number, block_name, room_number,
        total_score, severity, answers_json, notes, counseling_requested, preferred_mode, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        studentId,
        userId,
        name.trim(),
        email.trim().toLowerCase(),
        (phone || '').trim(),
        (roll_number || '').trim().toUpperCase(),
        (block_name || '').trim(),
        (room_number || '').trim(),
        totalScore,
        severityInfo.severity,
        JSON.stringify(detailedAnswers),
        (notes || '').trim(),
        counseling_requested !== false ? 1 : 0,
        preferred_mode || 'In-Person'
      ]
    );

    const screeningId = result.lastInsertRowid || result.insertId;
    const verificationToken = getVerificationToken(screeningId);

    // Send automatic email notification to Admin (nikhilsheoran093@gmail.com) with 1-click verification link
    sendDepressionReportToAdmin({
      screeningId,
      token: verificationToken,
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      roll_number: (roll_number || '').trim().toUpperCase(),
      block_name: (block_name || '').trim(),
      room_number: (room_number || '').trim(),
      total_score: totalScore,
      severity: severityInfo.severity,
      answers: detailedAnswers,
      notes: (notes || '').trim(),
      counseling_requested: counseling_requested !== false,
      preferred_mode: preferred_mode || 'In-Person'
    }).catch(err => console.error('Background admin report email error:', err.message));

    // Send in-app notification if user is logged in
    if (userId) {
      await createNotification(
        userId,
        '🌱 Wellness Screening Submitted',
        `Your confidential mental health assessment has been received (Score: ${totalScore}/27). Our Student Welfare Counselor will review your request.`,
        'wellness',
        '/student/wellness'
      );
    }

    res.status(201).json({
      success: true,
      screeningId,
      totalScore,
      severity: severityInfo.severity,
      severityInfo,
      message: 'Your confidential screening test has been submitted. Details have been automatically dispatched to Counselor nikhilsheoran093@gmail.com. You will receive an email notification when your counseling session is approved.',
      helpline: {
        teleManas: '14416',
        vandrevala: '+91 9999 666 555',
        nimhans: '080 4611 0007'
      }
    });
  } catch (err) {
    console.error('Error submitting depression screening:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * 2. Get All Submissions (Admin / Warden)
 */
export async function getAllScreenings(req, res) {
  try {
    const { status, severity, search } = req.query;

    let sql = `
      SELECT ds.*, 
             u.name as registered_user_name,
             u.avatar_url as student_avatar
      FROM depression_screenings ds
      LEFT JOIN users u ON u.id = ds.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += ` AND ds.status = ?`;
      params.push(status);
    }

    if (severity && severity !== 'All') {
      sql += ` AND ds.severity = ?`;
      params.push(severity);
    }

    if (search && search.trim()) {
      sql += ` AND (ds.name LIKE ? OR ds.roll_number LIKE ? OR ds.email LIKE ? OR ds.phone LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY ds.created_at DESC`;

    const screenings = await all(sql, params);

    // Parse answers JSON
    const parsedScreenings = screenings.map(s => {
      let answers = [];
      try {
        answers = JSON.parse(s.answers_json);
      } catch (e) {
        answers = [];
      }
      return {
        ...s,
        answers
      };
    });

    // Summary KPIs
    const totalCount = (await get('SELECT COUNT(*) as count FROM depression_screenings'))?.count || 0;
    const pendingCount = (await get("SELECT COUNT(*) as count FROM depression_screenings WHERE status = 'Pending'"))?.count || 0;
    const approvedCount = (await get("SELECT COUNT(*) as count FROM depression_screenings WHERE status = 'Approved'"))?.count || 0;
    const severeCount = (await get("SELECT COUNT(*) as count FROM depression_screenings WHERE severity IN ('Severe', 'Moderately Severe')"))?.count || 0;

    res.json({
      success: true,
      screenings: parsedScreenings,
      summary: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        severe: severeCount
      }
    });
  } catch (err) {
    console.error('Error fetching depression screenings:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * 3. Approve & Schedule Counseling Session (Admin / Warden)
 * Automatically sends notification email to student's entered email
 */
export async function approveCounselingSession(req, res) {
  try {
    const { id } = req.params;
    const { session_time, counselor_name, session_venue, admin_notes } = req.body;

    const screening = await get('SELECT * FROM depression_screenings WHERE id = ?', [id]);
    if (!screening) {
      return res.status(404).json({ success: false, message: 'Screening submission not found.' });
    }

    const assignedCounselor = counselor_name || req.user?.name || 'Chief Student Welfare Counselor';
    const scheduledTime = session_time || 'Mutually coordinated appointment (Check email)';
    const venue = session_venue || 'Campus Wellness Centre (Room 102) / Telephonic Session';
    const notesText = admin_notes || 'We are here to support you in every step. Take care!';

    await run(
      `UPDATE depression_screenings
       SET status = 'Approved',
           session_time = ?,
           counselor_name = ?,
           session_venue = ?,
           admin_notes = ?,
           approved_by_user_id = ?,
           approved_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        scheduledTime,
        assignedCounselor,
        venue,
        notesText,
        req.user?.id || null,
        id
      ]
    );

    // Send email notification to student's entered email!
    sendApprovalNotificationToStudent(screening.email, {
      name: screening.name,
      session_time: scheduledTime,
      counselor_name: assignedCounselor,
      session_venue: venue,
      preferred_mode: screening.preferred_mode || 'In-Person',
      admin_notes: notesText
    }).catch(err => console.error('Student approval email error:', err.message));

    // Send in-app notification if student is registered in the system
    if (screening.user_id) {
      await createNotification(
        screening.user_id,
        '💚 Counselor Verification Complete',
        'Your details are verified by counselor. They will call you soon.',
        'wellness',
        '/student/wellness'
      );
    }

    res.json({
      success: true,
      message: `Counseling session approved! Notification email has been automatically dispatched to ${screening.email}.`,
      displayMessage: 'Your details are verified by counselor. They will call you soon.',
      updated: {
        id,
        status: 'Approved',
        session_time: scheduledTime,
        counselor_name: assignedCounselor,
        session_venue: venue
      }
    });
  } catch (err) {
    console.error('Error approving counseling session:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * 4. Get Current Student's Past Screenings
 */
export async function getMyScreenings(req, res) {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    const list = await all(
      `SELECT * FROM depression_screenings 
       WHERE user_id = ? OR email = ?
       ORDER BY created_at DESC`,
      [userId || -1, email || '']
    );

    const parsed = list.map(item => {
      let answers = [];
      try {
        answers = JSON.parse(item.answers_json);
      } catch (e) {
        answers = [];
      }
      return {
        ...item,
        answers,
        severityInfo: calculatePHQ9Severity(item.total_score),
        displayMessage: item.status === 'Approved'
          ? 'Your details are verified by counselor. They will call you soon.'
          : 'Your details are being reviewed by the counselor.'
      };
    });

    res.json({
      success: true,
      data: parsed
    });
  } catch (err) {
    console.error('Error in getMyScreenings:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * 5. Get Email Dispatch Logs (Admin / Warden audit)
 */
export async function getEmailAuditLogs(req, res) {
  try {
    const logs = await all(`SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 50`);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * 6. Direct 1-Click Verification Link from Counselor's Email
 * Allows Counselor to click from Gmail on mobile/laptop to verify assessment instantly.
 */
export async function verifyByEmail(req, res) {
  try {
    const { id, token } = req.query;
    if (!id || !token) {
      return res.status(400).send('<h3>Invalid verification parameters.</h3>');
    }

    const expectedToken = getVerificationToken(id);
    if (token !== expectedToken) {
      return res.status(403).send('<h3>Invalid or expired verification token.</h3>');
    }

    const screening = await get('SELECT * FROM depression_screenings WHERE id = ?', [id]);
    if (!screening) {
      return res.status(404).send('<h3>Assessment record not found.</h3>');
    }

    const assignedCounselor = 'Dr. Nikhil Sheoran (Student Counselor)';
    const scheduledTime = 'Within 24 hours (Telephonic / In-Person)';
    const venue = screening.preferred_mode === 'Video Call' ? 'Video Call' : (screening.preferred_mode === 'Phone Call' ? 'Telephonic Call' : 'Student Counseling Chamber (Block A)');
    const notesText = 'Verified by Counselor directly via Email. Will call student soon.';

    await run(
      `UPDATE depression_screenings
       SET status = 'Approved',
           session_time = ?,
           counselor_name = ?,
           session_venue = ?,
           admin_notes = ?,
           approved_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [scheduledTime, assignedCounselor, venue, notesText, id]
    );

    // Send in-app notification to student if registered
    if (screening.user_id) {
      await createNotification(
        screening.user_id,
        '💚 Counselor Verification Complete',
        'Your details are verified by counselor. They will call you soon.',
        'wellness',
        '/student/wellness'
      );
    }

    // Return responsive HTML confirmation page for Counselor
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Assessment Verified - Apex Smart Hostel</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #f0fdf4;
          margin: 0;
          padding: 24px 16px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card {
          background: #ffffff;
          max-width: 520px;
          width: 100%;
          border-radius: 24px;
          padding: 32px 24px;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);
          border: 2px solid #86efac;
          text-align: center;
        }
        .icon {
          width: 72px;
          height: 72px;
          background: #dcfce7;
          color: #16a34a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto 20px;
        }
        h1 {
          color: #065f46;
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 8px;
        }
        p {
          color: #475569;
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 20px;
        }
        .banner {
          background: #ecfdf5;
          border: 1.5px dashed #10b981;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: left;
        }
        .badge {
          display: inline-block;
          background: #10b981;
          color: white;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .msg {
          font-size: 15px;
          font-weight: 700;
          color: #065f46;
          margin: 0 0 4px;
        }
        .subtext {
          font-size: 12px;
          color: #047857;
          margin: 0;
        }
        .student-info {
          background: #f8fafc;
          border-radius: 12px;
          padding: 14px;
          font-size: 13px;
          color: #334155;
          margin-bottom: 20px;
          text-align: left;
        }
        .student-info div { margin-bottom: 6px; }
        .student-info div:last-child { margin-bottom: 0; }
        .btn-call {
          display: inline-block;
          width: 100%;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 20px;
          border-radius: 14px;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">✓</div>
        <h1>Student Details Verified!</h1>
        <p>You have approved this counseling request. The website has updated in real-time for the student.</p>
        
        <div class="banner">
          <div class="badge">Live On Student Website</div>
          <div class="msg">"Your details are verified by counselor. They will call you soon."</div>
          <p class="subtext">The student will see this status across their portal and notifications.</p>
        </div>

        <div class="student-info">
          <div><strong>Student:</strong> ${screening.name}</div>
          <div><strong>Roll Number:</strong> ${screening.roll_number || 'N/A'}</div>
          <div><strong>Hostel:</strong> ${screening.block_name || 'Block'} - Room ${screening.room_number || 'N/A'}</div>
          <div><strong>Severity:</strong> ${screening.severity} (${screening.total_score}/27)</div>
          <div><strong>Preferred Mode:</strong> ${screening.preferred_mode || 'Phone Call'}</div>
          <div><strong>Phone:</strong> <a href="tel:${screening.phone}">${screening.phone || 'N/A'}</a></div>
        </div>

        ${screening.phone ? `<a href="tel:${screening.phone}" class="btn-call">📞 Call Student Now (${screening.phone})</a>` : ''}
      </div>
    </body>
    </html>
    `);
  } catch (err) {
    console.error('Error verifying screening by email:', err);
    res.status(500).send(`<h3>Verification error: ${err.message}</h3>`);
  }
}

/**
 * 7. Track Assessment Status (Public / Student)
 * Allows any student to check their status using Roll Number, Phone, or ID
 */
export async function trackScreeningStatus(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Please provide roll number, phone, email, or screening ID to track.' });
    }

    const q = query.trim();
    const screening = await get(`
      SELECT id, name, roll_number, email, phone, block_name, room_number,
             total_score, severity, status, counselor_name, session_time, session_venue,
             admin_notes, approved_at, created_at
      FROM depression_screenings
      WHERE id = ? 
         OR roll_number = ? COLLATE NOCASE 
         OR phone = ? 
         OR email = ? COLLATE NOCASE
      ORDER BY id DESC LIMIT 1
    `, [isNaN(Number(q)) ? -1 : Number(q), q, q, q]);

    if (!screening) {
      return res.status(404).json({
        success: false,
        message: 'No assessment record found for this Roll Number / Phone.'
      });
    }

    const isApproved = screening.status === 'Approved';

    res.json({
      success: true,
      screening: {
        id: screening.id,
        name: screening.name,
        roll_number: screening.roll_number,
        status: screening.status,
        severity: screening.severity,
        total_score: screening.total_score,
        counselor_name: screening.counselor_name || 'Dr. Nikhil Sheoran (Student Counselor)',
        session_time: screening.session_time,
        session_venue: screening.session_venue,
        approved_at: screening.approved_at,
        created_at: screening.created_at,
        displayMessage: isApproved
          ? 'Your details are verified by counselor. They will call you soon.'
          : 'Your details are being reviewed by the counselor.'
      }
    });
  } catch (err) {
    console.error('Error tracking screening status:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
