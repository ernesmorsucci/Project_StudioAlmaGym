import { paymentService } from "../services/index.service.js";

// ==========================================
// MÉTODOS BÁSICOS (CRUD)
// ==========================================

// 1. Obtener todos los pagos (Ideal para la vista general del Admin)
export const getAllPayments = async (req, res) => {
    try {
        const payments = await paymentService.getAll();
        res.status(200).json({ status: "success", payload: payments });
    } catch (error) {
        console.error("Error en getAllPayments:", error);
        res.status(500).json({ status: "error", error: "Error al obtener los pagos" });
    }
};

// 2. Obtener un pago específico por ID (Ver el detalle de un recibo)
export const getPaymentById = async (req, res) => {
    try {
        const { pid } = req.params;
        const payment = await paymentService.getBy({ _id: pid });
        
        if (!payment) return res.status(404).json({ status: "error", error: "Pago no encontrado" });
        
        res.status(200).json({ status: "success", payload: payment });
    } catch (error) {
        console.error("Error en getPaymentById:", error);
        res.status(500).json({ status: "error", error: "Error al obtener el pago" });
    }
};

// 3. Crear un nuevo pago / Generar cupón (Queda en estado 'pending')
export const createPayment = async (req, res) => {
    try {
        const { studentId, membershipId, planId, amount, expiration } = req.body;
        
        if (!studentId || !membershipId || !planId || !amount || !expiration) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios para generar el pago" });
        }

        const newPayment = {
            studentId,
            membershipId,
            planId,
            amount,
            expiration,
            date: new Date(), // Fecha de creación del cupón
            status: 'pending' // Por defecto nace pendiente
        };

        const result = await paymentService.create(newPayment);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en createPayment:", error);
        res.status(500).json({ status: "error", error: "Error al generar el pago" });
    }
};

// ==========================================
// MÉTODOS DE NEGOCIO (Usan las funciones pro del Repo)
// ==========================================

// 4. Confirmar un pago (Admin marca que el alumno le pagó)
export const confirmPayment = async (req, res) => {
    try {
        const { pid } = req.params;
        const { method } = req.body; // ej: 'efectivo', 'transferencia', 'mercado_pago'

        if (!method) {
            return res.status(400).json({ status: "error", error: "Debe especificar el método de pago" });
        }

        const result = await paymentService.markAsPaid(pid, method);
        
        if (!result) return res.status(404).json({ status: "error", error: "Pago no encontrado" });

        // NOTA MENTAL: En el futuro, acá podríamos llamar a membershipService.renewMembership()
        // para que al pagar, automáticamente se le renueve el mes a la alumna.

        res.status(200).json({ status: "success", message: "Pago confirmado exitosamente", payload: result });
    } catch (error) {
        console.error("Error en confirmPayment:", error);
        res.status(500).json({ status: "error", error: "Error al confirmar el pago" });
    }
};

// 5. Historial de pagos de un alumno (Para la sección "Mi Billetera" de la alumna)
export const getStudentPayments = async (req, res) => {
    try {
        const { uid } = req.params; 
        const requestingUser = req.user; 

        // 🛡️ ESCUDO DE PRIVACIDAD
        if (requestingUser._id !== uid && requestingUser.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "Acceso denegado: No puedes ver el historial de pagos de otros alumnos" });
        }
        
        const payments = await paymentService.getPaymentsByStudent(uid);
        
        res.status(200).json({ status: "success", payload: payments });
    } catch (error) {
        console.error("Error en getStudentPayments:", error);
        res.status(500).json({ status: "error", error: "Error al obtener el historial del alumno" });
    }
};

// 6. Arqueo de caja: Obtener ingresos en un rango de fechas (Para el Dashboard del Admin)
export const getPaymentsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ status: "error", error: "Debe proporcionar startDate y endDate" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Que cubra todo el último día

        const payments = await paymentService.getPaymentsByDateRange(start, end);
        
        res.status(200).json({ status: "success", payload: payments });
    } catch (error) {
        console.error("Error en getPaymentsByDateRange:", error);
        res.status(500).json({ status: "error", error: "Error al calcular ingresos" });
    }
};

// 7. Buscar deudores (Pagos pendientes vencidos)
export const getDefaulters = async (req, res) => {
    try {
        const defaulters = await paymentService.getPendingExpiredPayments();
        res.status(200).json({ status: "success", payload: defaulters });
    } catch (error) {
        console.error("Error en getDefaulters:", error);
        res.status(500).json({ status: "error", error: "Error al buscar deudores" });
    }
};