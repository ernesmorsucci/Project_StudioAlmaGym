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

    async create(doc) {
        const newNotification = await notificationRepo.create(doc);

        if (doc.studentIds && doc.studentIds.length > 0) {
            // Ejecutar en segundo plano
            this._sendEmailsToReceivers(doc.studentIds, doc.subject, doc.message);
        }

        return newNotification;
    }

    async _sendEmailsToReceivers(studentIds, subject, message) {
        let successCount = 0;

        for (const studentId of studentIds) {
            const student = await userService.getBy({ _id: studentId });
            
            if (student && student.email) {
                // Modifica tu emailService para que acepte el 'subject'
                const sent = await emailService.sendNotificationEmail(student.email, subject, message);
                if (sent) successCount++;
            }
        }
        console.log(`Correos enviados: ${successCount}`);
    }
}