import GenericRepository from "./generic.repository.js";
import ReserveDao from "../dao/reserve.dao.js";

const dao = new ReserveDao();

export default class ReserveRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    findUserReservations = (studentId, status = null) => {
        const query = { studentId };
        if (status) query.status = status;
        
        // Hacemos un "Deep Populate" para traer la Clase y, dentro de la clase, el Nombre del Profesor
        return this.dao.model.find(query)
            .populate({
                path: 'classId',
                populate: { path: 'professorId', select: 'name' }
            })
            .sort({ createdAt: -1 }); // Ordenamos para que salgan las más recientes primero
    }

    // Modificado: Ahora trae los datos del alumno (nombre, email) para la lista de asistencia
    findByClass = (classId) => {
        return this.dao.model.find({ classId }).populate('studentId', 'name email phone');
    }

    // NUEVO: Cuenta las inasistencias en un periodo para la política de recuperación
    countAbsencesInPeriod = async (studentId, periodStartDate) => {
        const absences = await this.dao.get({
            studentId: studentId,
            assistance: 'absent',
            createdAt: { $gte: periodStartDate }
        });
        return absences.length;
    }

    markAttendance = (id, assistanceStatus) => {
        return this.dao.updateRaw(id, { $set: { assistance: assistanceStatus } });
    }

    getNextInWaitingList = (classId) => {
        return this.dao.getBy({ classId: classId, status: 'pending', waitingPosition: 1 });
    }

    confirmWaitingReservation = (id) => {
        return this.dao.updateRaw(id, { $set: { status: 'confirmed', waitingPosition: 0 } });
    }

    shiftWaitingList = (classId, fromPosition = 0) => {
        return this.dao.updateMany(
            { classId: classId, status: 'pending', waitingPosition: { $gt: fromPosition } },
            { $inc: { waitingPosition: -1 } }
        );
    }
}