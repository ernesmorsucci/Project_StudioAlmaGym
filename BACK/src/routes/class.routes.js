import { Router } from "express";
import { 
    getAllClasses, getClassById, addClass, updateClass, deleteClass, getClassesByDate,
    getProfessorReport // <- IMPORTA EL NUEVO CONTROLADOR
} from "../controllers/class.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const classRouter = Router();

// Rutas de lectura (Cualquier usuario logueado)
classRouter.get("/", isAuthenticated, getAllClasses);
classRouter.get("/filter", isAuthenticated, getClassesByDate);

// NUEVO: Ruta para el reporte de productividad (Profesores y Admin)
classRouter.get("/report/:professorId", isAuthenticated, checkRole(['profesor', 'admin']), getProfessorReport);

classRouter.get("/:cid", isAuthenticated, getClassById);

// Rutas de escritura (Solo Admin)
classRouter.post("/", isAuthenticated, checkRole(['admin']), addClass);
classRouter.put("/:cid", isAuthenticated, checkRole(['admin']), updateClass);
classRouter.delete("/:cid", isAuthenticated, checkRole(['admin']), deleteClass);

export default classRouter;