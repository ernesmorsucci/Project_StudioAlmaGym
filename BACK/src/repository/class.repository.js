import GenericRepository from "./generic.repository.js";
import ClassDao from "../dao/class.dao.js";
import mongoose from "mongoose";

const dao = new ClassDao();

export default class ClassRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    incrementOccupiedQuota = (id, value = 1) => this.dao.updateRaw(id, { $inc: { occupiedQuota: value } });
    decrementOccupiedQuota = (id, value = 1) => this.dao.updateRaw(id, { $inc: { occupiedQuota: -value } });
    
    getClassesByDateRange = (startDate, endDate) => {
        return this.dao.get({ dateTime: { $gte: startDate, $lte: endDate }, isActive: true });
    }

    getClassesByProfessor = (professorId, startDate, endDate) => {
        return this.dao.get({ professorId, dateTime: { $gte: startDate, $lte: endDate }, isActive: true });
    }

    /**
     * P-HDU-02: Reporte de Productividad
     * Agrupa las clases por tipo (Reformer/Mat) y suma las horas trabajadas.
     * (Asumiendo que cada clase dura 1 hora = 60 min).
     */
    getProfessorProductivity = async (professorId, startDate, endDate) => {
        return await this.dao.model.aggregate([
            {
                $match: {
                    professorId: new mongoose.Types.ObjectId(professorId),
                    dateTime: { $gte: startDate, $lte: endDate },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: "$classType", // Agrupa por 'Reformer' o 'Mat'
                    totalClasses: { $sum: 1 },
                    totalHoursWorked: { $sum: 1 } // 1 clase = 1 hora
                }
            }
        ]);
    }

    // Busca las clases futuras generadas a partir de una plantilla específica
    getFutureClassesBySchedule = (scheduleId, fromDate = new Date()) => {
        return this.dao.get({
            recurrentScheduleId: scheduleId,
            dateTime: { $gte: fromDate }
        });
    }

    // Actualiza múltiples clases futuras (Opción: Aplicar cambios a las clases ya generadas)
    updateFutureClasses = (scheduleId, updateData, fromDate = new Date()) => {
        return this.dao.updateMany(
            { recurrentScheduleId: scheduleId, dateTime: { $gte: fromDate } },
            { $set: updateData }
        );
    }
}