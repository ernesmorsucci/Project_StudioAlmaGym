import ReserveService from "../services/reserve.service.js";
import { reserveService as repoReserveService } from "../services/index.service.js"; // Para métodos que aún no migramos

const reserveService = new ReserveService();

export const getAllReserves = async (req, res) => {
    try {
        const reserves = await repoReserveService.getAll();
        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error al obtener las reservas" });
    }
};

export const getStudentReservations = async (req, res) => {
    try {
        const { uid } = req.params;
        if (req.user._id !== uid && req.user.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "Acceso denegado" });
        }
        const reserves = await repoReserveService.findUserReservations(uid);
        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error interno" });
    }
};

export const getClassReservations = async (req, res) => {
    try {
        const { cid } = req.params;
        // USAMOS EL NUEVO MÉTODO DEL SERVICIO (Detecta morosos)
        const reserves = await reserveService.getClassReservationsWithDefaulters(cid);
        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
};

export const createReserve = async (req, res) => {
    try {
        if (!req.body.classId) return res.status(400).json({ status: "error", error: "Falta el ID de la clase" });
        
        // TODA LA LÓGICA DELEGADA AL SERVICIO
        const result = await reserveService.createReservation(req.user._id, req.body.classId);
        res.status(201).json({ status: "success", payload: result.reserve, message: result.message });
    } catch (error) {
        res.status(400).json({ status: "error", error: error.message });
    }
};

export const cancelReserve = async (req, res) => {
    try {
        // TODA LA LÓGICA DELEGADA AL SERVICIO
        const result = await reserveService.cancelReservation(req.params.rid, req.user);
        res.status(200).json({ status: "success", message: result.message });
    } catch (error) {
        res.status(400).json({ status: "error", error: error.message });
    }
};

export const markAttendance = async (req, res) => {
    try {
        const { rid } = req.params;
        const { assistance } = req.body;
        if (!['assisted', 'absent'].includes(assistance)) {
            return res.status(400).json({ status: "error", error: "Estado inválido" });
        }
        const result = await repoReserveService.markAttendance(rid, assistance);
        res.status(200).json({ status: "success", message: "Asistencia registrada", payload: result });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error interno" });
    }
};