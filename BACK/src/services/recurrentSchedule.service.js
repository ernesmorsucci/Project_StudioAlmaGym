import RecurrentScheduleDao from '../dao/recurrentSchedule.dao.js';
import ClassDao from '../dao/class.dao.js';

const recurrentScheduleDAO = new RecurrentScheduleDao();
const classDAO = new ClassDao();

export default class RecurrentScheduleService {
    
    async getAll(filter = {}) {
        return await recurrentScheduleDAO.get(filter);
    }

    async getById(id) {
        return await recurrentScheduleDAO.getBy({ _id: id });
    }

    // =========================================================
    // MOTOR CORE: Crear Horario, Validar y Generar Clases
    // =========================================================
    async createScheduleAndClasses(data) {
        const { professorId, daysWeek, startTime, endTime, name, classType, maxQuota, forceCreate = false } = data;

        // 1. VALIDACIÓN DE COLISIONES INTELIGENTE
        const allSchedules = await recurrentScheduleDAO.get({});

        for (const schedule of allSchedules) {
            // Verificamos si hay algún día de la semana en común
            const commonDays = schedule.daysWeek.filter(d => daysWeek.includes(d));
            
            if (commonDays.length > 0) {
                // Verificamos si las horas se cruzan: (Inicio A < Fin B) y (Fin A > Inicio B)
                if (startTime < schedule.endTime && endTime > schedule.startTime) {
                    
                    // CASO A: Misma profesora (BLOQUEO TOTAL)
                    if (schedule.professorId.toString() === professorId.toString()) {
                        throw new Error(`CRÍTICO: La profesora ya imparte la clase '${schedule.name}' de ${schedule.startTime} a ${schedule.endTime} en esos días.`);
                    }

                    // CASO B: Otra profesora (ADVERTENCIA DE SALÓN OCUPADO)
                    if (!forceCreate) {
                        throw new Error(`ADVERTENCIA: El salón ya está ocupado por la clase '${schedule.name}' (${schedule.startTime} - ${schedule.endTime}). ¿Deseas crearla de todas formas?`);
                    }
                }
            }
        }

        // 2. GUARDAMOS EL HORARIO (La plantilla semanal)
        const newSchedule = await recurrentScheduleDAO.save(data);

        // 3. GENERADOR DE CLASES REALES (Próximos 14 días)
        const classesToCreate = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 14; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            const dayOfWeek = currentDate.getDay(); 

            // Si el día evaluado está dentro de los días elegidos por el Admin
            if (daysWeek.includes(dayOfWeek)) {
                
                const [startHour, startMin] = startTime.split(':');
                const classDateTime = new Date(currentDate);
                classDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

                const [endHour, endMin] = endTime.split(':');
                const classEndTime = new Date(currentDate);
                classEndTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

                // Control de seguridad para evitar duplicar clases si el proceso se corre dos veces
                const existingClass = await classDAO.get({
                    professorId,
                    dateTime: classDateTime
                });

                if (!existingClass || existingClass.length === 0) {
                    classesToCreate.push({
                        name: name,
                        classType: classType || 'Mat',
                        professorId: professorId,
                        recurrentScheduleId: newSchedule._id,
                        dateTime: classDateTime,
                        endTime: classEndTime,
                        maxQuota: maxQuota,
                        occupiedQuota: 0,
                        isActive: true
                    });
                }
            }
        }

        // Guardado masivo de las instancias de clase
        for (const classData of classesToCreate) {
            await classDAO.save(classData);
        }

        return newSchedule;
    }

    // =========================================================
    // ACTUALIZACIÓN Y BORRADO
    // =========================================================
    async updateSchedule(id, data) {
        // Por ahora actualizamos solo la plantilla.
        // A futuro implementaremos la lógica de "Efecto dominó" para clases sin reservas.
        return await recurrentScheduleDAO.update(id, data);
    }

    async deleteSchedule(id) {
        // Eliminamos la plantilla para detener la generación automática
        return await recurrentScheduleDAO.delete(id);
    }
}