import { reserveService } from "../services/index.service.js";
// 🔥 IMPORTAMOS EL MODELO DIRECTAMENTE PARA PODER POPULAR (Traer datos anidados)
import reserveModel from "../dao/models/reserve.model.js";

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

// 2. Cancelar una reserva
export const cancelReserve = async (req, res) => {
    try {
        const { rid } = req.params;
        const result = await reserveService.cancelReserve(rid);
        res.status(200).json({ status: "success", message: "Reserva cancelada correctamente.", payload: result });
    } catch (error) {
        console.error("Error al cancelar reserva:", error.message);
        res.status(400).json({ status: "error", error: error.message });
    }
};

// 3. Obtener reservas de un alumno específico (🔥 AQUÍ ESTABA EL ERROR DEL MODAL)
// 3. Obtener reservas de un alumno específico
export const getStudentReserves = async (req, res) => {
    try {
        const { uid } = req.params;

        // 🔥 LA MAGIA: Agregamos .limit(30) para traer solo las más relevantes
        const reserves = await reserveModel.find({ studentId: uid })
            .populate({
                path: 'scheduleId',
                populate: { path: 'professorId', select: 'name' }
            })
            .sort({ date: -1 })
            .limit(25); // <-- LÍMITE APLICADO AQUÍ

        // Mapeamos creando un "alias" (class) por si el frontend busca ese nombre
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
        
        // Buscamos todas las reservas que coincidan con el scheduleId (clase)
        const reserves = await reserveService.getAll({ scheduleId: cid });

        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        console.error("Error al obtener reservas de la clase:", error);
        res.status(500).json({ status: "error", error: "Error interno del servidor." });
    }
};