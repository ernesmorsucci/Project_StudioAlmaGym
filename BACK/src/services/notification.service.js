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
            // 🔥 LA MAGIA: Ponemos un try-catch INDIVIDUAL para cada envío
            try {
                const student = await userService.getBy({ _id: studentId });
                
                if (student && student.email) {
                    // Enviamos los tres datos requeridos
                    const sent = await emailService.sendNotificationEmail(student.email, subject, message);
                    if (sent) successCount++;
                }
            } catch (error) {
                // Si este correo falla, solo lo anotamos en la consola, pero el bucle NO SE DETIENE
                console.error(`Error enviando email al alumno ID ${studentId}:`, error.message);
            }
        }
        console.log(`Proceso finalizado. Correos masivos enviados con éxito: ${successCount} de ${studentIds.length}`);
    }
}