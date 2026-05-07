import { Router } from "express";
import { 
    getAllClasses, 
    getClassById, 
    addClass, 
    updateClass, 
    deleteClass,
    getClassesByDate 
} from "../controllers/class.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const classRouter = Router();

/**
 * RUTAS DE CLASES (PILATES)
 */

// 1. Ver todas las clases (Cualquier usuario logueado)
classRouter.get("/", isAuthenticated, getAllClasses);

// 2. Ver clases por fecha específica (Útil para el calendario de reservas)
classRouter.get("/filter", isAuthenticated, getClassesByDate);

// 3. Ver detalle de una clase específica
classRouter.get("/:cid", isAuthenticated, getClassById);

/**
 * RUTAS PROTEGIDAS - SOLO ADMIN
 * * TODO: Revisar lógica de negocio en controladores.
 * - En updateClass: Validar que no se puedan inyectar cambios de estado críticos sin supervisión.
 * - En addClass: Validar solapamiento de horarios de profesores.
 */

// 4. Crear una clase manual (Solo Admin)
classRouter.post("/", isAuthenticated, checkRole(['admin']), addClass);

// 5. Editar una clase (Solo Admin)
classRouter.put("/:cid", isAuthenticated, checkRole(['admin']), updateClass);

// 6. Eliminar físicamente una clase (Solo Admin)
classRouter.delete("/:cid", isAuthenticated, checkRole(['admin']), deleteClass);

export default classRouter;