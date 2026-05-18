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
            // Ejecutar en segundo plano pero almacenar resultado
            this._sendEmailsToReceivers(doc.studentIds, doc.subject, doc.message, newNotification._id);
        }

        return newNotification;
    }

    async _sendEmailsToReceivers(studentIds, subject, message, notificationId) {
        let successCount = 0;
        let failedCount = 0;
        const failedEmails = [];

        console.log(`\n📧 [Notification Service] Iniciando envío de emails...`);
        console.log(`   Total de destinatarios: ${studentIds.length}`);
        console.log(`   IDs: ${studentIds.join(', ')}`);

        for (const studentId of studentIds) {
            try {
                console.log(`   🔍 Buscando estudiante: ${studentId}`);
                const student = await userService.getBy({ _id: studentId });
                
                if (student && student.email) {
                    console.log(`   ✉️  Encontrado: ${student.name} (${student.email})`);
                    const sent = await emailService.sendNotificationEmail(student.email, subject, message);
                    if (sent) {
                        successCount++;
                        console.log(`   ✅ Email enviado exitosamente`);
                    } else {
                        failedCount++;
                        failedEmails.push({ studentId, email: student.email, reason: "Email service returned false" });
                        console.log(`   ❌ Email service retornó false`);
                    }
                } else {
                    failedCount++;
                    failedEmails.push({ studentId, reason: "Student not found or no email" });
                    console.log(`   ❌ Estudiante no encontrado o sin email`);
                }
            } catch (error) {
                failedCount++;
                failedEmails.push({ studentId, reason: error.message });
                console.error(`   ❌ Error enviando email al alumno ID ${studentId}:`, error.message);
            }
        }
        
        console.log(`\n✅ [Notification Service] Resumen: ${successCount}/${studentIds.length} correos enviados exitosamente`);
        
        if (failedCount > 0) {
            console.warn(`⚠️  [Notification Service] ${failedCount} correos fallaron:`, failedEmails);
        }
        
        return { successCount, failedCount, failedEmails };
    }
}