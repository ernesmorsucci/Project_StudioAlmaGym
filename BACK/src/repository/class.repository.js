import GenericRepository from "./generic.repository.js";
import ClassDao from "../dao/class.dao.js";

const dao = new ClassDao();

export default class ClassRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    // Aumentar cupos ocupados (Reservas)
    incrementOccupiedQuota = (id, value = 1) => {
        return this.dao.updateRaw(id, { $inc: { occupiedQuota: value } });
    }

    // Disminuir cupos ocupados (Cancelaciones)
    decrementOccupiedQuota = (id, value = 1) => {
        return this.dao.updateRaw(id, { $inc: { occupiedQuota: -value } });
    }

    // Obtener todas las clases en un rango de fechas (Para el Admin: Clases del día/mes)
    getClassesByDateRange = (startDate, endDate) => {
        return this.dao.get({
            dateTime: {
                $gte: startDate,
                $lte: endDate
            },
            isActive: true
        });
    }

    // Obtener clases de un profesor específico en un rango (Para el Profesor: Mi agenda / Mis horas)
    getClassesByProfessor = (professorId, startDate, endDate) => {
        return this.dao.get({
            professorId: professorId,
            dateTime: {
                $gte: startDate,
                $lte: endDate
            },
            isActive: true
        });
    }
}