import { classService, recurrentScheduleService, userService } from "../services/index.service.js";

// ==========================================
// NUEVO: Obtener clases para el Calendario
// ==========================================
export const getAvailableClasses = async (req, res) => {
    try {
        const classes = await classService.getAll({ isActive: true });
        
        // 🕵️‍♂️ RAYOS X: Imprimimos en la consola del backend lo que encontró
        console.log("👉 Clases encontradas en la BD:", classes.length); 

        const formattedClasses = await Promise.all(classes.map(async (c) => {
            // Manejo de errores por si falla el populate
            try {
                if (c.professorId) await c.populate('professorId', 'name');
            } catch (popErr) {
                console.log("Aviso: No se pudo cargar el nombre del profesor para la clase", c._id);
            }
            
            // Protección por si dateTime no es una fecha válida
            let horaFormateada = 'Sin horario';
            if (c.dateTime) {
                const fecha = new Date(c.dateTime);
                if (!isNaN(fecha)) {
                    horaFormateada = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                }
            }

            return {
                id: c._id,
                time: horaFormateada,
                name: c.name || 'Clase especial',
                instructor: (c.professorId && c.professorId.name) ? c.professorId.name : 'Profesor no asignado',
                duration: '60 min',
                spots: (c.maxQuota || 0) - (c.occupiedQuota || 0),
                totalSpots: c.maxQuota || 0,
                status: (c.occupiedQuota >= c.maxQuota) ? 'full' : 'available'
            };
        }));

        res.json({ status: 'success', payload: formattedClasses });
    } catch (error) {
        console.error("❌ Error en getAvailableClasses:", error);
        res.status(500).json({ status: 'error', error: 'Error al cargar las clases' });
    }
};

// 1. Obtener todas las clases
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

// 3. Crear una clase nueva
export const addClass = async (req, res) => {
    try {
        const { name, professorId, recurrentScheduleId, dateTime, endTime, maxQuota } = req.body;
        
        if (!name || !professorId || !dateTime || !endTime || !maxQuota) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios" });
        }

        const newClass = {
            name,
            professorId,
            recurrentScheduleId, 
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

// 4. Actualizar una clase
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
        const result = await classService.delete(cid);

        if (!result) return res.status(404).json({ status: "error", error: "Clase no encontrada" });

        res.status(200).json({ status: "success", message: "Clase eliminada físicamente de la base de datos" });
    } catch (error) {
        console.error("Error en deleteClass:", error);
        res.status(500).json({ status: "error", error: "Error al eliminar la clase" });
    }
};

// 6. Obtener clases por fecha
export const getClassesByDate = async (req, res) => {
    try {
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

        const classes = await classService.getAll({ dateTime: { $gte: start, $lte: end }, isActive: true });
        
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

// 7. Reporte de productividad
export const getProfessorReport = async (req, res) => {
    try {
        const { professorId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ status: "error", error: "Debe proporcionar startDate y endDate en la query" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        if (req.user._id !== professorId && req.user.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "No tienes permiso para ver el reporte de otro profesor" });
        }

        const report = await classService.getProfessorProductivity(professorId, start, end);
        const totalOverallHours = report.reduce((acc, curr) => acc + curr.totalHoursWorked, 0);

        const rawClasses = await classService.getClassesByDateRange(start, end);
        const professorClasses = rawClasses.filter(c => c.professorId.toString() === professorId);

        res.status(200).json({ 
            status: "success", 
            payload: {
                summary: report,
                totalOverallHours,
                classesList: professorClasses 
            }
        });
    } catch (error) {
        console.error("Error en getProfessorReport:", error);
        res.status(500).json({ status: "error", error: "Error al generar el reporte de productividad" });
    }
};