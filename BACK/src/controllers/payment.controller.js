import PaymentService from "../services/payment.service.js";
import { paymentService as repoPaymentService } from "../services/index.service.js";

const paymentService = new PaymentService();

export const getAllPayments = async (req, res) => {
    try {
        const payments = await repoPaymentService.getAll();
        res.status(200).json({ status: "success", payload: payments });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error interno" });
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const payment = await repoPaymentService.getBy({ _id: req.params.pid });
        if (!payment) return res.status(404).json({ status: "error", error: "Pago no encontrado" });
        res.status(200).json({ status: "success", payload: payment });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error interno" });
    }
};

export const createPayment = async (req, res) => {
    try {
        const { studentId, membershipId, planId, amount, expiration } = req.body;
        if (!studentId || !membershipId || !planId || !amount || !expiration) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios" });
        }
        const newPayment = { studentId, membershipId, planId, amount, expiration, date: new Date(), status: 'pending' };
        const result = await repoPaymentService.create(newPayment);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error interno" });
    }
};

// CDU-03: CONFIRMAR PAGO (AHORA USA EL SERVICIO)
export const confirmPayment = async (req, res) => {
    try {
        const { pid } = req.params;
        const { method } = req.body; 

        if (!method) return res.status(400).json({ status: "error", error: "Debe especificar el método de pago" });

        // Toda la lógica pesada fue delegada al PaymentService
        const result = await paymentService.confirmPaymentAndRenew(pid, method);

        res.status(200).json({ 
            status: "success", 
            message: "Pago confirmado y membresía renovada", 
            payload: result
        });
    } catch (error) {
        res.status(400).json({ status: "error", error: error.message });
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
        res.status(500).json({ status: "error", error: "Error interno" });
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
        res.status(500).json({ status: "error", error: "Error interno" });
    }
};

export const getDefaulters = async (req, res) => {
    try {
        const defaulters = await repoPaymentService.getPendingExpiredPayments();
        res.status(200).json({ status: "success", payload: defaulters });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error interno" });
    }
};