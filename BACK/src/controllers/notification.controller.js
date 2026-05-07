import { notificationService } from "../services/index.service.js";

// 1. Obtener todas las notificaciones (Para el panel del Admin)
export const getAllNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getAll();
        res.status(200).json({ status: "success", payload: notifications });
    } catch (error) {
        console.error("Error en getAllNotifications:", error);
        res.status(500).json({ status: "error", error: "Error al obtener notificaciones" });
    }
};

// 2. Obtener las notificaciones de un alumno (Para la campanita en su App)
export const getUserNotifications = async (req, res) => {
    try {
        const { uid } = req.params;
        const notifications = await notificationService.getForUser(uid);
        res.status(200).json({ status: "success", payload: notifications });
    } catch (error) {
        console.error("Error en getUserNotifications:", error);
        res.status(500).json({ status: "error", error: "Error al obtener tus notificaciones" });
    }
};

// 3. Crear una nueva notificación (El Admin avisa algo)
export const createNotification = async (req, res) => {
    try {
        const { adminId, message, receivers, studentIds, relatedClass } = req.body;

        if (!adminId || !message || !receivers) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios" });
        }

        const newNotification = {
            adminId,
            message,
            receivers, // 'all' o 'specific'
            studentIds: receivers === 'specific' ? studentIds : [],
            relatedClass: relatedClass || null,
            sent: receivers === 'specific' ? studentIds.length : 0
        };

        const result = await notificationService.create(newNotification);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en createNotification:", error);
        res.status(500).json({ status: "error", error: "Error al enviar la notificación" });
    }
};

// 4. Borrar una notificación (Limpieza del Admin)
export const deleteNotification = async (req, res) => {
    try {
        const { nid } = req.params;
        const result = await notificationService.delete(nid);
        
        if (!result) return res.status(404).json({ status: "error", error: "Notificación no encontrada" });

        res.status(200).json({ status: "success", message: "Notificación eliminada permanentemente" });
    } catch (error) {
        console.error("Error en deleteNotification:", error);
        res.status(500).json({ status: "error", error: "Error al eliminar la notificación" });
    }
};