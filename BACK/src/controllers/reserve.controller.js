import { reserveService } from "../services/index.service.js";

// 1. Crear una reserva
export const createReserve = async (req, res) => {
    try {
        const { studentId, scheduleId, date } = req.body;

        if (!studentId || !scheduleId || !date) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios para la reserva." });
        }

        // Toda la lógica de negocio y validación está en el servicio
        const result = await reserveService.createReserve(studentId, scheduleId, date);
        
        res.status(201).json({ status: "success", message: "Reserva confirmada.", payload: result });
    } catch (error) {
        console.error("Error al crear reserva:", error.message);
        res.status(400).json({ status: "error", error: error.message });
    }
};

// 2. Cancelar una reserva (y devolver el cupo)
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

// 3. Obtener reservas de un alumno específico (Para el Modal del Admin)
export const getStudentReserves = async (req, res) => {
    try {
        const { uid } = req.params;

        // Buscamos todas las reservas de este alumno
        // Nota: El repository idealmente debería hacer un .populate('scheduleId') para traer el nombre de la clase
        const reserves = await reserveService.getAll({ studentId: uid });

        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        console.error("Error al obtener reservas del alumno:", error);
        res.status(500).json({ status: "error", error: "Error interno del servidor." });
    }
};

// 4. Obtener TODAS las reservas (Para reportes del Admin)
export const getAllReserves = async (req, res) => {
    try {
        const reserves = await reserveService.getAll();
        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error interno del servidor." });
    }
};