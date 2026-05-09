import RecurrentScheduleRepository from "../repository/recurrentSchedule.repository.js";
import { classService, notificationService, reserveService } from "./index.service.js"; // Importamos otros servicios necesarios

const recurrentRepo = new RecurrentScheduleRepository();

export default class RecurrentScheduleService {
    getAll = () => recurrentRepo.getAll();
    getBy = (params) => recurrentRepo.getBy(params);
    create = (doc) => recurrentRepo.create(doc);
    delete = (id) => recurrentRepo.delete(id);
    getSchedulesByProfessor = (professorId) => recurrentRepo.getSchedulesByProfessor(professorId);

    // EL NUEVO Y PODEROSO MÉTODO DE ACTUALIZACIÓN
    async updateWithProtection(scheduleId, updateData, actionMode, adminId) {
        
        // 1. Buscar las clases de las próximas 2 semanas que ya se generaron con esta plantilla
        const futureClasses = await classService.getFutureClassesBySchedule(scheduleId);
        
        // 2. Si no hay clases futuras generadas, simplemente actualizamos normal y terminamos
        if (futureClasses.length === 0) {
            return { result: await recurrentRepo.update(scheduleId, updateData), actionTaken: 'updated_simple' };
        }

        // 3. Revisar cuántas de esas clases ya tienen reservas
        let affectedClasses = 0;
        let totalReservations = 0;
        let studentsToNotify = new Set(); // Usamos Set para no mandar 2 avisos al mismo alumno

        for (const fClass of futureClasses) {
            if (fClass.occupiedQuota > 0) {
                affectedClasses++;
                totalReservations += fClass.occupiedQuota;
                
                // Buscar quiénes son los alumnos para mandarles la notificación después
                const reserves = await reserveService.getClassReservationsWithDefaulters(fClass._id);
                reserves.forEach(r => {
                    if(r.status === 'confirmed') studentsToNotify.add(r.studentId._id.toString());
                });
            }
        }

        // ==========================================
        // MODO 1: 'check' -> El frontend solo quiere preguntar qué pasaría
        // ==========================================
        if (actionMode === 'check') {
            return {
                warning: true,
                message: `Existen ${futureClasses.length} clases ya generadas en las próximas 2 semanas. ${affectedClasses} de ellas ya tienen reservas (Total: ${totalReservations} alumnos afectados).`,
                futureClassesCount: futureClasses.length,
                affectedReservations: totalReservations
            };
        }

        // ==========================================
        // MODO 2: 'future_only' -> Actualizar plantilla, pero dejar las 2 semanas intactas
        // ==========================================
        if (actionMode === 'future_only') {
            const result = await recurrentRepo.update(scheduleId, updateData);
            return { result, actionTaken: 'updated_future_only', message: "Plantilla actualizada. Las próximas 2 semanas no sufrirán cambios." };
        }

        // ==========================================
        // MODO 3: 'force' -> Cambiar TODO y notificar
        // ==========================================
        if (actionMode === 'force') {
            // 1. Actualizar la plantilla
            const result = await recurrentRepo.update(scheduleId, updateData);

            // 2. Actualizar las clases futuras
            await classService.updateFutureClasses(scheduleId, {
                startTime: updateData.startTime, // Asumiendo que quisieron cambiar la hora
                endTime: updateData.endTime,
                professorId: updateData.professorId,
                maxQuota: updateData.maxQuota
                // Nota: cambiar los daysWeek implicaría borrar y recrear clases, es un flujo más complejo.
            });

            // 3. Enviar notificaciones a los alumnos afectados
            if (studentsToNotify.size > 0) {
                await notificationService.create({
                    adminId: adminId,
                    message: `¡Atención! Ha habido un cambio de horario o profesor en tu clase recurrente de ${updateData.name || 'Pilates'}. Por favor revisa tu calendario de reservas.`,
                    receivers: 'specific',
                    studentIds: Array.from(studentsToNotify)
                });
            }

            return { 
                result, 
                actionTaken: 'updated_forced', 
                message: `Plantilla y ${futureClasses.length} clases actualizadas. Se notificó a ${studentsToNotify.size} alumnos.` 
            };
        }

        throw new Error("Modo de actualización no válido");
    }
}