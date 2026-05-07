import { Router } from "express";
import { 
    getAllReserves, 
    getStudentReservations, 
    getClassReservations, 
    createReserve, 
    cancelReserve, 
    markAttendance 
} from "../controllers/reserve.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const reserveRouter = Router();

/**
 * RUTAS DE RESERVAS Y ASISTENCIAS
 */

// ==========================================
// RUTAS DE CONSULTA (Lectura)
// ==========================================

// 1. Ver todas las reservas del sistema (Solo Admin)
reserveRouter.get("/", isAuthenticated, checkRole(['admin']), getAllReserves);

// 2. Ver las reservas de una clase específica (Admin o Profesor para tomar lista)
reserveRouter.get("/class/:cid", isAuthenticated, getClassReservations);

// 3. Ver "Mis Reservas" (Cualquier alumno logueado)
// TODO: Validar que el alumno solo vea sus propias reservas (o sea Admin)
reserveRouter.get("/student/:uid", isAuthenticated, getStudentReservations);


// ==========================================
// RUTAS DE ACCIÓN (Escritura)
// ==========================================

// 4. Realizar una nueva reserva
// Aquí el controlador manejará si va a 'confirmed' o 'pending' (lista de espera)
reserveRouter.post("/", isAuthenticated, createReserve);

// 5. Marcar asistencia o inasistencia (Admin o Profesor)
reserveRouter.put("/attendance/:rid", isAuthenticated, checkRole(['admin', 'profesor']), markAttendance);

// 6. Cancelar una reserva
// TODO: Validar que solo el dueño de la reserva o un Admin puedan cancelarla
reserveRouter.put("/cancel/:rid", isAuthenticated, cancelReserve);

export default reserveRouter;