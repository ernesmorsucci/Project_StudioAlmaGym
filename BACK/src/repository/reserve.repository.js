import GenericRepository from "./generic.repository.js";
import ReserveDao from "../dao/reserve.dao.js"; // Ruta corregida

const dao = new ReserveDao();

export default class ReserveRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    /**
     * A-HDU-04: Obtener todas las reservas de un alumno.
     * Permite filtrar opcionalmente por estado ('confirmed', 'pending', 'canceled').
     */
    findUserReservations = (studentId, status = null) => {
        const query = { studentId };
        if (status) query.status = status;
        return this.dao.get(query);
    }

    /**
     * P-HDU-01: Obtener todos los inscriptos de una clase.
     * El controlador lo usará para mostrarle la lista a la profesora.
     */
    findByClass = (classId) => {
        return this.dao.get({ classId });
    }

    /**
     * CDU-09: Pasar lista.
     * Cambia la asistencia a 'assisted' o 'absent'.
     */
    markAttendance = (id, assistanceStatus) => {
        return this.dao.updateRaw(id, {
            $set: { assistance: assistanceStatus }
        });
    }

    /**
     * CDU-04 (LISTA DE ESPERA): Obtiene al primer alumno en la cola de espera.
     * Se dispara cuando alguien cancela y libera un cupo.
     */
    getNextInWaitingList = (classId) => {
        return this.dao.getBy({
            classId: classId,
            status: 'pending',
            waitingPosition: 1
        });
    }

    /**
     * CDU-04 (LISTA DE ESPERA): Confirma a un alumno que estaba esperando.
     * Lo pasa a 'confirmed' y le quita su número de fila.
     */
    confirmWaitingReservation = (id) => {
        return this.dao.updateRaw(id, {
            $set: { 
                status: 'confirmed',
                waitingPosition: 0 
            }
        });
    }

    /**
     * CDU-04 (LISTA DE ESPERA): Adelanta la fila.
     * Si el de la posición 1 entra a la clase (o si el de la posición 3 se da de baja),
     * todos los que estaban atrás de él restan -1 a su posición.
     */
    shiftWaitingList = (classId, fromPosition = 0) => {
        return this.dao.updateMany(
            { 
                classId: classId, 
                status: 'pending',
                waitingPosition: { $gt: fromPosition } 
            },
            { 
                $inc: { waitingPosition: -1 } 
            }
        );
    }
}