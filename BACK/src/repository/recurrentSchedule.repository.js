import GenericRepository from "./generic.repository.js";
import RecurrentScheduleDao from "../dao/recurrentSchedule.dao.js"; // Ruta corregida

const dao = new RecurrentScheduleDao();

export default class RecurrentScheduleRepository extends GenericRepository {
    constructor() {
        super(dao);
    }
    // Sobrescribimos el getAll genérico para traer el nombre del profe
    getAll = () => {
        return this.dao.model.find().populate('professorId', 'name');
    }
    /**
     * CDU-06: Obtiene todas las plantillas de horarios activas.
     * El sistema leerá esto para generar automáticamente las clases en la DB.
     */
    getActiveSchedules = () => {
        return this.dao.get({ isActive: true });
    }

    /**
     * Obtiene las plantillas asignadas a un profesor específico.
     */
    getSchedulesByProfessor = (professorId) => {
        return this.dao.get({ 
            professorId: professorId, 
            isActive: true 
        });
    }
}