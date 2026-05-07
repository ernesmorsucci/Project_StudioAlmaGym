import { recurrentScheduleService } from "../services/index.service.js";

// 1. Obtener todas las plantillas de horarios (Admin)
export const getAllSchedules = async (req, res) => {
    try {
        const schedules = await recurrentScheduleService.getAll();
        res.status(200).json({ status: "success", payload: schedules });
    } catch (error) {
        console.error("Error en getAllSchedules:", error);
        res.status(500).json({ status: "error", error: "Error al obtener las plantillas" });
    }
};

// 2. Obtener una plantilla específica por ID
export const getScheduleById = async (req, res) => {
    try {
        const { rid } = req.params;
        const schedule = await recurrentScheduleService.getBy({ _id: rid });
        
        if (!schedule) return res.status(404).json({ status: "error", error: "Plantilla no encontrada" });
        
        res.status(200).json({ status: "success", payload: schedule });
    } catch (error) {
        console.error("Error en getScheduleById:", error);
        res.status(500).json({ status: "error", error: "Error al obtener la plantilla" });
    }
};

// 3. Crear una nueva plantilla de horario semanal (Admin)
export const addSchedule = async (req, res) => {
    try {
        const { name, professorId, daysWeek, startTime, endTime, maxQuota } = req.body;
        
        if (!name || !professorId || !daysWeek || !startTime || !endTime || !maxQuota) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios para la plantilla" });
        }

        const newSchedule = {
            name,
            professorId,
            daysWeek, // Array de números [0, 2, 4] (Dom, Mar, Jue)
            startTime,
            endTime,
            maxQuota,
            isActive: true
        };

        const result = await recurrentScheduleService.create(newSchedule);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en addSchedule:", error);
        res.status(500).json({ status: "error", error: "Error al crear la plantilla" });
    }
};

// 4. Actualizar una plantilla (Admin)
export const updateSchedule = async (req, res) => {
    try {
        const { rid } = req.params;
        const updateData = req.body;

        const result = await recurrentScheduleService.update(rid, updateData);
        if (!result) return res.status(404).json({ status: "error", error: "Plantilla no encontrada" });

        res.status(200).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en updateSchedule:", error);
        res.status(500).json({ status: "error", error: "Error al actualizar la plantilla" });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        const { rid } = req.params;
        
        // Cambio a borrado físico
        const result = await recurrentScheduleService.delete(rid);

        if (!result) return res.status(404).json({ status: "error", error: "Plantilla no encontrada" });

        res.status(200).json({ status: "success", message: "Plantilla de horario eliminada permanentemente" });
    } catch (error) {
        console.error("Error en deleteSchedule:", error);
        res.status(500).json({ status: "error", error: "Error al eliminar la plantilla" });
    }
};

// ==========================================
// MÉTODOS ESPECÍFICOS
// ==========================================

// 6. Obtener plantillas activas de un profesor específico
export const getSchedulesByProfessor = async (req, res) => {
    try {
        const { professorId } = req.params;
        
        // Usamos el método especializado del repositorio
        const schedules = await recurrentScheduleService.getSchedulesByProfessor(professorId);
        
        res.status(200).json({ status: "success", payload: schedules });
    } catch (error) {
        console.error("Error en getSchedulesByProfessor:", error);
        res.status(500).json({ status: "error", error: "Error al obtener horarios del profesor" });
    }
};