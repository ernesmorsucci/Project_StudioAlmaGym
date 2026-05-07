import BaseDao from "./base.dao.js";
import planModel from "./models/plan.model.js";

export default class PlanDao extends BaseDao {
    constructor() { super(planModel); }
}