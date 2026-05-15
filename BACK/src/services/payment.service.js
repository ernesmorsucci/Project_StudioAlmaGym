import PaymentRepository from "../repository/payment.repository.js";
import MembershipRepository from "../repository/membership.repository.js";
import PlanRepository from "../repository/plan.repository.js"; 

const paymentRepo = new PaymentRepository();
const membershipRepo = new MembershipRepository();
const planRepo = new PlanRepository(); 

export default class PaymentService {
    
    // 🔥 Asegúrate de que tenga (filter = {}) y se lo pase a los métodos del repo
    // 🔥 SOLUCIÓN: Agregamos (filter = {}) para que acepte los parámetros
    async getAll(filter = {}) { 
        return paymentRepo.get 
            ? await paymentRepo.get(filter) 
            : await paymentRepo.getAll(filter); 
    }
    
    async getBy(filter) { 
        return await paymentRepo.getBy(filter); 
    }

    // ==========================================
    // HERRAMIENTAS PARA EL CRON JOB NOCTURNO
    // ==========================================
    async getPendingExpiredPayments() {
        const now = new Date();
        const filter = { 
            status: 'pending', 
            expiration: { $lt: now } 
        };
        
        // Usamos la misma lógica robusta que tienes en getAll()
        return paymentRepo.get 
            ? await paymentRepo.get(filter) 
            : await paymentRepo.getAll(filter);
    }

    async update(id, data) {
        return await paymentRepo.update(id, data);
    }
    
    // 🔥 EL NUEVO FLUJO UNIFICADO EXACTO COMO LO PEDISTE
    async processDirectPayment({ studentId, planId, amount, method }) {
        const plan = await planRepo.getBy({ _id: planId });
        if (!plan) throw new Error("Plan no encontrado en la base de datos");

        const today = new Date();
        let newExpireDate = new Date();
        
        // 1. Verificamos si TIENE membresía
        let membership = await membershipRepo.getBy({ studentId, status: 'active' });

        if (membership) {
            // 2A. SI TIENE: La actualizamos
            let isEarlyRenewal = new Date(membership.expireDate) > today;

            if (isEarlyRenewal) {
                newExpireDate = new Date(membership.expireDate);
                newExpireDate.setMonth(newExpireDate.getMonth() + 1);
            } else {
                newExpireDate.setMonth(newExpireDate.getMonth() + 1);
                membership.usedClassesThisMonth = 0;
                membership.currentPeriod = today;
            }

            await membershipRepo.update(membership._id, {
                expireDate: newExpireDate,
                planId: plan._id,
                usedClassesThisMonth: membership.usedClassesThisMonth,
                currentPeriod: membership.currentPeriod
            });
            
        } else {
            // 2B. SI NO TIENE: La creamos
            newExpireDate.setMonth(newExpireDate.getMonth() + 1);

            const newMembershipData = {
                studentId: studentId,
                planId: plan._id,
                startDate: today,
                expireDate: newExpireDate,
                currentPeriod: today,
                usedClassesThisMonth: 0,
                status: 'active'
            };

            membership = membershipRepo.create 
                ? await membershipRepo.create(newMembershipData) 
                : await membershipRepo.save(newMembershipData);
        }

        // 3. LUEGO: Creamos el Payment conectándolo al ID de la membresía lista
        const newPaymentData = {
            studentId: studentId,
            membershipId: membership._id, // Aquí atamos el recibo a la membresía
            planId: plan._id,
            amount: amount,
            date: today,
            expiration: newExpireDate, 
            status: 'paid', // El pago ya nace confirmado
            method: method
        };

        const payment = paymentRepo.create 
            ? await paymentRepo.create(newPaymentData) 
            : await paymentRepo.save(newPaymentData);

        return { payment, membership };
    }
}