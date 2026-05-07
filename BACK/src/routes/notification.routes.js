import { Router } from "express";
import { 
    getAllNotifications, 
    getUserNotifications, 
    createNotification, 
    deleteNotification 
} from "../controllers/notification.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const notificationRouter = Router();

// 1. Un alumno consulta sus propias notificaciones
notificationRouter.get("/student/:uid", isAuthenticated, getUserNotifications);

// 2. El Admin ve el historial completo de notificaciones enviadas
notificationRouter.get("/", isAuthenticated, checkRole(['admin']), getAllNotifications);

// 3. El Admin crea y envía una nueva notificación
notificationRouter.post("/", isAuthenticated, checkRole(['admin']), createNotification);

// 4. El Admin borra una notificación vieja
notificationRouter.delete("/:nid", isAuthenticated, checkRole(['admin']), deleteNotification);

export default notificationRouter;