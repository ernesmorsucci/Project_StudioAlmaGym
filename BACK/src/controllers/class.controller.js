import { classService } from "../services/index.service.js";

// 1. Obtener todas las clases (puedes pasarle filtros como { isActive: true })
export const getAllClasses = async (req, res) => {
    try {
        const classes = await classService.getAll();
        res.status(200).json({ status: "success", payload: classes });
    } catch (error) {
        console.error("Error en getAllClasses:", error);
        res.status(500).json({ status: "error", error: "Error al obtener las clases" });
    }
};

// 2. Obtener una clase específica por su ID
export const getClassById = async (req, res) => {
    try {
        const { cid } = req.params;
        const classData = await classService.getBy({ _id: cid });
        
        if (!classData) return res.status(404).json({ status: "error", error: "Clase no encontrada" });
        
        res.status(200).json({ status: "success", payload: classData });
    } catch (error) {
        console.error("Error en getClassById:", error);
        res.status(500).json({ status: "error", error: "Error al obtener la clase" });
    }
};

// 3. Crear una clase nueva (Manual/Puntual)
export const addClass = async (req, res) => {
    try {
        const { name, professorId, recurrentScheduleId, dateTime, endTime, maxQuota } = req.body;
        
        // Validación básica de campos obligatorios
        if (!name || !professorId || !dateTime || !endTime || !maxQuota) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios" });
        }

        const newClass = {
            name,
            professorId,
            recurrentScheduleId, // Puede ser null si es una clase especial
            dateTime,
            endTime,
            maxQuota,
            occupiedQuota: 0,
            isActive: true
        };

        const result = await classService.create(newClass);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en addClass:", error);
        res.status(500).json({ status: "error", error: "Error al crear la clase" });
    }
};

// 4. Actualizar una clase (ej: cambiar profesor o cupo)
export const updateClass = async (req, res) => {
    try {
        const { cid } = req.params;
        const updateData = req.body;

        const result = await classService.update(cid, updateData);
        if (!result) return res.status(404).json({ status: "error", error: "Clase no encontrada" });

        res.status(200).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en updateClass:", error);
        res.status(500).json({ status: "error", error: "Error al actualizar la clase" });
    }
};

// 5. Eliminar una clase
export const deleteClass = async (req, res) => {
    try {
        const { cid } = req.params;
        
        // Cambio a borrado físico
        const result = await classService.delete(cid);

        if (!result) return res.status(404).json({ status: "error", error: "Clase no encontrada" });

        res.status(200).json({ status: "success", message: "Clase eliminada físicamente de la base de datos" });
    } catch (error) {
        console.error("Error en deleteClass:", error);
        res.status(500).json({ status: "error", error: "Error al eliminar la clase" });
    }
};

/**
 * MÉTODO EXTRA SUGERIDO: Obtener clases por fecha
 * Útil para que la alumna elija qué día quiere ir.
 */
export const getClassesByDate = async (req, res) => {
    try {
        const { date } = req.query; // Ejemplo: ?date=2023-10-25
        if (!date) return res.status(400).json({ status: "error", error: "Debe proporcionar una fecha" });

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        // Usamos el método especializado que ya definieron en el Repository
        const classes = await classService.getClassesByDateRange(start, end);
        
        res.status(200).json({ status: "success", payload: classes });
    } catch (error) {
        console.error("Error en getClassesByDate:", error);
        res.status(500).json({ status: "error", error: "Error al filtrar por fecha" });
    }
};