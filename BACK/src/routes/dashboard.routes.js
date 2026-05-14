import { Router } from 'express';
// 1. IMPORTACIÓN CON LLAVES VITAL (Esto evita el 404 y el 500)
import { getStudentDashboard, getProfessorDashboard, getAdminDashboard } from '../controllers/dashboard.controller.js';
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const dashboardRouter = Router();

// 2. RUTAS PROTEGIDAS Y ROLES CORREGIDOS
// Verificamos el rol 'alumno' para que el guardia de seguridad te deje pasar
dashboardRouter.get('/student', isAuthenticated, checkRole(['alumno', 'admin']), getStudentDashboard);
dashboardRouter.get('/professor', isAuthenticated, checkRole(['professor', 'admin']), getProfessorDashboard);
dashboardRouter.get('/admin', isAuthenticated, checkRole(['admin']), getAdminDashboard);

export default dashboardRouter;