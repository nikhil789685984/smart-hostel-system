import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { get } from '../database/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  submitDepressionScreening,
  getAllScreenings,
  approveCounselingSession,
  getMyScreenings,
  getEmailAuditLogs,
  verifyByEmail,
  trackScreeningStatus,
  PHQ9_QUESTIONS,
  RESPONSE_OPTIONS
} from '../controllers/wellnessController.js';

const router = Router();

// Soft/Optional authentication helper
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await get('SELECT id, name, email, role, phone, avatar_url FROM users WHERE id = ?', [decoded.id]);
      if (user) {
        req.user = user;
        if (user.role === 'student') {
          const student = await get('SELECT id, roll_number FROM students WHERE user_id = ?', [user.id]);
          if (student) {
            req.user.student = student;
            req.user.student_id = student.id;
          }
        }
      }
    }
  } catch (err) {
    // Ignore invalid token for public test
  }
  next();
}

// 1. Public / Student: Metadata (Questions & Scale)
router.get('/questions', (req, res) => {
  res.json({
    success: true,
    questions: PHQ9_QUESTIONS,
    options: RESPONSE_OPTIONS,
    disclaimer: 'This screening tool is for informational and supportive counseling purposes. It is completely confidential and free for all students.'
  });
});

// 2. Submit Free Depression Screening Test (Sends email to nikhilsheoran093@gmail.com)
router.post('/depression-test', optionalAuth, submitDepressionScreening);
router.post('/submit', optionalAuth, submitDepressionScreening);

// Direct 1-Click Verification from Counselor Email
router.get('/email-verify', verifyByEmail);

// Track Assessment Status (Public / Any Student)
router.get('/track', trackScreeningStatus);

// 3. Student's own past submissions & appointment statuses
router.get('/my-screenings', authenticate, getMyScreenings);

// 4. Admin & Warden Management Endpoints
router.get('/admin/screenings', authenticate, requireRole(['admin', 'warden']), getAllScreenings);
router.post('/admin/screenings/:id/approve', authenticate, requireRole(['admin', 'warden']), approveCounselingSession);
router.get('/admin/email-logs', authenticate, requireRole(['admin']), getEmailAuditLogs);

export default router;
