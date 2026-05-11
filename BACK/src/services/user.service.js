import UsersDao from '../dao/users.dao.js';
import MembershipDao from '../dao/membership.dao.js';
import PlanDao from '../dao/plan.dao.js';

const usersDAO = new UsersDao();
const membershipDAO = new MembershipDao();
const planDAO = new PlanDao();

export default class UsersService {
    
    async getAll(filter = {}) {
        return await usersDAO.get(filter);
    }

    async getById(id) {
        return await usersDAO.getBy({ _id: id });
    }

    async getBy(filter) {
        return await usersDAO.getBy(filter);
    }

    async create(data) {
        return await usersDAO.save(data);
    }

    async update(id, data) {
        return await usersDAO.update(id, data);
    }

    async delete(id) {
        return await usersDAO.delete(id);
    }

    // =========================================================
    // LÓGICA PARA EL DASHBOARD DE ALUMNOS (ADMIN)
    // =========================================================
    async getStudentsWithMembershipData() {
        // 1. Obtenemos todos los alumnos
        const students = await usersDAO.get({ rol: 'alumno' });
        
        const dashboardData = await Promise.all(students.map(async (student) => {
            // 2. Buscamos la membresía activa
            const memberships = await membershipDAO.get({ studentId: student._id, status: 'active' });
            const activeMembership = memberships[0];

            let status = 'Sin plan';
            let daysRemaining = null;
            let planName = '—';
            let usage = '—';
            let expirationDateFormatted = '—';

            if (activeMembership && activeMembership.expireDate) {
                const plan = await planDAO.getBy({ _id: activeMembership.planId });
                const expiration = new Date(activeMembership.expireDate);
                
                if (!isNaN(expiration.getTime())) {
                    if (plan) {
                        planName = plan.name;
                        const totalClasses = (plan.weeklyClasses || 0) * 4;
                        usage = `${activeMembership.usedClassesThisMonth || 0}/${totalClasses}`;
                    }

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    expiration.setHours(0, 0, 0, 0);

                    const diffTime = expiration - today;
                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    expirationDateFormatted = expiration.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

                    if (daysRemaining < 0) status = 'Vencida';
                    else if (daysRemaining <= 7) status = 'Vence pronto';
                    else status = 'Al día';
                }
            }

            // 3. RETORNAMOS EL OBJETO CON LOS NUEVOS CAMPOS DE LA BASE DE DATOS
            return {
                id: student._id,
                name: student.name,
                email: student.email,
                phone: student.phone || 'Sin teléfono',
                emergencyContact: student.emergencyContact || '—',
                healthNotes: student.healthNotes || 'Sin notas',
                plan: planName,
                
                membershipId: activeMembership ? activeMembership._id : null, // <-- NUEVA LÍNEA
                planId: activeMembership ? activeMembership.planId : null,    // <-- NUEVA LÍNEA
                
                expiration: expirationDateFormatted,
                status: status,
                usage: usage,
                daysRemaining: daysRemaining
            };
        }));

        return dashboardData;
    }
}