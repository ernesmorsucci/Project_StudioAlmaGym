// src/services/notification.service.js
import NotificationRepository from "../repository/notification.repository.js";
import EmailService from "./email.service.js";
import { userService } from "./index.service.js"; 

const notificationRepo = new NotificationRepository();
const emailService = new EmailService();

export default class NotificationService {
    getAll = () => notificationRepo.getAll();
    getBy = (params) => notificationRepo.getBy(params);
    delete = (id) => notificationRepo.delete(id);
    getForUser = (userId) => notificationRepo.getForUser(userId);

    /**
     * Crea la notificación en BD (Panel Web) y la envía por Email
     */
    async create(doc) {
        // 1. Guardar en Base de Datos (Para el frontend de React)
        const newNotification = await notificationRepo.create(doc);

        // 2. Enviar correos a los destinatarios afectados
        if (doc.receivers === 'specific' && doc.studentIds && doc.studentIds.length > 0) {
            // Ejecutar en segundo plano para no bloquear la respuesta
            this._sendEmailsToReceivers(doc.studentIds, doc.message);
        }

        return newNotification;
    }

    /**
     * Método privado: Busca los emails de los alumnos y dispara el envío
     */
    async _sendEmailsToReceivers(studentIds, message) {
        let successCount = 0;

        for (const studentId of studentIds) {
            const student = await userService.getBy({ _id: studentId });
            
            if (student && student.email) {
                const sent = await emailService.sendNotificationEmail(student.email, message);
                if (sent) successCount++;
            }
        }

        console.log(`[Notification Service] Envío masivo completado: ${successCount}/${studentIds.length} correos entregados.`);
    }
}