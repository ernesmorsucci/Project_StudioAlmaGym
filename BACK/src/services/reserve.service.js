import ReserveRepository from "../repository/reserve.repository.js"; 
import MembershipRepository from "../repository/membership.repository.js";
import PlanRepository from "../repository/plan.repository.js";

const reserveRepo = new ReserveRepository();
const membershipRepo = new MembershipRepository();
const planRepo = new PlanRepository();

export default class ReserveService {
    
    // ==========================================
    // MÉTODOS CRUD BÁSICOS
    // ==========================================
    async getAll(filter = {}) { 
        return reserveRepo.get ? await reserveRepo.get(filter) : await reserveRepo.getAll(filter); 
    }
    
    async getBy(filter) { 
        return await reserveRepo.getBy(filter); 
    }

    // ==========================================
    // LÓGICA DE NEGOCIO: CREAR RESERVA
    // ==========================================
    async createReserve(studentId, scheduleId, dateString) {
        const reserveDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Verificar si la fecha no es en el pasado
        if (reserveDate < today) {
            throw new Error("No puedes reservar clases en fechas pasadas.");
        }

        // 2. Verificar que tenga membresía activa
        const membership = await membershipRepo.getBy({ studentId, status: 'active' });
        if (!membership) {
            throw new Error("El alumno no tiene una membresía activa para reservar.");
        }

        // 3. Verificar que la reserva no supere la fecha de vencimiento del plan
        if (reserveDate > new Date(membership.expireDate)) {
            throw new Error("La fecha de reserva supera el vencimiento de su plan actual.");
        }

        // 4. Verificar disponibilidad de cupos (clases usadas vs permitidas)
        const plan = await planRepo.getBy({ _id: membership.planId });
        if (!plan) throw new Error("Error interno: Plan de membresía no encontrado.");
        
        const totalClassesAllowed = (plan.weeklyClasses || 0) * 4;

        if (membership.usedClassesThisMonth >= totalClassesAllowed) {
            throw new Error("El alumno ya consumió todas las clases de su ciclo actual.");
        }

        // 5. Verificar duplicados (que no haya reservado ya esta misma clase este mismo día)
        const existingReserve = await reserveRepo.getBy({ 
            studentId, 
            scheduleId, 
            date: reserveDate, 
            status: 'reserved' 
        });
        if (existingReserve) {
            throw new Error("El alumno ya tiene una reserva activa para este horario y fecha.");
        }

        // 6. ¡TODO OK! Creamos la reserva
        const newReserve = await reserveRepo.create({
            studentId,
            scheduleId,
            date: reserveDate,
            status: 'reserved'
        });

        // 7. Restamos un cupo (sumando 1 al historial de clases usadas)
        await membershipRepo.update(membership._id, {
            usedClassesThisMonth: membership.usedClassesThisMonth + 1
        });

        return newReserve;
    }

    // ==========================================
    // LÓGICA DE NEGOCIO: CANCELAR RESERVA
    // ==========================================
    async cancelReserve(reserveId) {
        const reserve = await reserveRepo.getBy({ _id: reserveId });
        if (!reserve) throw new Error("Reserva no encontrada.");
        if (reserve.status === 'cancelled') throw new Error("Esta reserva ya estaba cancelada.");

        // 1. Marcamos la reserva como cancelada
        const updatedReserve = await reserveRepo.update(reserveId, { status: 'cancelled' });

        // 2. Buscamos su membresía activa para DEVOLVERLE el cupo
        const membership = await membershipRepo.getBy({ studentId: reserve.studentId, status: 'active' });
        
        if (membership && membership.usedClassesThisMonth > 0) {
            await membershipRepo.update(membership._id, {
                usedClassesThisMonth: membership.usedClassesThisMonth - 1
            });
        }

        return updatedReserve;
    }
}