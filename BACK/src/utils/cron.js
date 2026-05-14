import cron from "node-cron";
import { membershipService, paymentService } from "../services/index.service.js";
import { recurrentScheduleService, classService, reserveService } from "../services/index.service.js";
import reserveModel from '../dao/models/reserve.model.js';
/**
 * CRON JOBS - Studio Alma
 * 
 * Este archivo centraliza todas las tareas automáticas del sistema.
 * Se inicializa desde app.js llamando a startCronJobs().
 * 
 * Requiere: npm install node-cron
 */

// ==========================================
// JOB 1: RESET MENSUAL DE CRÉDITOS
// ==========================================
/**
 * Se ejecuta el día 1 de cada mes a las 00:00 hs.
 * 
 * Regla del PDF: los créditos de recuperación expiran el día 1 de cada mes.
 * Resetea usedClassesThisMonth a 0 y actualiza currentPeriod para todas
 * las membresías activas cuyo currentPeriod sea anterior al mes nuevo.
 * 
 * Cron: '0 0 1 * *' = día 1 de cada mes a medianoche
 */
const monthlyCreditsReset = cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON] Iniciando reset mensual de créditos...');
    try {
        const startOfNewPeriod = new Date();
        startOfNewPeriod.setHours(0, 0, 0, 0);

        const result = await membershipService.resetMonthlyCounters(startOfNewPeriod);
        console.log(`[CRON] Reset mensual completado. Membresías actualizadas: ${result.modifiedCount}`);
    } catch (error) {
        console.error('[CRON] Error en el reset mensual de créditos:', error.message);
    }
}, { scheduled: false });


// ==========================================
// JOB 2: EXPIRACIÓN AUTOMÁTICA DE MEMBRESÍAS
// ==========================================
/**
 * Se ejecuta todos los días a las 01:00 hs.
 * Busca membresías activas cuya expireDate ya pasó y las marca como 'expired'.
 * 
 * Cron: '0 1 * * *' = todos los días a la 1 AM
 */
const membershipExpirationCheck = cron.schedule('0 1 * * *', async () => {
    console.log('[CRON] Verificando membresías vencidas...');
    try {
        const expiredMemberships = await membershipService.findExpiredMemberships();

        if (!expiredMemberships || expiredMemberships.length === 0) {
            console.log('[CRON] No hay membresías vencidas para procesar.');
            return;
        }

        const updatePromises = expiredMemberships.map(m =>
            membershipService.update(m._id, { status: 'expired' })
        );
        await Promise.all(updatePromises);

        console.log(`[CRON] ${expiredMemberships.length} membresía(s) marcadas como 'expired'.`);
    } catch (error) {
        console.error('[CRON] Error al procesar membresías vencidas:', error.message);
    }
}, { scheduled: false });


// ==========================================
// JOB 3: EXPIRACIÓN AUTOMÁTICA DE PAGOS PENDIENTES
// ==========================================
/**
 * Se ejecuta todos los días a las 02:00 hs.
 * Busca pagos en estado 'pending' cuya fecha de expiración ya pasó
 * y los pasa a estado 'expired'.
 * 
 * Cron: '0 2 * * *' = todos los días a las 2 AM
 */
const paymentExpirationCheck = cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Verificando pagos pendientes vencidos...');
    try {
        const expiredPayments = await paymentService.getPendingExpiredPayments();

        if (!expiredPayments || expiredPayments.length === 0) {
            console.log('[CRON] No hay pagos vencidos para procesar.');
            return;
        }

        const updatePromises = expiredPayments.map(p =>
            paymentService.update(p._id, { status: 'expired' })
        );
        await Promise.all(updatePromises);

        console.log(`[CRON] ${expiredPayments.length} pago(s) marcados como 'expired'.`);
    } catch (error) {
        console.error('[CRON] Error al procesar pagos vencidos:', error.message);
    }
}, { scheduled: false });

// ==========================================
// JOB 4: GENERADOR AUTOMÁTICO DE CLASES (2 Semanas)
// ==========================================
/**
 * Se ejecuta todos los días a las 03:00 hs.
 * Mira exactamente el día de "Hoy + 14 días".
 * Busca todas las plantillas activas que correspondan a ese día de la semana,
 * y genera físicamente los documentos en la colección Class.
 */
const classGenerator = cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Iniciando generador de clases (2 semanas a futuro)...');
    try {
        // 1. Determinar el día objetivo (Hoy + 14 días)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 14);
        const targetDayOfWeek = targetDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.

        // 2. Traer todas las plantillas activas
        const activeSchedules = await recurrentScheduleService.getAll({ isActive: true });
        
        let classesCreated = 0;

        // 3. Iterar y crear
        for (const schedule of activeSchedules) {
            // Si la plantilla incluye este día de la semana
            if (schedule.daysWeek.includes(targetDayOfWeek)) {
                
                // Extraer hora y minutos de la plantilla (Ej: "18:30")
                const [startHour, startMin] = schedule.startTime.split(':');
                const [endHour, endMin] = schedule.endTime.split(':');

                // Construir la fecha/hora exacta de inicio
                const classDateTime = new Date(targetDate);
                classDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

                // Construir la fecha/hora exacta de fin
                const classEndTime = new Date(targetDate);
                classEndTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

                // Verificar si por alguna razón la clase ya se había generado (para no duplicar)
                const exists = await classService.getBy({ 
                    recurrentScheduleId: schedule._id, 
                    dateTime: classDateTime 
                });

                if (!exists) {
                    await classService.create({
                        name: schedule.name,
                        professorId: schedule.professorId,
                        recurrentScheduleId: schedule._id,
                        dateTime: classDateTime,
                        endTime: classEndTime,
                        maxQuota: schedule.maxQuota,
                        occupiedQuota: 0,
                        isActive: true
                    });
                    classesCreated++;
                }
            }
        }

        console.log(`[CRON] Generación finalizada. Se crearon ${classesCreated} clases para el día ${targetDate.toLocaleDateString()}.`);
    } catch (error) {
        console.error('[CRON] Error en el generador de clases:', error.message);
    }
}, { scheduled: false });

const absentDetector = cron.schedule('*/10 * * * *', async () => {
    console.log('[CRON] Iniciando detector de Ausentes');
        try {
            const count = await reserveService.processAbsences();

            if (count > 0) {
                console.log(`[CRON] 🕒 Se procesaron ${count} clases vencidas (Ausente + Reembolso de crédito).`);
            }
        } catch (error) {
            console.error("[CRON] Error actualizando ausencias:", error.message);
        }
    });
// ==========================================
// FUNCIÓN PRINCIPAL - llamar desde app.js
// ==========================================
export const startCronJobs = () => {
    monthlyCreditsReset.start();
    membershipExpirationCheck.start();
    paymentExpirationCheck.start();
    classGenerator.start()
    absentDetector.start()
    console.log('[CRON] Todos los jobs iniciados correctamente.');
};