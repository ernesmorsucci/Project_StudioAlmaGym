import { Router } from 'express';
import { createSchedule, getAllSchedules, updateSchedule, deleteSchedule } from '../controllers/recurrentSchedule.controller.js';
import { isAuthenticated, checkRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', isAuthenticated, checkRole(['admin']), createSchedule);
router.get('/', isAuthenticated, checkRole(['admin']), getAllSchedules);
router.put('/:id', isAuthenticated, checkRole(['admin']), updateSchedule);   // <-- NUEVA
router.delete('/:id', isAuthenticated, checkRole(['admin']), deleteSchedule); // <-- NUEVA

export default router;