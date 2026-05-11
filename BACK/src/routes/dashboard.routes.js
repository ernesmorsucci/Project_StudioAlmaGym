import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = Router();

// 🔒 Todas estas rutas ahora están protegidas por isAuthenticated
// El middleware se asegura de inyectar los datos en "req.user"
router.get('/student', isAuthenticated, dashboardController.getStudentDashboard);
router.get('/professor', isAuthenticated, dashboardController.getProfessorDashboard);
router.get('/admin', isAuthenticated, dashboardController.getAdminDashboard);

export default router;