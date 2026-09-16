import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getStaffAccount, processSalary, processGlobalSalaryRun } from '../controllers/salaryController.js';

const router = express.Router();

router.get('/my-account', authenticate, requireRole(['warden', 'admin']), getStaffAccount);
router.post('/process', authenticate, requireRole(['admin']), processSalary);
router.post('/process-all', authenticate, requireRole(['admin']), processGlobalSalaryRun);

export default router;
