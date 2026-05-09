import ReserveRepository from "../repository/reserve.repository.js";
import MembershipRepository from "../repository/membership.repository.js";
import PlanRepository from "../repository/plan.repository.js";
import ClassRepository from "../repository/class.repository.js";
import { io } from "../app.js"; // 👈 Importamos el Socket.io

const reserveRepo = new ReserveRepository();
const membershipRepo = new MembershipRepository();
const planRepo = new PlanRepository();
const classRepo = new ClassRepository();

export default class ReserveService {
    
    // P-HDU-01: Obtener lista de clase detectando morosos visuales
    async getClassReservationsWithDefaulters(classId) {
        const reserves = await reserveRepo.findByClass(classId);
        
        const enrichedReserves = await Promise.all(reserves.map(async (reserve) => {
            const membership = await membershipRepo.getBy({ studentId: reserve.studentId._id, status: 'active' });
            const isDefaulter = !membership || new Date(membership.expireDate) < new Date();
            
            // NUEVO: Buscamos el nombre del plan para el frontend
            let planName = "Sin plan activo";
            if (membership) {
                const plan = await planRepo.getBy({ _id: membership.planId });
                if (plan) planName = plan.name;
            }
            
            return {
                ...reserve.toObject(),
                isDefaulter,
                planName // Enviamos el dato listo para pintar
            };
        }));
        
        return enrichedReserves;
    }

    // CDU-01: Crear Reserva
    async createReservation(studentId, classId) {
        const targetClass = await classRepo.getBy({ _id: classId });
        if (!targetClass) throw new Error("Clase no encontrada");
        if (!targetClass.isActive) throw new Error("La clase no está disponible");

        const membership = await membershipRepo.getBy({ studentId, status: 'active' });
        if (!membership) throw new Error("No tenés una membresía activa para reservar clases");

        if (new Date(membership.expireDate) < new Date()) {
            throw new Error("Tu membresía ha caducado. Por favor, renová tu plan.");
        }

        const planData = await planRepo.getBy({ _id: membership.planId });
        const monthlyLimit = planData.weeklyClasses * 4; 
        
        const absences = await reserveRepo.countAbsencesInPeriod(studentId, membership.currentPeriod);
        const totalAllowedThisMonth = monthlyLimit + absences; 

        if (membership.usedClassesThisMonth >= totalAllowedThisMonth) {
            throw new Error(`Alcanzaste el límite de tu plan (${monthlyLimit} clases mensuales).`);
        }

        const existingReserve = await reserveRepo.getBy({ studentId, classId, status: { $ne: 'canceled' } });
        if (existingReserve) throw new Error("Ya estás inscripto en esta clase");

        const hasQuota = targetClass.occupiedQuota < targetClass.maxQuota;
        let newReserveData = { studentId, classId, status: 'confirmed', assistance: 'pending', waitingPosition: 0 };

        if (hasQuota) {
            await classRepo.incrementOccupiedQuota(classId, 1);
            await membershipRepo.incrementUsedClasses(membership._id);
            
            // 📢 NOTIFICACIÓN EN TIEMPO REAL: Alguien tomó un cupo
            if (io) io.emit("class_updated", { classId: classId });

        } else {
            const pendingList = await reserveRepo.findByClass(classId);
            const pendingCount = pendingList.filter(r => r.status === 'pending').length;
            newReserveData.status = 'pending';
            newReserveData.waitingPosition = pendingCount + 1;
            
            // 📢 NOTIFICACIÓN EN TIEMPO REAL: Alguien se sumó a la lista de espera
            if (io) io.emit("class_updated", { classId: classId });
        }

        const result = await reserveRepo.create(newReserveData);
        return {
            reserve: result,
            message: hasQuota ? "Reserva confirmada" : `Añadido a lista de espera (posición ${newReserveData.waitingPosition})`
        };
    }

    // CDU-02: Cancelar Reserva y automatizar lista de espera
    async cancelReservation(reserveId, user) {
        const reserve = await reserveRepo.getBy({ _id: reserveId });
        if (!reserve || reserve.status === 'canceled') {
            throw new Error("Reserva no válida o ya cancelada");
        }

        if (reserve.studentId.toString() !== user._id && user.rol !== 'admin') {
            throw new Error("No tenés permiso para cancelar esta reserva");
        }

        const membership = await membershipRepo.getBy({ studentId: reserve.studentId, status: 'active' });

        await reserveRepo.update(reserveId, { status: 'canceled', waitingPosition: 0 });

        if (reserve.status === 'confirmed') {
            await classRepo.decrementOccupiedQuota(reserve.classId, 1);
            if (membership) await membershipRepo.decrementUsedClasses(membership._id);

            const nextInLine = await reserveRepo.getNextInWaitingList(reserve.classId);
            
            if (nextInLine) {
                const nextMembership = await membershipRepo.getBy({ studentId: nextInLine.studentId, status: 'active' });

                if (nextMembership && new Date(nextMembership.expireDate) >= new Date()) {
                    await reserveRepo.confirmWaitingReservation(nextInLine._id);
                    await classRepo.incrementOccupiedQuota(reserve.classId, 1);
                    await membershipRepo.incrementUsedClasses(nextMembership._id);
                    await reserveRepo.shiftWaitingList(reserve.classId, 1);
                    // (Aquí en el futuro iría la notificación de email que armamos para el alumno)
                } else {
                    await reserveRepo.update(nextInLine._id, { status: 'canceled', waitingPosition: 0 });
                    await reserveRepo.shiftWaitingList(reserve.classId, 1);
                }
            }

            // 📢 NOTIFICACIÓN EN TIEMPO REAL: Se liberó/ocupó un cupo o se movió la lista
            if (io) io.emit("class_updated", { classId: reserve.classId });

        } else if (reserve.status === 'pending') {
            await reserveRepo.shiftWaitingList(reserve.classId, reserve.waitingPosition);
            
            // 📢 NOTIFICACIÓN EN TIEMPO REAL: Alguien se bajó de la lista de espera
            if (io) io.emit("class_updated", { classId: reserve.classId });
        }

        return { message: "Reserva cancelada correctamente" };
    }
}