import { Router } from "express";
import { 
    getAllPayments, 
    getPaymentById, 
    createPayment, 
    confirmPayment, 
    getStudentPayments, 
    getPaymentsByDateRange, 
    getDefaulters 
} from "../controllers/payment.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const paymentRouter = Router();

/**
 * RUTAS DE PAGOS (Finanzas y Facturación)
 */

// ==========================================
// RUTAS DE REPORTES Y FILTROS (Alta Prioridad)
// ==========================================

// 1. Arqueo de caja: Ver ingresos por rango de fechas (Solo Admin)
paymentRouter.get("/range", isAuthenticated, checkRole(['admin']), getPaymentsByDateRange);

// 2. Ver deudores: Pagos pendientes ya vencidos (Solo Admin)
paymentRouter.get("/defaulters", isAuthenticated, checkRole(['admin']), getDefaulters);

// 3. Historial de pagos de un alumno específico
// TODO: Validar que el alumno solo vea sus propios pagos (o sea Admin)
paymentRouter.get("/student/:uid", isAuthenticated, getStudentPayments);


// ==========================================
// RUTAS ESTÁNDAR (CRUD)
// ==========================================

// 4. Ver todos los registros de pagos (Solo Admin)
paymentRouter.get("/", isAuthenticated, checkRole(['admin']), getAllPayments);

// 5. Ver el detalle de un pago/recibo por ID
paymentRouter.get("/:pid", isAuthenticated, getPaymentById);

// 6. Generar un nuevo cupón de pago/deuda (Solo Admin)
paymentRouter.post("/", isAuthenticated, checkRole(['admin']), createPayment);

// 7. Marcar un pago como CONFIRMADO (Solo Admin)
// Nota: Esta es la acción que dispara el flujo de dinero
paymentRouter.put("/:pid/confirm", isAuthenticated, checkRole(['admin']), confirmPayment);

export default paymentRouter;