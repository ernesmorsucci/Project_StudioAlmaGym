import { recurrentScheduleService, notificationService } from '../services/index.service.js';

export const createSchedule = async (req, res) => {
    try {
        const scheduleData = req.body;

        // Validaciones básicas de seguridad
        if (!scheduleData.name || !scheduleData.professorId || !scheduleData.daysWeek || scheduleData.daysWeek.length === 0) {
            return res.status(400).json({ status: 'error', error: 'Faltan datos obligatorios o no has seleccionado ningún día.' });
        }

        if (scheduleData.startTime >= scheduleData.endTime) {
            return res.status(400).json({ status: 'error', error: 'La hora de inicio debe ser menor a la hora de fin.' });
        }

        // Mandamos los datos al motor
        const result = await recurrentScheduleService.createScheduleAndClasses(scheduleData);

        res.status(201).json({ 
            status: 'success', 
            payload: result, 
            message: 'Horario y clases generadas con éxito.' 
        });

    } catch (error) {
        console.error("Error al crear horario:", error.message);
        // Devolvemos el error exacto (ej. Colisión detectada) para que el Front lo muestre
        res.status(400).json({ status: 'error', error: error.message });
    }
};

export const getAllSchedules = async (req, res) => {
    try {
        const schedules = await recurrentScheduleService.getAll();
        
        // Hacemos populate para que el Frontend reciba el nombre de la profesora y no un ID impronunciable
        const populatedSchedules = await Promise.all(schedules.map(async (s) => {
            if (s.professorId) {
                await s.populate('professorId', 'name');
            }
            return s;
        }));

        res.json({ status: 'success', payload: populatedSchedules });
    } catch (error) {
        console.error("Error obteniendo horarios:", error);
        res.status(500).json({ status: 'error', error: 'Error al obtener los horarios.' });
    }
};

export const updateSchedule = async (req, res) => {
    try {
        if (req.body.startTime && req.body.endTime && req.body.startTime >= req.body.endTime) {
            return res.status(400).json({ status: 'error', error: 'La hora de inicio debe ser menor a la hora de fin.' });
        }

        const result = await recurrentScheduleService.updateSchedule(req.params.id, req.body);

        if (result.affectedStudentIds.length > 0) {
            try {
                await notificationService.create({
                    adminId: req.user._id,
                    subject: `Horario actualizado: ${result.schedule.name}`,
                    message: `El horario de ${result.previousSchedule.name} fue actualizado. Las reservas de las clases que siguen vigentes fueron ajustadas al nuevo horario (${result.schedule.name}, de ${result.schedule.startTime} a ${result.schedule.endTime}). Si tenías una reserva en un día que ya no forma parte del horario, esa reserva fue cancelada.`,
                    targetType: 'schedule_update',
                    studentIds: result.affectedStudentIds,
                    sent: result.affectedStudentIds.length
                });
            } catch (notificationError) {
                console.error("Error al notificar alumnos por horario actualizado:", notificationError.message);
            }
        }

        res.json({
            status: 'success',
            message: `Horario actualizado con éxito. Se actualizaron ${result.updatedClasses} clases, se crearon ${result.createdClasses}, se actualizaron ${result.updatedReserves} reservas, se cancelaron ${result.cancelledReserves} reservas y se notificó a ${result.affectedStudentIds.length} alumnos.`,
            payload: result
        });
    } catch (error) {
        console.error("Error al actualizar horario:", error.message);
        res.status(400).json({ status: 'error', error: error.message });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        const result = await recurrentScheduleService.deleteSchedule(req.params.id);

        if (result.affectedStudentIds.length > 0) {
            try {
                await notificationService.create({
                    adminId: req.user._id,
                    subject: `Horario eliminado: ${result.schedule.name}`,
                    message: `El horario de ${result.schedule.name} (${result.schedule.startTime} - ${result.schedule.endTime}) fue eliminado. Por este motivo, tus reservas en las clases asociadas a ese horario fueron canceladas.`,
                    targetType: 'schedule_deletion',
                    studentIds: result.affectedStudentIds,
                    sent: result.affectedStudentIds.length
                });
            } catch (notificationError) {
                console.error("Error al notificar alumnos por horario eliminado:", notificationError.message);
            }
        }

        res.json({
            status: 'success',
            message: `Horario eliminado correctamente. También se eliminaron ${result.deletedClasses} clases asociadas y se notificó a ${result.affectedStudentIds.length} alumnos.`,
            payload: result
        });
    } catch (error) {
        console.error("Error al eliminar horario:", error.message);
        res.status(400).json({ status: 'error', error: error.message });
    }
};

export default {
    createSchedule,
    getAllSchedules,
    updateSchedule,
    deleteSchedule
};
