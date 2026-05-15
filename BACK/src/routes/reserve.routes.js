import { Router } from "express";
import { 
    createReserve, 
    cancelReserve, 
    getStudentReserves, 
    getAllReserves,
    getClassReserves,
    getReservesByProfessor,
    updateAttendance // 🔥 AGREGAMOS EL NUEVO CONTROLADOR
} from "../controllers/reserve.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const reserveRouter = Router();

// 1. Obtener todas las reservas de todos los alumnos (Solo Admin)
reserveRouter.get("/", isAuthenticated, checkRole(['admin']), getAllReserves);

// 2. Obtener historial y próximas reservas de un alumno específico
reserveRouter.get("/student/:uid", isAuthenticated, getStudentReserves);

// 3. Crear una nueva reserva (El alumno puede reservar, o el admin por él)
reserveRouter.post("/", isAuthenticated, createReserve);

// 4. Cancelar una reserva existente
reserveRouter.delete("/:rid", isAuthenticated, cancelReserve);

// 5. Obtener los alumnos anotados en una clase (Admin y Profesoras)
// 🔥 CORRECCIÓN: Le dimos permiso a 'profesor' para ver su lista
reserveRouter.get("/class/:cid", isAuthenticated, checkRole(['admin', 'profesor']), getClassReserves);

// Obtener reservas agrupadas por clase para un profesor (Admin y Profesor)
reserveRouter.get("/professor/:pid", isAuthenticated, checkRole(['admin', 'profesor']), getReservesByProfessor);

// 6. Tomar Asistencia (Admin y Profesoras)
// 🔥 NUEVA RUTA: Recibe el ID de la reserva y actualiza su estado
reserveRouter.patch("/:rid/attendance", isAuthenticated, checkRole(['admin', 'profesor']), updateAttendance);

export default reserveRouter;