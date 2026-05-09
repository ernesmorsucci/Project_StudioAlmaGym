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
 * 
 * ORDEN IMPORTANTE:
 * Las rutas específicas (/active) deben ir ANTES de las rutas con parámetro (/:pid)
 * para que Express no interprete "active" como un ID.
 * La ruta raíz (/) va al final de los GETs para mayor claridad, aunque Express
 * no tiene conflicto con ella al ser una ruta exacta sin parámetro.
 */

// ==========================================
// RUTAS ESPECÍFICAS (van antes que /:pid)
// ==========================================

// 1. Ver solo los planes activos (Alumnos - Precio/Oferta del estudio)
planRouter.get("/active", isAuthenticated, getActivePlans);

// ==========================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin)
// ==========================================

// 2. Ver TODOS los planes, incluso inactivos/archivados (Solo Admin)
planRouter.get("/", isAuthenticated, checkRole(['admin']), getAllPlans);

// 3. Crear un nuevo plan (Solo Admin)
planRouter.post("/", isAuthenticated, checkRole(['admin']), addPlan);

// ==========================================
// RUTAS CON PARÁMETRO (van al final para no capturar rutas fijas)
// ==========================================

// 4. Ver el detalle de un plan específico
planRouter.get("/:pid", isAuthenticated, getPlanById);

// 5. Editar un plan (Solo Admin - también para activar/desactivar con isActive)
planRouter.put("/:pid", isAuthenticated, checkRole(['admin']), updatePlan);

// 6. Eliminar permanentemente un plan (Solo Admin - borrado físico)
planRouter.delete("/:pid", isAuthenticated, checkRole(['admin']), deletePlan);

export default planRouter;