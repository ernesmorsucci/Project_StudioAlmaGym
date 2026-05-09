import ClassRepository from "../repository/class.repository.js";
const classRepo = new ClassRepository();

export default class ClassService {
    getAll = () => classRepo.getAll();
    getBy = (params) => classRepo.getBy(params);
    create = (doc) => classRepo.create(doc);
    update = (id, doc) => classRepo.update(id, doc);
    delete = (id) => classRepo.delete(id);
    
    getClassesByDateRange = (startDate, endDate) => classRepo.getClassesByDateRange(startDate, endDate);
    getProfessorProductivity = (professorId, startDate, endDate) => classRepo.getProfessorProductivity(professorId, startDate, endDate);
    
    // NUEVOS MÉTODOS PARA EL GENERADOR Y ESCUDO:
    getFutureClassesBySchedule = (scheduleId) => classRepo.getFutureClassesBySchedule(scheduleId);
    updateFutureClasses = (scheduleId, updateData) => classRepo.updateFutureClasses(scheduleId, updateData);
}