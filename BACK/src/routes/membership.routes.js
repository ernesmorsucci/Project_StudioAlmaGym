import { Router } from "express";
import { 
    getAllMemberships, 
    getMembershipById, 
    addMembership, 
    updateMembership, 
    deleteMembership,
    getStudentActiveMembership,
    getExpiringMemberships
} from "../controllers/membership.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const membershipRouter = Router();

/**
 * RUTAS DE MEMBRESÍAS (Paquetes de clases)
 */

// ==========================================
// RUTAS DE ALTA PRIORIDAD (Específicas)
// Deben ir antes de las rutas con /:mid para que Express no se confunda
// ==========================================

// 1. Obtener membresías a punto de vencer (Solo Admin - Dashboard)
membershipRouter.get("/expiring", isAuthenticated, checkRole(['admin']), getExpiringMemberships);

// 2. Obtener la membresía activa de un alumno en particular
// TODO: Validar que el alumno que hace la petición sea el dueño del :uid (o que sea Admin)
membershipRouter.get("/student/:uid", isAuthenticated, getStudentActiveMembership);


// ==========================================
// RUTAS ESTÁNDAR (CRUD)
// ==========================================

// 3. Ver todas las membresías de todos los alumnos (Solo Admin)
membershipRouter.get("/", isAuthenticated, checkRole(['admin']), getAllMemberships);

// 4. Ver el detalle de una membresía específica (Admin o dueño)
membershipRouter.get("/:mid", isAuthenticated, getMembershipById);

// 5. Crear una nueva membresía manualmente (Solo Admin)
// Nota: En la vida real, a veces esto se crea automáticamente al confirmar un pago.
membershipRouter.post("/", isAuthenticated, checkRole(['admin']), addMembership);

// 6. Actualizar o ajustar una membresía (Solo Admin - ej: regalarle una clase extra)
membershipRouter.put("/:mid", isAuthenticated, checkRole(['admin']), updateMembership);

// 7. Eliminar físicamente una membresía (Solo Admin)
membershipRouter.delete("/:mid", isAuthenticated, checkRole(['admin']), deleteMembership);

export default membershipRouter;