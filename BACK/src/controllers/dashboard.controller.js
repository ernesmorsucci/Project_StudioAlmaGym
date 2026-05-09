import { userService, membershipService, classService, paymentService, reserveService } from "../services/index.service.js";

// Dashboard para el Administrador (Metrics + Widgets)
export const getAdminDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23,59,59,999);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

        const activeMemberships = await membershipService.getAll({ status: 'active' });
        const classesToday = await classService.getClassesByDateRange(today, endOfToday);
        const classesTodayPopulated = await Promise.all(classesToday.map(c => c.populate('professorId', 'name')));
        
        const monthlyPayments = await paymentService.getPaymentsByDateRange(startOfMonth, endOfMonth);
        const ingresosMes = monthlyPayments.reduce((acc, curr) => acc + curr.amount, 0);

        const defaulters = await paymentService.getPendingExpiredPayments();
        const expiringSoon = await membershipService.findSoonToExpire(3);
        const expiringPopulated = await Promise.all(expiringSoon.map(m => m.populate('studentId planId', 'name')));

        res.status(200).json({
            status: "success",
            payload: {
                metrics: {
                    alumnosActivos: activeMemberships.length,
                    deudoresTotales: defaulters.length,
                    ingresosMesActual: ingresosMes
                },
                widgets: {
                    ocupacionHoy: classesTodayPopulated,
                    vencenEstaSemana: expiringPopulated
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error al cargar el dashboard" });
    }
};

// Dashboard para el Profesor (Métricas de sus clases de hoy)
export const getProfessorDashboard = async (req, res) => {
    try {
        const professorId = req.user._id;
        const today = new Date();
        today.setHours(0,0,0,0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23,59,59,999);

        const classesToday = await classService.getClassesByProfessor(professorId, today, endOfToday);

        let totalAlumnosHoy = 0;
        let deudoresHoy = 0;
        const clasesConResumen = [];

        for (const c of classesToday) {
            totalAlumnosHoy += c.occupiedQuota;
            const reservas = await reserveService.getClassReservationsWithDefaulters(c._id);
            deudoresHoy += reservas.filter(r => r.isDefaulter).length;

            clasesConResumen.push({
                _id: c._id,
                name: c.name,
                dateTime: c.dateTime,
                occupiedQuota: c.occupiedQuota,
                maxQuota: c.maxQuota
            });
        }

        res.status(200).json({
            status: "success",
            payload: {
                metrics: {
                    clasesHoy: classesToday.length,
                    alumnosHoy: totalAlumnosHoy,
                    deudoresHoy: deudoresHoy
                },
                clases: clasesConResumen
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error al cargar el dashboard del profesor" });
    }
};