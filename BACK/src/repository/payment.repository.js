import GenericRepository from "./generic.repository.js";
import PaymentDao from "../dao/payment.dao.js"; // Ruta corregida

const dao = new PaymentDao();

export default class PaymentRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    // 🔥 AHORA SÍ: Recibe el filtro y se lo pasa a Mongoose
    getAll = (filter = {}) => {
        return this.dao.model.find(filter)
            .populate('studentId', 'name email')
            .populate('planId', 'name');
    }

    /**
     * Marca un pago como completado (CDU-07).
     * Registra el método de pago y la fecha exacta de la transacción.
     */
    markAsPaid = (id, method) => {
        return this.dao.updateRaw(id, {
            $set: {
                status: 'paid',
                method: method,
                date: new Date() // Fecha en la que se efectivizó el pago
            }
        });
    }

    /**
     * Obtiene el historial completo de pagos de un alumno (A-HDU-04).
     * Se puede encadenar un .sort({ date: -1 }) en el controlador 
     * para mostrar los pagos más recientes primero.
     */
    getPaymentsByStudent = (studentId) => {
        return this.dao.get({ studentId });
    }

    /**
     * Obtiene todos los pagos completados en un rango de fechas.
     * Ideal para el Dashboard del Admin: calcular cuánto dinero ingresó en el mes.
     */
    getPaymentsByDateRange = (startDate, endDate) => {
        return this.dao.get({
            status: 'paid',
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });
    }

    /**
     * Busca los pagos que quedaron en estado 'pending' y cuya fecha de 
     * expiración ya pasó. Útil para que un Cron Job (o el Admin) los 
     * pase a estado 'expired' y envíe las notificaciones de deuda.
     */
    getPendingExpiredPayments = (currentDate = new Date()) => {
        return this.dao.get({
            status: 'pending',
            expiration: { $lt: currentDate }
        });
    }


}