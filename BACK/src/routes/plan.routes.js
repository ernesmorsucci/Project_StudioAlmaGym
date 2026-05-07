import { Router } from "express";
import { 
    getAllPlans, 
    getPlanById, 
    addPlan, 
    updatePlan, 
    deletePlan,
    getActivePlans
} from "../controllers/plan.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const planRouter = Router();

/**
 * RUTAS DE PLANES (Oferta comercial del estudio)
 */

// ==========================================
// RUTAS PÚBLICAS/ALUMNAS
// ==========================================

// 1. Ver solo los planes que están actualmente a la venta
// Importante: Va antes de /:pid para evitar conflictos
planRouter.get("/active", isAuthenticated, getActivePlans);

// 2. Ver el detalle de un plan específico
planRouter.get("/:pid", isAuthenticated, getPlanById);


// ==========================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin)
// ==========================================

// 3. Ver todos los planes, incluso los archivados/inactivos (Solo Admin)
planRouter.get("/", isAuthenticated, checkRole(['admin']), getAllPlans);

// 4. Crear un nuevo plan (Solo Admin)
planRouter.post("/", isAuthenticated, checkRole(['admin']), addPlan);

// 5. Editar un plan existente (Solo Admin)
// Nota: Aquí se puede usar para activar/desactivar el plan (isActive: true/false)
planRouter.put("/:pid", isAuthenticated, checkRole(['admin']), updatePlan);

// 6. Eliminar permanentemente un plan de la base de datos (Solo Admin)
// Tal como acordamos, esto realiza un borrado físico.
planRouter.delete("/:pid", isAuthenticated, checkRole(['admin']), deletePlan);

export default planRouter;