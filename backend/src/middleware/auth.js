import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { get } from '../database/db.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await get('SELECT id, name, email, role, phone, avatar_url FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
    }

    req.user = user;

    // Attach student profile if role is student
    if (user.role === 'student') {
      const student = await get('SELECT id, roll_number, course, branch, year, semester, checkin_date, status FROM students WHERE user_id = ?', [user.id]);
      if (student) {
        req.user.student = student;
        req.user.student_id = student.id;
      }
    }

    // Attach warden profile if role is warden
    if (user.role === 'warden') {
      const warden = await get('SELECT id, employee_id, assigned_hostel_id, department, office_location FROM wardens WHERE user_id = ?', [user.id]);
      if (warden) {
        req.user.warden = warden;
        req.user.warden_id = warden.id;
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authorization token.' });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
}
