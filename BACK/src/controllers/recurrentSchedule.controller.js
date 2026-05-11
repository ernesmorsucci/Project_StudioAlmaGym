import { recurrentScheduleService } from '../services/index.service.js';

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
        const updated = await recurrentScheduleService.updateSchedule(req.params.id, req.body);
        res.json({ status: 'success', message: 'Horario actualizado con éxito.', payload: updated });
    } catch (error) {
        console.error("Error al actualizar horario:", error.message);
        res.status(400).json({ status: 'error', error: error.message });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        await recurrentScheduleService.deleteSchedule(req.params.id);
        res.json({ status: 'success', message: 'Horario eliminado correctamente.' });
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