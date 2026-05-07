import { Router } from "express";
import { 
    getAllSchedules, 
    getScheduleById, 
    addSchedule, 
    updateSchedule, 
    deleteSchedule,
    getSchedulesByProfessor 
} from "../controllers/recurrentSchedule.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const recurrentRouter = Router();

/**
 * RUTAS DE PLANTILLAS DE HORARIOS (Recurrent Schedules)
 */

// ==========================================
// RUTAS DE FILTROS (Alta Prioridad)
// ==========================================

// 1. Obtener los horarios fijos de un profesor específico
// Útil para que el profesor vea su disponibilidad semanal
recurrentRouter.get("/professor/:professorId", isAuthenticated, getSchedulesByProfessor);


// ==========================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin)
// ==========================================

// 2. Ver todas las plantillas configuradas en el sistema
recurrentRouter.get("/", isAuthenticated, checkRole(['admin']), getAllSchedules);

// 3. Ver el detalle de una plantilla específica
recurrentRouter.get("/:rid", isAuthenticated, checkRole(['admin']), getScheduleById);

// 4. Crear una nueva regla de horario semanal
recurrentRouter.post("/", isAuthenticated, checkRole(['admin']), addSchedule);

// 5. Actualizar una plantilla (ej: cambiar hora de inicio o días)
recurrentRouter.put("/:rid", isAuthenticated, checkRole(['admin']), updateSchedule);

// 6. Eliminar permanentemente la plantilla
// TODO: Considerar el impacto en clases ya generadas que referencian este ID
recurrentRouter.delete("/:rid", isAuthenticated, checkRole(['admin']), deleteSchedule);

export default recurrentRouter;