import { Router } from "express";
import { getAdminDashboard, getProfessorDashboard } from "../controllers/dashboard.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const dashboardRouter = Router();

dashboardRouter.get("/admin", isAuthenticated, checkRole(['admin']), getAdminDashboard);
dashboardRouter.get("/professor", isAuthenticated, checkRole(['profesor', 'admin']), getProfessorDashboard);

export default dashboardRouter;