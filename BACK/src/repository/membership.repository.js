import GenericRepository from "./generic.repository.js";
import MembershipDao from "../dao/membership.dao.js";

const dao = new MembershipDao();

export default class MembershipRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    /**
     * Incrementa el contador de clases consumidas en el mes actual.
     * Se dispara automáticamente al confirmar una reserva (CDU-01).
     */
    incrementUsedClasses = (id) => {
        return this.dao.updateRaw(id, { $inc: { usedClassesThisMonth: 1 } });
    }

    /**
     * Decrementa el contador de clases del mes.
     * CDU-02: si el alumno cancela con antelación, recupera su crédito mensual.
     */
    decrementUsedClasses = (id) => {
        return this.dao.updateRaw(id, { $inc: { usedClassesThisMonth: -1 } });
    }

    /**
     * Proceso de limpieza mensual.
     * Se ejecuta el día 1 de cada mes.
     * Resetea los créditos de todos los alumnos activos cuyo currentPeriod
     * sea anterior al inicio del nuevo mes.
     */
    resetMonthlyCounters = (startOfNewPeriod) => {
        return this.dao.updateMany(
            {
                status: 'active',
                currentPeriod: { $lt: startOfNewPeriod }
            },
            {
                $set: {
                    usedClassesThisMonth: 0,
                    currentPeriod: startOfNewPeriod
                }
            }
        );
    }

    /**
     * Renueva el ciclo de la membresía tras un pago exitoso (CDU-03).
     * Regla de negocio: Nueva fecha = Fecha_Pago + 30 días.
     * Al renovar, el alumno comienza su ciclo con créditos limpios.
     */
    renewMembership = (id, newExpireDate) => {
        return this.dao.update(id, {
            status: 'active',
            expireDate: newExpireDate,
            usedClassesThisMonth: 0
        });
    }

    /**
     * Recupera membresías que ya pasaron su fecha de vencimiento
     * pero siguen marcadas como activas.
     * El cron diario las pasa a 'expired'.
     */
    findExpiredMemberships = (currentDate = new Date()) => {
        return this.dao.get({
            expireDate: { $lt: currentDate },
            status: 'active'
        });
    }

    /**
     * Filtra alumnos que vencen pronto (por defecto en 3 días)
     * para notificaciones segmentadas desde el Dashboard del Admin.
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