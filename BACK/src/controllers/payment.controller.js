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
        
        const allPayments = await repoPaymentService.getAll();
        
        // 🔥 LA MAGIA: Extraemos el ID correctamente, sin importar si Mongoose 
        // nos trajo el objeto completo poblado o solo el ID en texto.
        const studentPayments = allPayments.filter(payment => {
            if (!payment.studentId) return false;

            const paymentStudentId = payment.studentId._id 
                ? payment.studentId._id.toString() 
                : payment.studentId.toString();

            return paymentStudentId === uid.toString();
        });
        
        res.status(200).json({ status: "success", payload: studentPayments });
    } catch (error) {
        console.error("❌ Error en getStudentPayments:", error);
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
// Agrega esto al final de tu payment.controller.js
export const getPaymentStats = async (req, res) => {
    try {
        // 1. Obtenemos todos los pagos usando el servicio que ya tienes
        const payments = await repoPaymentService.getAll();
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let totalRecaudado = 0;
        let recaudadoMes = 0;

        // 2. Procesamos y sumamos los montos
        payments.forEach(payment => {
            // Verificamos que el pago sea válido (nuestro flujo los crea como 'paid')
            if (payment.status === 'paid' || !payment.status) {
                const amount = Number(payment.amount) || 0;
                totalRecaudado += amount;
                
                // Verificamos si el pago es de este mes
                const paymentDate = new Date(payment.date || payment.createdAt);
                if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
                    recaudadoMes += amount;
                }
            }
        });

        // Nota del Profesor: El cálculo de "Pendientes" requiere cruzar a los alumnos "Vencidos" con el precio de sus planes.
        // Dado que el Frontend ya carga toda la lista de alumnos, es mucho más eficiente que el front calcule el "Pendiente" 
        // sumando las cuotas de los alumnos en rojo, por lo que aquí devolvemos lo que es estrictamente pagos.

        res.status(200).json({
            status: "success",
            payload: {
                totalRecaudado,
                recaudadoMes
            }
        });
    } catch (error) {
        console.error("❌ Error en getPaymentStats:", error);
        res.status(500).json({ status: "error", error: error.message });
    }
}