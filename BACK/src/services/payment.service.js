import PaymentRepository from "../repository/payment.repository.js";
import MembershipRepository from "../repository/membership.repository.js";

const paymentRepo = new PaymentRepository();
const membershipRepo = new MembershipRepository();

export default class PaymentService {
    
    /**
     * CDU-03: Confirmar pago y renovar membresía.
     * REGLA DE NEGOCIO: La nueva fecha de vencimiento es Fecha_Pago + 30 días.
     */
    async confirmPaymentAndRenew(paymentId, method) {
        const payment = await paymentRepo.getBy({ _id: paymentId });
        
        if (!payment) throw new Error("Pago no encontrado");
        if (payment.status === 'paid') throw new Error("Este pago ya fue confirmado anteriormente");

        // 1. Marcar pago como pagado en la base de datos
        const updatedPayment = await paymentRepo.markAsPaid(paymentId, method);

        // 2. Calcular nueva fecha de vencimiento (Hoy + 30 días calendario)
        const newExpireDate = new Date();
        newExpireDate.setDate(newExpireDate.getDate() + 30);

        // 3. Renovar la membresía (Resetea créditos y extiende vencimiento)
        const updatedMembership = await membershipRepo.renewMembership(payment.membershipId, newExpireDate);

        if (!updatedMembership) {
            console.error(`ALERTA: Pago ${paymentId} confirmado pero la membresía no fue encontrada.`);
        }

        return {
            payment: updatedPayment,
            membership: updatedMembership,
            newExpireDate
        };
    }
}