// src/services/email.service.js
import nodemailer from "nodemailer";

export default class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail', // O el proveedor que uses (SendGrid, Outlook, etc)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    /**
     * Envía un email genérico de notificación (Para avisos del Admin o Lista de Espera)
     */
    async sendNotificationEmail(toEmail, message) {
        try {
            await this.transporter.sendMail({
                from: `"Studio Alma" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: "🔔 Nueva notificación de Studio Alma",
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #6B705C;">Studio Alma</h2>
                        <div style="padding: 15px; border-left: 4px solid #A5A58D; background-color: #F9F9F9; font-size: 16px;">
                            ${message}
                        </div>
                        <p style="margin-top: 20px; font-size: 12px; color: #999;">
                            Por favor no respondas a este correo automático. Ingresa a tu Espacio para gestionar tus reservas.
                        </p>
                    </div>
                `
            });
            console.log(`[Email Service] Notificación enviada a ${toEmail}`);
            return true;
        } catch (error) {
            console.error(`[Email Service] Error enviando correo a ${toEmail}:`, error.message);
            return false;
        }
    }

    /**
     * PREPARACIÓN PARA EL PASO 4: Enviar código de 6 dígitos para recuperar contraseña
     */
    async sendRecoveryCode(toEmail, code) {
        try {
            await this.transporter.sendMail({
                from: `"Studio Alma" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: "🔐 Código de recuperación de contraseña",
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                        <h2 style="color: #6B705C;">Recuperación de contraseña</h2>
                        <p>Ingresa el siguiente código de 6 dígitos en la aplicación:</p>
                        <h1 style="letter-spacing: 5px; color: #333; background: #eee; display: inline-block; padding: 10px 20px; border-radius: 10px;">
                            ${code}
                        </h1>
                        <p style="color: #888; font-size: 12px; margin-top: 20px;">Este código expirará en 15 minutos.</p>
                    </div>
                `
            });
            console.log(`[Email Service] Código de recuperación enviado a ${toEmail}`);
            return true;
        } catch (error) {
            console.error(`[Email Service] Error enviando código a ${toEmail}:`, error.message);
            return false;
        }
    }
}