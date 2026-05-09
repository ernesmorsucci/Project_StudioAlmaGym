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
        // Ahora acepta un rango o un solo día
        const { date, startDate, endDate } = req.query; 

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else if (date) {
            start = new Date(date);
            start.setHours(0, 0, 0, 0);
            end = new Date(date);
            end.setHours(23, 59, 59, 999);
        } else {
            return res.status(400).json({ status: "error", error: "Proporciona ?date=X o ?startDate=X&endDate=Y" });
        }

        // Hacemos populate del profesor para que el frontend muestre "Sofía Ramos"
        const classes = await classService.getAll({ dateTime: { $gte: start, $lte: end }, isActive: true });
        
        // El frontend necesita el nombre del profe
        const classesPopulated = await Promise.all(classes.map(async (c) => {
            await c.populate('professorId', 'name');
            return c;
        }));
        
        res.status(200).json({ status: "success", payload: classesPopulated });
    } catch (error) {
        console.error("Error en getClassesByDate:", error);
        res.status(500).json({ status: "error", error: "Error al filtrar clases" });
    }
};

// NUEVO: P-HDU-02: Reporte de productividad del profesor
export const getProfessorReport = async (req, res) => {
    try {
        const { professorId } = req.params;
        const { startDate, endDate } = req.query; // Ej: ?startDate=2023-10-01&endDate=2023-10-31

        if (!startDate || !endDate) {
            return res.status(400).json({ status: "error", error: "Debe proporcionar startDate y endDate en la query" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Seguridad: Un profesor solo puede ver su propio reporte (o un Admin puede ver cualquiera)
        if (req.user._id !== professorId && req.user.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "No tienes permiso para ver el reporte de otro profesor" });
        }

        const report = await classService.getProfessorProductivity(professorId, start, end);
        
        // Sumar totales para facilitar el trabajo al frontend
        const totalOverallHours = report.reduce((acc, curr) => acc + curr.totalHoursWorked, 0);

        const rawClasses = await classService.getClassesByDateRange(start, end);
        const professorClasses = rawClasses.filter(c => c.professorId.toString() === professorId);

        res.status(200).json({ 
            status: "success", 
            payload: {
                summary: report,
                totalOverallHours,
                classesList: professorClasses // El frontend iterará sobre este array
            }
        });
    } catch (error) {
        console.error("Error en getProfessorReport:", error);
        res.status(500).json({ status: "error", error: "Error al generar el reporte de productividad" });
    }
};