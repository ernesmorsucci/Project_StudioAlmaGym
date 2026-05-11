import PaymentService from "../services/payment.service.js";
import { paymentService as repoPaymentService } from "../services/index.service.js";

const paymentService = new PaymentService();

export const getAllPayments = async (req, res) => {
    try {
        const payments = await repoPaymentService.getAll();
        res.status(200).json({ status: "success", payload: payments });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const payment = await repoPaymentService.getBy({ _id: req.params.pid });
        if (!payment) return res.status(404).json({ status: "error", error: "Pago no encontrado" });
        res.status(200).json({ status: "success", payload: payment });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
};

export const createPayment = async (req, res) => {
    try {
        // Ahora solo necesitamos estos 4 datos del Frontend
        const { studentId, planId, amount, method } = req.body;
        
        if (!studentId || !planId || !amount || !method) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios para procesar el pago" });
        }
        
        // Disparamos nuestro flujo unificado
        const result = await paymentService.processDirectPayment({ studentId, planId, amount, method });
        
        res.status(201).json({ status: "success", message: "Pago y membresía procesados correctamente", payload: result });
    } catch (error) {
        console.error("❌ Error en createPayment:", error);
        res.status(500).json({ status: "error", error: error.message });
    }
};

export const confirmPayment = async (req, res) => {
    try {
        const { pid } = req.params;
        const { method, selectedPlanId } = req.body; // <-- Fundamental: Recibe el plan

        if (!method) return res.status(400).json({ status: "error", error: "Debe especificar el método de pago" });
        if (!selectedPlanId) return res.status(400).json({ status: "error", error: "Debe especificar qué plan está pagando" });

        const result = await paymentService.confirmPaymentAndRenew(pid, method, selectedPlanId);

        res.status(200).json({ 
            status: "success", 
            message: "Pago confirmado y membresía actualizada", 
            payload: result
        });
    } catch (error) {
        console.error("❌ Error en confirmPayment:", error);
        res.status(400).json({ status: "error", error: `Error al confirmar: ${error.message}` });
    }
};

export const getStudentPayments = async (req, res) => {
    try {
        const { uid } = req.params; 
        if (req.user._id !== uid && req.user.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "Acceso denegado" });
        }
        const payments = await repoPaymentService.getPaymentsByStudent(uid);
        res.status(200).json({ status: "success", payload: payments });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
};

export const getPaymentsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ status: "error", error: "Faltan fechas" });
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const payments = await repoPaymentService.getPaymentsByDateRange(start, end);
        res.status(200).json({ status: "success", payload: payments });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
};

export const getDefaulters = async (req, res) => {
    try {
        const defaulters = await repoPaymentService.getPendingExpiredPayments();
        res.status(200).json({ status: "success", payload: defaulters });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
};