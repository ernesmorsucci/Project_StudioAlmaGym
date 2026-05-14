import ReserveRepository from "../repository/reserve.repository.js"; 
import MembershipRepository from "../repository/membership.repository.js";
import PlanRepository from "../repository/plan.repository.js";
// 🔥 1. IMPORTAMOS EL REPOSITORIO DE CLASES
import ClassRepository from "../repository/class.repository.js"; 
import UsersRepository from "../repository/users.repository.js";
import EmailService from "./email.service.js";

const reserveRepo = new ReserveRepository();
const membershipRepo = new MembershipRepository();
const planRepo = new PlanRepository();
// 🔥 2. INICIALIZAMOS EL REPOSITORIO
const classRepo = new ClassRepository(); 
const usersRepo = new UsersRepository();
const emailService = new EmailService();

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
    // LÓGICA DE NEGOCIO: CREAR RESERVA (CON WAITLIST)
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

        // Buscamos si ya tiene un registro para esta clase
        const existingReserve = await reserveRepo.getBy({ 
            studentId, 
            scheduleId, 
            date: reserveDate 
        });

        // 🔥 BLOQUEO 1: Si ya está anotado o ya está en la cola, no lo dejamos pasar
        if (existingReserve && (existingReserve.status === 'reserved' || existingReserve.status === 'waitlist')) {
            throw new Error("Ya tienes un lugar o estás en lista de espera para esta clase.");
        }

        // Buscamos la clase para verificar sus cupos
        const classData = await classRepo.getBy({ _id: scheduleId });
        if (!classData) throw new Error("La clase a la que intentas anotarte no existe.");

        let finalReserve;
        
        // 🔥 LA DECISIÓN DEL MOTOR: ¿Está llena la clase?
        const isFull = classData.occupiedQuota >= classData.maxQuota;
        const finalStatus = isFull ? 'waitlist' : 'reserved';

        // Revivimos la clase si estaba cancelada, o la creamos de cero
        if (existingReserve && existingReserve.status === 'cancelled') {
            finalReserve = await reserveRepo.update(existingReserve._id, { status: finalStatus });
        } else {
            finalReserve = await reserveRepo.create({
                studentId,
                scheduleId,
                date: reserveDate,
                status: finalStatus
            });
        }

        // 🔥 LA MAGIA: SOLO restamos crédito y sumamos cupo si entró como 'reserved'
        // Si entró como 'waitlist', su saldo queda intacto.
        if (finalStatus === 'reserved') {
            await membershipRepo.update(membership._id, {
                usedClassesThisMonth: membership.usedClassesThisMonth + 1
            });

            await classRepo.update(scheduleId, {
                occupiedQuota: classData.occupiedQuota + 1
            });
        }

        return finalReserve;
    }
    // ==========================================
    // LÓGICA DE NEGOCIO: CANCELAR RESERVA (CON MOTOR AUTOMÁTICO)
    // ==========================================
    async cancelReserve(reserveId) {
        const reserve = await reserveRepo.getBy({ _id: reserveId });
        if (!reserve) throw new Error("Reserva no encontrada.");
        if (reserve.status === 'cancelled') throw new Error("Esta reserva ya estaba cancelada.");

        // 1. Marcamos la reserva original como cancelada
        const updatedReserve = await reserveRepo.update(reserveId, { status: 'cancelled' });

        // 2. Solo aplicamos la lógica de devolución/ascenso si la persona tenía un lugar real
        // (Si alguien se arrepiente estando en la cola, no pasa nada porque nunca le cobramos)
        if (reserve.status === 'reserved') {
            
            // Le devolvemos el crédito a la persona que canceló
            const membership = await membershipRepo.getBy({ studentId: reserve.studentId, status: 'active' });
            if (membership && membership.usedClassesThisMonth > 0) {
                await membershipRepo.update(membership._id, {
                    usedClassesThisMonth: membership.usedClassesThisMonth - 1
                });
            }

            // 🔥 3. EL MOTOR AUTOMÁTICO DE LISTA DE ESPERA
            // Buscamos a todos los que están en cola para esa misma clase y fecha
            const waitlist = await this.getAll({ 
                scheduleId: reserve.scheduleId, 
                date: reserve.date, 
                status: 'waitlist' 
            });

            // Ordenamos para encontrar al que se anotó primero (Ley FIFO: First In, First Out)
            const firstInLine = waitlist.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

            if (firstInLine) {
                // ¡HAY ALGUIEN EN COLA! Procedemos al ascenso
                
                // A) Le descontamos el crédito al afortunado
                const luckyMembership = await membershipRepo.getBy({ studentId: firstInLine.studentId, status: 'active' });
                if (luckyMembership) {
                    await membershipRepo.update(luckyMembership._id, {
                        usedClassesThisMonth: luckyMembership.usedClassesThisMonth + 1
                    });
                }

                // B) Cambiamos su estado a reservado
                await reserveRepo.update(firstInLine._id, { status: 'reserved' });

                // C) Le avisamos por correo inmediatamente
                try {
                    const luckyStudent = await usersRepo.getBy({ _id: firstInLine.studentId });
                    const classData = await classRepo.getBy({ _id: reserve.scheduleId });
                    
                    if (luckyStudent && luckyStudent.email && classData) {
                        const dateStr = new Date(reserve.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
                        const subject = "¡Se liberó un lugar y estás adentro!";
                        const message = `Hola ${luckyStudent.name},\n\n¡Excelentes noticias! Se ha liberado un cupo para la clase de ${classData.name} el día ${dateStr}.\n\nTu lugar ha sido confirmado automáticamente y ya tienes tu espacio asegurado. ¡Te esperamos en Studio Alma!`;
                        
                        await emailService.sendNotificationEmail(luckyStudent.email, subject, message);
                    }
                } catch (emailError) {
                    console.error("Error al notificar al alumno de la lista de espera:", emailError.message);
                }

                // NOTA: No modificamos el cupo ocupado de la clase, porque salió uno (-1) y entró otro (+1)
            } else {
                // NO HAY NADIE EN COLA -> Simplemente le restamos 1 al cupo ocupado de la clase
                const classData = await classRepo.getBy({ _id: reserve.scheduleId });
                if (classData && classData.occupiedQuota > 0) {
                    await classRepo.update(reserve.scheduleId, {
                        occupiedQuota: classData.occupiedQuota - 1
                    });
                }
            }
        }

        return updatedReserve;
    }
    // ==========================================
    // LÓGICA DE NEGOCIO: PROCESAR AUSENCIAS Y REEMBOLSAR
    // ==========================================
    async processAbsences() {
        const now = new Date();
        
        // 1. Buscamos todas las clases que ya pasaron y el alumno no asistió
        const expiredReserves = await this.getAll({
            date: { $lt: now },
            status: 'reserved'
        });

        let processedCount = 0;

        for (const reserve of expiredReserves) {
            // 2. Marcamos la reserva como ausente
            await reserveRepo.update(reserve._id, { status: 'absent' });

            // 3. Le devolvemos el crédito a su membresía activa
            const membership = await membershipRepo.getBy({ studentId: reserve.studentId, status: 'active' });
            if (membership && membership.usedClassesThisMonth > 0) {
                await membershipRepo.update(membership._id, {
                    usedClassesThisMonth: membership.usedClassesThisMonth - 1
                });
            }
            
            // Nota: No tocamos el cupo de la clase (occupiedQuota) porque la clase 
            // ya sucedió en el pasado y ese lugar físico no se puede reutilizar.
            
            processedCount++;
        }

        return processedCount;
    }
}