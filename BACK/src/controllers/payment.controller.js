import { paymentService, membershipService } from "../services/index.service.js";

// ==========================================
// MÉTODOS BÁSICOS (CRUD)
// ==========================================

// 1. Obtener todos los pagos (Vista general del Admin)
export const getAllPayments = async (req, res) => {
    try {
        const payments = await paymentService.getAll();
        res.status(200).json({ status: "success", payload: payments });
    } catch (error) {
        console.error("Error en getAllPayments:", error);
        res.status(500).json({ status: "error", error: "Error al obtener los pagos" });
    }
};

// 2. Obtener un pago específico por ID
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

// 3. Crear un nuevo pago / Generar cupón (nace en estado 'pending')
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
            date: new Date(),
            status: 'pending'
        };

        const result = await paymentService.create(newPayment);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en createPayment:", error);
        res.status(500).json({ status: "error", error: "Error al generar el pago" });
    }
};

// ==========================================
// MÉTODOS DE NEGOCIO
// ==========================================

/**
 * CDU-03: Confirmar un pago y renovar la membresía automáticamente.
 * 
 * REGLA DE NEGOCIO (del PDF):
 * La nueva fecha de vencimiento siempre es Fecha_Pago + 30 días,
 * independientemente de cuándo vencía el ciclo anterior.
 * Esto cubre el caso de pago atrasado: si vencía el 10 y paga el 15,
 * el nuevo vencimiento es el 14 del mes siguiente.
 * 
 * Flujo CDU-03:
 * 1. Marca el pago como 'paid' con método y fecha exacta.
 * 2. Calcula nueva expireDate = ahora + 30 días.
 * 3. Llama a renewMembership() que resetea usedClassesThisWeek y extiende expireDate.
 */
export const confirmPayment = async (req, res) => {
    try {
        const { pid } = req.params;
        const { method } = req.body; // 'efectivo', 'transferencia', 'mercado_pago'

        if (!method) {
            return res.status(400).json({ status: "error", error: "Debe especificar el método de pago" });
        }

        // Paso 1: Buscar el pago para obtener el membershipId
        const payment = await paymentService.getBy({ _id: pid });
        if (!payment) return res.status(404).json({ status: "error", error: "Pago no encontrado" });

        if (payment.status === 'paid') {
            return res.status(400).json({ status: "error", error: "Este pago ya fue confirmado anteriormente" });
        }

        // Paso 2: Marcar el pago como pagado (registra método y fecha real de la transacción)
        const updatedPayment = await paymentService.markAsPaid(pid, method);

        // Paso 3: Calcular nueva fecha de vencimiento (Fecha_Pago + 30 días)
        const newExpireDate = new Date();
        newExpireDate.setDate(newExpireDate.getDate() + 30);

        // Paso 4: Renovar la membresía asociada al pago
        const updatedMembership = await membershipService.renewMembership(
            payment.membershipId,
            newExpireDate
        );

        if (!updatedMembership) {
            // El pago se confirmó pero la membresía no se encontró — loguear para revisión manual
            console.error(`ALERTA: Pago ${pid} confirmado pero la membresía ${payment.membershipId} no fue encontrada para renovar.`);
        }

        res.status(200).json({ 
            status: "success", 
            message: "Pago confirmado y membresía renovada exitosamente", 
            payload: {
                payment: updatedPayment,
                membership: updatedMembership,
                newExpireDate
            }
        });
    } catch (error) {
        console.error("Error en confirmPayment:", error);
        res.status(500).json({ status: "error", error: "Error al confirmar el pago" });
    }
};

// 5. Historial de pagos de un alumno ("Mi Billetera")
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

// 6. Arqueo de caja: ingresos en un rango de fechas (Dashboard del Admin)
export const getPaymentsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ status: "error", error: "Debe proporcionar startDate y endDate" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const payments = await paymentService.getPaymentsByDateRange(start, end);
        
        res.status(200).json({ status: "success", payload: payments });
    } catch (error) {
        console.error("Error en getPaymentsByDateRange:", error);
        res.status(500).json({ status: "error", error: "Error al calcular ingresos" });
    }
};

// 7. Buscar deudores (pagos pendientes vencidos)
export const getDefaulters = async (req, res) => {
    try {
        const defaulters = await paymentService.getPendingExpiredPayments();
        res.status(200).json({ status: "success", payload: defaulters });
    } catch (error) {
        console.error("Error en getDefaulters:", error);
        res.status(500).json({ status: "error", error: "Error al buscar deudores" });
    }
};