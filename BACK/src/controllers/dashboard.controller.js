import { membershipService, planService } from '../services/index.service.js';

const getStudentDashboard = async (req, res) => {
    try {
        // 🔥 MAGIA: Tomamos el ID real del usuario que hizo la petición
        // Esto elimina por completo el hardcoding que señaló el profe.
        const userId = req.user._id; 

        // Buscamos su membresía activa
        const memberships = await membershipService.getAll();
        const myMembership = memberships.find(m => m.studentId.toString() === userId.toString() && m.status === 'active');
        
        // Buscamos detalles de su plan
        const plans = await planService.getAll();
        const myPlan = myMembership ? plans.find(p => p._id.toString() === myMembership.planId.toString()) : null;

        res.json({
            status: 'success',
            payload: {
                membership: myMembership ? {
                    status: myMembership.status,
                    planName: myPlan ? myPlan.name : 'Plan Base',
                    expireDate: myMembership.expireDate,
                    usedClasses: myMembership.usedClassesThisMonth,
                    totalClasses: myMembership.availableClassesThisMonth
                } : null,
                nextPayment: myPlan ? { amount: myPlan.price } : { amount: 0 },
                reservations: [] // Esto se llenará en el CDU-01
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

const getAdminDashboard = async (req, res) => {
    try {
        const memberships = await membershipService.getAll();
        const activeCount = memberships.filter(m => m.status === 'active').length;
        
        res.json({
            status: 'success',
            payload: {
                revenue: activeCount * 30000,
                activeMemberships: activeCount,
                classOccupancy: "75%",
                pendingAlerts: 2,
                recentActivity: [] 
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

const getProfessorDashboard = async (req, res) => {
    try {
        // Por ahora enviamos una estructura vacía para que el frontend no rompa
        // Luego lo llenaremos cruzando las clases donde el profesor sea req.user._id
        res.json({
            status: 'success',
            payload: {
                todayClasses: [],
                weeklyStats: { totalClasses: 0, totalStudents: 0 }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export default {
    getStudentDashboard,
    getAdminDashboard,
    getProfessorDashboard
};