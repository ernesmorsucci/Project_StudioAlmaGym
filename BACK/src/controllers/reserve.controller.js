import { reserveService, classService } from '../services/index.service.js';
// 🔥 IMPORTAMOS LOS MODELOS DIRECTAMENTE PARA PODER POPULAR (Traer datos anidados)
import reserveModel from "../dao/models/reserve.model.js";
import classModel from "../dao/models/class.model.js";

// Nuevo: Obtener todas las reservas de las clases que dicta un profesor
export const getReservesByProfessor = async (req, res) => {
    try {
        const { pid } = req.params;
        const classes = await classModel.find({ professorId: pid }).select('_id');
        const classIds = classes.map(c => c._id);

        const reserves = await reserveModel.find({ scheduleId: { $in: classIds } })
            .populate('studentId', 'name email phone')
            .populate({ path: 'scheduleId', populate: { path: 'professorId', select: 'name' } })
            .sort({ date: 1 });

        const grouped = {};
        reserves.forEach(r => {
            const key = (r.scheduleId && r.scheduleId._id) ? r.scheduleId._id.toString() : r.scheduleId.toString();
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });

        res.status(200).json({ status: 'success', payload: grouped });
    } catch (error) {
        console.error('Error en getReservesByProfessor:', error.message || error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor.' });
    }
};

// 1. Crear una reserva
export const createReserve = async (req, res) => {
    try {
        const { studentId, scheduleId, date } = req.body;

        if (!studentId || !scheduleId || !date) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios para la reserva." });
        }

        const result = await reserveService.createReserve(studentId, scheduleId, date);
        res.status(201).json({ status: "success", message: "Reserva confirmada.", payload: result });
    } catch (error) {
        console.error("Error al crear reserva:", error.message);
        res.status(400).json({ status: "error", error: error.message });
    }
};

export const cancelReserve = async (req, res) => {
    try {
        // 1. Usamos 'rid' tal como lo reveló el console.log
        const reserveId = req.params.rid; 
        
        // 2. Usamos 'getBy' que es el método que tu arquitectura realmente soporta
        const reserve = await reserveService.getBy({ _id: reserveId });
        
        if (!reserve) {
            console.log("❌ No se encontró la reserva con ID:", reserveId);
            return res.status(404).json({ status: 'error', error: "Reserva no encontrada" });
        }

        // 🛡️ CAPA 1: Defensa por Estado (Cuidando al Cron Job)
        if (reserve.status === 'attended' || reserve.status === 'absent' || reserve.status === 'cancelled') {
            return res.status(400).json({ 
                status: 'error', 
                error: "No puedes cancelar una reserva que ya ha sido procesada o finalizada." 
            });
        }

        // 🛡️ CAPA 2: Defensa por Tiempo (Evitando Viajes en el Tiempo)
        // Usamos getBy también para la clase, por si classService funciona igual que reserveService
        const classData = await classService.getBy({ _id: reserve.classId });

        if (classData) {
            const classDate = new Date(classData.date); // Verifica que tu modelo use 'date' o cámbialo por 'startDate'
            const now = new Date();
            
            if (now >= classDate) {
                return res.status(400).json({ 
                    status: 'error', 
                    error: "El tiempo para cancelar esta clase ya ha expirado." 
                });
            }
        }

       // 🟢 3. Lógica de cancelación real (Llamamos a tu motor inteligente)
        const updatedReserve = await reserveService.cancelReserve(reserveId);
        
        // 🟢 4. Respondemos al Frontend
        res.status(200).json({ 
            status: 'success', 
            message: 'Reserva cancelada correctamente. Si había lista de espera, se ha notificado al siguiente alumno.',
            payload: updatedReserve 
        });
    } catch (error) {
        console.error("Error al cancelar:", error);
        res.status(500).json({ status: 'error', error: "Error interno del servidor" });
    }
};

// 3. Obtener reservas de un alumno específico
export const getStudentReserves = async (req, res) => {
    try {
        const { uid } = req.params;
        const { upcoming } = req.query;

        let query = { studentId: uid };

        if (upcoming === 'true') {
            // 🔥 SOLUCIÓN 1: Usamos la fecha y HORA EXACTA actual
            query.date = { $gte: new Date() };
            // 🔥 Evitamos que salgan clases canceladas en las "Próximas"
            query.status = 'reserved'; 
        }

        const reserves = await reserveModel.find(query)
            .populate({
                path: 'scheduleId',
                populate: { path: 'professorId', select: 'name' }
            })
            .sort({ date: 1 }) // Ordenar de más próxima a más lejana
            .limit(25);

        const formattedReserves = reserves.map(r => {
            const doc = r.toJSON();
            doc.class = doc.scheduleId;   
            doc.classId = doc.scheduleId; 
            return doc;
        });

        res.status(200).json({ status: "success", payload: formattedReserves });
    } catch (error) {
        console.error("Error al obtener reservas del alumno:", error);
        res.status(500).json({ status: "error", error: "Error interno del servidor." });
    }
};

// 4. Obtener TODAS las reservas
export const getAllReserves = async (req, res) => {
    try {
        // Populamos también aquí para que todas las tablas del Admin tengan nombres reales
        const reserves = await reserveModel.find()
            .populate('studentId', 'name email')
            .populate({
                path: 'scheduleId',
                populate: { path: 'professorId', select: 'name' }
            })
            .sort({ date: -1 });

        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error interno del servidor." });
    }
};
// 5. Obtener reservas de una clase específica (Para el motor de notificaciones)
export const getClassReserves = async (req, res) => {
    try {
        const { cid } = req.params;

        // Buscamos reservas por scheduleId o por el legacy classId y poblamos student y clase
        const reserves = await reserveModel.find({
            $or: [
                { scheduleId: cid },
                { classId: cid }
            ]
        })
        .populate('studentId', 'name email phone')
        .populate({ path: 'scheduleId', populate: { path: 'professorId', select: 'name' } })
        .sort({ date: 1 });

        // DEBUG ADICIONAL: Conteo total de reservas y ejemplo de documento
        try {
            const totalReserves = await reserveModel.countDocuments();
            const sample = await reserveModel.findOne().lean();
            console.log(`[getClassReserves] totalReserves=${totalReserves} sample=${sample ? JSON.stringify(sample) : 'none'}`);
        } catch (dbgErr) {
            console.log('[getClassReserves] error al obtener sample de reservas:', dbgErr.message);
        }

        console.log(`[getClassReserves] encontrados=${reserves.length} reservas para clase ${cid}`);

        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        console.error("Error al obtener reservas de la clase:", error?.message || error);
        res.status(500).json({ status: "error", error: error?.message || "Error interno del servidor." });
    }
};
// 🔥 NUEVO: Función para que la profesora pase asistencia
export const updateAttendance = async (req, res) => {
    try {
        const { rid } = req.params; 
        const { status } = req.body; // Aquí llega 'attended' o 'absent' desde tu botón

        if (!['attended', 'absent'].includes(status)) {
            return res.status(400).json({ status: "error", error: "Estado no válido." });
        }

        // 🔥 AHORA SÍ: Llamamos a la función que cambia el status explícitamente
        const result = await reserveService.updateReserveStatus(rid, status);
        
        res.status(200).json({ 
            status: "success", 
            message: `Asistencia guardada: ${status === 'attended' ? 'Presente' : 'Ausente'}`,
            payload: result 
        });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
};
