import GenericRepository from "./generic.repository.js";
import MembershipDao from "../dao/membership.dao.js";

const dao = new MembershipDao();

export default class MembershipRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    /**
     * Incrementa el contador de clases consumidas en la semana actual.
     * Se dispara automáticamente al confirmar una reserva (CDU-01).
     */
    incrementUsedClasses = (id) => {
        return this.dao.updateRaw(id, { $inc: { usedClassesThisWeek: 1 } });
    }

    /**
     * Decrementa el contador de clases.
     * Fundamental para el CDU-02: si el alumno cancela con antelación, 
     * recupera su posibilidad de reservar otro día de la semana.
     */
    decrementUsedClasses = (id) => {
        return this.dao.updateRaw(id, { $inc: { usedClassesThisWeek: -1 } });
    }

    /**
     * Proceso de limpieza semanal. 
     * Resetea los créditos de todos los alumnos activos al inicio de una nueva semana.
     */
    resetWeeklyCounters = (startOfNewWeek) => {
        return this.dao.updateMany(
            {
                status: 'active',
                currentWeek: { $lt: startOfNewWeek }
            },
            {
                $set: {
                    usedClassesThisWeek: 0,
                    currentWeek: startOfNewWeek
                }
            }
        );
    }

    /**
     * Renueva el ciclo de la membresía tras un pago exitoso (CDU-07).
     * Aplica la regla de negocio: Nueva fecha = Fecha de Pago + 30 días.
     */
    renewMembership = (id, newExpireDate) => {
        return this.dao.update(id, {
            status: 'active',
            expireDate: newExpireDate,
            // Al renovar, el alumno comienza su ciclo con créditos limpios
            usedClassesThisWeek: 0 
        });
    }

    /**
     * Recupera membresías que ya pasaron su fecha de vencimiento pero siguen marcadas como activas.
     * Útil para que el sistema o el admin ejecuten la suspensión de servicios.
     */
    findExpiredMemberships = (currentDate = new Date()) => {
        return this.dao.get({
            expireDate: { $lt: currentDate },
            status: 'active'
        });
    }

    /**
     * Filtra alumnos que vencen pronto (ej. en 3 días) para notificaciones segmentadas.
     */
    findSoonToExpire = (daysThreshold = 3) => {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + daysThreshold);
        
        return this.dao.get({
            expireDate: { $lte: limitDate, $gte: new Date() },
            status: 'active'
        });
    }
}