import ReserveRepository from "../repository/reserve.repository.js"; 
import MembershipRepository from "../repository/membership.repository.js";
import PlanRepository from "../repository/plan.repository.js";
// 🔥 1. IMPORTAMOS EL REPOSITORIO DE CLASES
import ClassRepository from "../repository/class.repository.js"; 

const reserveRepo = new ReserveRepository();
const membershipRepo = new MembershipRepository();
const planRepo = new PlanRepository();
// 🔥 2. INICIALIZAMOS EL REPOSITORIO
const classRepo = new ClassRepository(); 

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

        if (reserveDate < today) {
            throw new Error("No puedes reservar clases en fechas pasadas.");
        }

        const membership = await membershipRepo.getBy({ studentId, status: 'active' });
        if (!membership) {
            throw new Error("El alumno no tiene una membresía activa para reservar.");
        }

        if (reserveDate > new Date(membership.expireDate)) {
            throw new Error("La fecha de reserva supera el vencimiento de su plan actual.");
        }

        const plan = await planRepo.getBy({ _id: membership.planId });
        if (!plan) throw new Error("Error interno: Plan de membresía no encontrado.");
        
        const totalClassesAllowed = (plan.weeklyClasses || 0) * 4;

        if (membership.usedClassesThisMonth >= totalClassesAllowed) {
            throw new Error("El alumno ya consumió todas las clases de su ciclo actual.");
        }

        const existingReserve = await reserveRepo.getBy({ 
            studentId, 
            scheduleId, 
            date: reserveDate, 
            status: 'reserved' 
        });
        if (existingReserve) {
            throw new Error("El alumno ya tiene una reserva activa para este horario y fecha.");
        }

        // 🔥 3. BUSCAMOS LA CLASE PARA VERIFICARLA
        const classData = await classRepo.getBy({ _id: scheduleId });
        if (!classData) throw new Error("La clase a la que intentas anotarte no existe.");

        const newReserve = await reserveRepo.create({
            studentId,
            scheduleId,
            date: reserveDate,
            status: 'reserved'
        });

        // 4. Restamos un cupo de la membresía del alumno
        await membershipRepo.update(membership._id, {
            usedClassesThisMonth: membership.usedClassesThisMonth + 1
        });

        // 🔥 5. LA MAGIA: Sumamos 1 al cupo ocupado de la clase
        await classRepo.update(scheduleId, {
            occupiedQuota: classData.occupiedQuota + 1
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

        // 2. Le devolvemos el cupo a su membresía
        const membership = await membershipRepo.getBy({ studentId: reserve.studentId, status: 'active' });
        if (membership && membership.usedClassesThisMonth > 0) {
            await membershipRepo.update(membership._id, {
                usedClassesThisMonth: membership.usedClassesThisMonth - 1
            });
        }

        // 🔥 3. LA MAGIA INVERSA: Le devolvemos el cupo a la clase
        const classData = await classRepo.getBy({ _id: reserve.scheduleId });
        if (classData && classData.occupiedQuota > 0) {
            await classRepo.update(reserve.scheduleId, {
                occupiedQuota: classData.occupiedQuota - 1
            });
        }

        return updatedReserve;
    }
}