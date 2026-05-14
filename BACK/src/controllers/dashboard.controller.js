import { membershipService, reserveService, planService, classService, userService } from "../services/index.service.js";

export const getStudentDashboard = async (req, res) => {
    try {
        const idUsuario = req.user._id;

        // 1. Buscamos membresía por studentId
        const membership = await membershipService.getBy({ studentId: idUsuario });
        
        if (!membership) {
            return res.status(200).json({
                status: "success",
                payload: {
                    membership: { status: 'Sin plan', planName: 'Ningún plan activo', usedClasses: 0, totalClasses: 0 },
                    nextPayment: { amount: 0 },
                    reservations: []
                }
            });
        }

        const plan = await planService.getBy({ _id: membership.planId });

        // 2. Buscamos reservas 'reserved'
        const reservationsRaw = await reserveService.getAll({ studentId: idUsuario, status: 'reserved' });
        
        // 3. Formateamos y traemos datos de clases/profesores
        const formattedReservations = await Promise.all(reservationsRaw.map(async (reserva) => {
            const classData = await classService.getBy({ _id: reserva.scheduleId }); 
            
            let instructorName = 'Por asignar';
            if (classData && classData.professorId) {
                const professor = await userService.getById(classData.professorId);
                if (professor) instructorName = professor.name;
            }

            const classDateObj = classData?.dateTime ? new Date(classData.dateTime) : (reserva.date ? new Date(reserva.date) : null);

            return {
                _id: reserva._id,
                rawDate: classDateObj, // Para ordenar
                time: classDateObj ? classDateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
                date: classDateObj ? classDateObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Sin fecha',
                name: classData?.name || 'Clase de Studio',
                instructor: instructorName,
                status: 'Confirmada'
            };
        }));

        // 🔥 ORDENAMOS POR FECHA (La más cercana primero)
        const sortedReservations = formattedReservations.sort((a, b) => a.rawDate - b.rawDate);

        res.status(200).json({
            status: "success",
            payload: {
                membership: {
                    status: membership.status,
                    planName: plan ? plan.name : 'Plan Studio',
                    expireDate: membership.expireDate,
                    usedClasses: membership.usedClassesThisMonth || 0,
                    totalClasses: plan ? (plan.weeklyClasses * 4) : 0 
                },
                nextPayment: { amount: plan ? plan.price : 0 },
                reservations: sortedReservations
            }
        });
    } catch (error) {
        console.error("❌ ERROR DASHBOARD STUDENT:", error);
        res.status(500).json({ error: "Error interno al procesar los datos." });
    }
};

export const getAdminDashboard = async (req, res) => {
    try {
        const memberships = await membershipService.getAll();
        const activeCount = memberships.filter(m => m.status === 'active').length;
        res.json({ status: 'success', payload: { revenue: activeCount * 30000, activeMemberships: activeCount, classOccupancy: "75%", pendingAlerts: 2, recentActivity: [] } });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const getProfessorDashboard = async (req, res) => {
    try {
        res.json({ status: 'success', payload: { todayClasses: [], weeklyStats: { totalClasses: 0, totalStudents: 0 } } });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};