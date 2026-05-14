// src/services/email.service.js
import nodemailer from "nodemailer";

export default class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    /**
     * Envía un email genérico de notificación (Para avisos del Admin)
     */
    async sendNotificationEmail(toEmail, subject, message) {
        try {
            await this.transporter.sendMail({
                from: `"Studio Alma" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: `🔔 ${subject}`,
                // 🔥 PLANTILLA RESPONSIVE PROFESIONAL
                html: `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${subject}</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 20px 10px;">
                        <tr>
                            <td align="center">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                                    <tr>
                                        <td style="background-color: #6B705C; padding: 30px 20px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: normal; letter-spacing: 2px; font-family: Georgia, serif;">STUDIO ALMA</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px;">${subject}</h2>
                                            <div style="color: #555555; font-size: 16px; line-height: 1.6; white-space: pre-wrap; background-color: #f9fafb; padding: 20px; border-left: 4px solid #A5A58D; border-radius: 4px;">${message}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                                            <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                                                Este es un mensaje automático. Por favor no respondas a este correo.
                                            </p>
                                            <p style="margin: 5px 0 0 0; color: #aaaaaa; font-size: 12px;">
                                                Ingresa a tu aplicación para gestionar tus reservas.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
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
     * Envía código de 6 dígitos para recuperar contraseña
     */
    async sendRecoveryCode(toEmail, code) {
        try {
            await this.transporter.sendMail({
                from: `"Studio Alma" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: "🔐 Código de recuperación de contraseña",
                html: `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 20px 10px;">
                        <tr>
                            <td align="center">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                                    <tr>
                                        <td style="background-color: #6B705C; padding: 30px 20px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: normal; letter-spacing: 2px; font-family: Georgia, serif;">STUDIO ALMA</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px; text-align: center;">
                                            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px;">Recuperación de contraseña</h2>
                                            <p style="color: #555555; font-size: 16px; margin-bottom: 30px;">Ingresa el siguiente código de 6 dígitos en la aplicación:</p>
                                            <div style="background-color: #f9fafb; border: 2px dashed #A5A58D; padding: 15px 30px; display: inline-block; border-radius: 8px;">
                                                <h1 style="margin: 0; letter-spacing: 8px; color: #333333; font-size: 32px;">${code}</h1>
                                            </div>
                                            <p style="margin: 30px 0 0 0; color: #e63946; font-size: 14px; font-weight: bold;">
                                                Este código expirará en 15 minutos.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                                            <p style="margin: 0; color: #aaaaaa; font-size: 12px;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
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