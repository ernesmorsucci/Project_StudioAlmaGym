import RecurrentScheduleDao from '../dao/recurrentSchedule.dao.js';
import ClassDao from '../dao/class.dao.js';
import reserveModel from '../dao/models/reserve.model.js';
import membershipModel from '../dao/models/membership.model.js';

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

    // ACTUALIZACIÓN Y BORRADO
    async updateSchedule(id, data) {
        const schedule = await recurrentScheduleDAO.getBy({ _id: id });
        if (!schedule) {
            throw new Error('Horario no encontrado.');
        }

        const nextScheduleData = {
            name: data.name ?? schedule.name,
            classType: data.classType ?? schedule.classType ?? 'Mat',
            professorId: data.professorId ?? schedule.professorId,
            daysWeek: data.daysWeek ?? schedule.daysWeek,
            startTime: data.startTime ?? schedule.startTime,
            endTime: data.endTime ?? schedule.endTime,
            maxQuota: data.maxQuota ?? schedule.maxQuota,
            isActive: data.isActive ?? schedule.isActive
        };

        const allScheduleClasses = await classDAO.get({ recurrentScheduleId: id });
        const nextDays = nextScheduleData.daysWeek || [];
        const classesToCancel = allScheduleClasses.filter((classItem) => {
            const dayOfWeek = new Date(classItem.dateTime).getDay();
            return !nextDays.includes(dayOfWeek);
        });
        const classesToUpdate = allScheduleClasses.filter((classItem) => {
            const dayOfWeek = new Date(classItem.dateTime).getDay();
            return nextDays.includes(dayOfWeek);
        });

        const classIdsToCancel = classesToCancel.map((classItem) => classItem._id);
        const classIdsToUpdate = classesToUpdate.map((classItem) => classItem._id);
        const allTouchedClassIds = [...classIdsToCancel, ...classIdsToUpdate];

        const activeReserves = allTouchedClassIds.length > 0
            ? await reserveModel.find({
                $or: [
                    { scheduleId: { $in: allTouchedClassIds } },
                    { classId: { $in: allTouchedClassIds } }
                ],
                status: { $in: ['reserved', 'waitlist'] }
            })
            : [];

        const affectedStudentIds = [
            ...new Set(activeReserves.map((reserve) => reserve.studentId?.toString()).filter(Boolean))
        ];

        const reservesToCancel = classIdsToCancel.length > 0
            ? await reserveModel.find({
                $or: [
                    { scheduleId: { $in: classIdsToCancel } },
                    { classId: { $in: classIdsToCancel } }
                ],
                status: { $in: ['reserved', 'waitlist'] }
            })
            : [];

        const cancelledReservedReserves = reservesToCancel.filter((reserve) => reserve.status === 'reserved');
        for (const reserve of cancelledReservedReserves) {
            await membershipModel.updateOne(
                {
                    studentId: reserve.studentId,
                    status: 'active',
                    usedClassesThisMonth: { $gt: 0 }
                },
                { $inc: { usedClassesThisMonth: -1 } }
            );
        }

        const cancelledReserves = classIdsToCancel.length > 0
            ? await reserveModel.updateMany(
                {
                    $or: [
                        { scheduleId: { $in: classIdsToCancel } },
                        { classId: { $in: classIdsToCancel } }
                    ],
                    status: { $in: ['reserved', 'waitlist'] }
                },
                { $set: { status: 'cancelled' } }
            )
            : { modifiedCount: 0 };

        const deletedRemovedDayClasses = classIdsToCancel.length > 0
            ? await classDAO.model.deleteMany({ _id: { $in: classIdsToCancel } })
            : { deletedCount: 0 };

        const updatedSchedule = await recurrentScheduleDAO.update(id, data);

        const classUpdateBase = {
            name: nextScheduleData.name,
            classType: nextScheduleData.classType,
            professorId: nextScheduleData.professorId,
            maxQuota: nextScheduleData.maxQuota
        };

        let updatedClasses = 0;
        let updatedReserves = 0;
        for (const classItem of classesToUpdate) {
            const classUpdate = { ...classUpdateBase };

            const [startHour, startMin] = nextScheduleData.startTime.split(':');
            const nextDateTime = new Date(classItem.dateTime);
            nextDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
            classUpdate.dateTime = nextDateTime;

            const [endHour, endMin] = nextScheduleData.endTime.split(':');
            const nextEndTime = new Date(classItem.endTime || classItem.dateTime);
            nextEndTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
            classUpdate.endTime = nextEndTime;

            const updateResult = await classDAO.model.updateOne(
                { _id: classItem._id },
                { $set: classUpdate }
            );

            updatedClasses += updateResult.modifiedCount || 0;

            const reserveUpdateResult = await reserveModel.updateMany(
                {
                    $or: [
                        { scheduleId: classItem._id },
                        { classId: classItem._id }
                    ],
                    status: { $in: ['reserved', 'waitlist'] }
                },
                { $set: { date: nextDateTime } }
            );

            updatedReserves += reserveUpdateResult.modifiedCount || 0;
        }

        let createdClasses = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 14; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            const dayOfWeek = currentDate.getDay();

            if (!nextDays.includes(dayOfWeek)) continue;

            const [startHour, startMin] = nextScheduleData.startTime.split(':');
            const classDateTime = new Date(currentDate);
            classDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

            const [endHour, endMin] = nextScheduleData.endTime.split(':');
            const classEndTime = new Date(currentDate);
            classEndTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

            const existingClass = await classDAO.get({
                recurrentScheduleId: id,
                dateTime: classDateTime
            });

            if (!existingClass || existingClass.length === 0) {
                await classDAO.save({
                    name: nextScheduleData.name,
                    classType: nextScheduleData.classType,
                    professorId: nextScheduleData.professorId,
                    recurrentScheduleId: id,
                    dateTime: classDateTime,
                    endTime: classEndTime,
                    maxQuota: nextScheduleData.maxQuota,
                    occupiedQuota: 0,
                    isActive: true
                });
                createdClasses++;
            }
        }

        return {
            previousSchedule: schedule,
            schedule: updatedSchedule,
            updatedClasses,
            createdClasses,
            updatedReserves,
            cancelledReserves: cancelledReserves.modifiedCount || 0,
            deletedRemovedDayClasses: deletedRemovedDayClasses.deletedCount || 0,
            affectedStudentIds
        };
    }

    async deleteSchedule(id) {
        const schedule = await recurrentScheduleDAO.getBy({ _id: id });
        if (!schedule) {
            throw new Error('Horario no encontrado.');
        }

        const classesToDelete = await classDAO.get({ recurrentScheduleId: id });
        const classIds = classesToDelete.map((classItem) => classItem._id);

        const activeReserves = classIds.length > 0
            ? await reserveModel.find({
                $or: [
                    { scheduleId: { $in: classIds } },
                    { classId: { $in: classIds } }
                ],
                status: { $in: ['reserved', 'waitlist'] }
            })
            : [];

        const affectedStudentIds = [
            ...new Set(activeReserves.map((reserve) => reserve.studentId?.toString()).filter(Boolean))
        ];

        const cancelledReserves = classIds.length > 0
            ? await reserveModel.updateMany(
                {
                    $or: [
                        { scheduleId: { $in: classIds } },
                        { classId: { $in: classIds } }
                    ],
                    status: { $in: ['reserved', 'waitlist'] }
                },
                { $set: { status: 'cancelled' } }
            )
            : { modifiedCount: 0 };

        const deletedClasses = await classDAO.model.deleteMany({ recurrentScheduleId: id });
        const deletedSchedule = await recurrentScheduleDAO.delete(id);

        return {
            schedule: deletedSchedule,
            deletedClasses: deletedClasses.deletedCount || 0,
            cancelledReserves: cancelledReserves.modifiedCount || 0,
            affectedStudentIds
        };
    }
}
