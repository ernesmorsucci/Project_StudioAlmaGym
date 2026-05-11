import { Router } from "express";
import { 
    createReserve, 
    cancelReserve, 
    getStudentReserves, 
    getAllReserves 
} from "../controllers/reserve.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const reserveRouter = Router();

/**
 * RUTAS DE RESERVAS Y CLASES
 */

// 1. Obtener todas las reservas de todos los alumnos (Solo Admin)
reserveRouter.get("/", isAuthenticated, checkRole(['admin']), getAllReserves);

// 2. Obtener historial y próximas reservas de un alumno específico
reserveRouter.get("/student/:uid", isAuthenticated, getStudentReserves);

// 3. Crear una nueva reserva (El alumno puede reservar, o el admin por él)
reserveRouter.post("/", isAuthenticated, createReserve);

// 4. Cancelar una reserva existente
reserveRouter.delete("/:rid", isAuthenticated, cancelReserve);

export default reserveRouter;