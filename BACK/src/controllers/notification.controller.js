import { notificationService } from "../services/index.service.js";

export const getAllNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getAll();
        res.status(200).json({ status: "success", payload: notifications });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error al obtener notificaciones" });
    }
};

export const getUserNotifications = async (req, res) => {
    try {
        const { uid } = req.params;
        const requestingUser = req.user;

        // 🛡️ ESCUDO DE PRIVACIDAD
        if (requestingUser._id !== uid && requestingUser.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "Acceso denegado a estas notificaciones" });
        }

        const notifications = await notificationService.getForUser(uid);
        res.status(200).json({ status: "success", payload: notifications });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error al obtener tus notificaciones" });
    }
};

// 🔥 NUEVO CONTROLADOR DE CREACIÓN
export const createNotification = async (req, res) => {
    try {
        const adminId = req.user._id; 
        const { subject, message, targetType, resolvedIds } = req.body;

        if (!adminId || !subject || !message || !targetType) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios" });
        }

        const newNotification = {
            adminId,
            subject,
            message,
            targetType,
            studentIds: resolvedIds || [],
            sent: resolvedIds ? resolvedIds.length : 0
        };

        const result = await notificationService.create(newNotification);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en createNotification:", error);
        res.status(500).json({ status: "error", error: "Error al enviar la notificación" });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { nid } = req.params;
        const result = await notificationService.delete(nid);
        if (!result) return res.status(404).json({ status: "error", error: "Notificación no encontrada" });
        res.status(200).json({ status: "success", message: "Notificación eliminada" });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error al eliminar" });
    }
};