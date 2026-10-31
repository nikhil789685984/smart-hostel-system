import { Router } from 'express';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getMaterials,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  toggleFavorite
} from '../controllers/studyHubController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Subjects CRUD
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Materials CRUD
router.get('/materials', getMaterials);
router.post('/materials', uploadMaterial);
router.put('/materials/:id', updateMaterial);
router.delete('/materials/:id', deleteMaterial);
router.patch('/materials/:id/favorite', toggleFavorite);

export default router;
