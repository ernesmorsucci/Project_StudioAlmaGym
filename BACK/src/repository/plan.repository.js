import GenericRepository from "./generic.repository.js";
import PlanDao from "../daos/plan_dao.js";

const dao = new PlanDao();

export default class PlanRepository extends GenericRepository {
    constructor() {
        super(dao);
    }
}