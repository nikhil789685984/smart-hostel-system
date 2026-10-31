import { Router } from 'express';
import { getDashboard } from '../controllers/studentController.js';
import { getMaterials, uploadMaterial, deleteMaterial } from '../controllers/studyHubController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['student']));

router.get('/dashboard', getDashboard);

// Study Hub Routes
router.get('/study-materials', getMaterials);
router.post('/study-materials', uploadMaterial);
router.delete('/study-materials/:id', deleteMaterial);

export default router;
