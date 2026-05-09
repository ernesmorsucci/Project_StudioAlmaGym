import PlanRepository from "../repository/plan.repository.js";
const planRepo = new PlanRepository();

export default class PlanService {
    getAll = () => planRepo.getAll();
    getBy = (params) => planRepo.getBy(params);
    create = (doc) => planRepo.create(doc);
    update = (id, doc) => planRepo.update(id, doc);
    delete = (id) => planRepo.delete(id);

    // Métodos específicos
    getActivePlans = () => planRepo.getActivePlans();
}