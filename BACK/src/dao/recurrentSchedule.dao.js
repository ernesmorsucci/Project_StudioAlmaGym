import BaseDao from "./base.dao.js";
import recurrentScheduleModel from "./models/recurrentSchedule.model.js";

export default class RecurrentScheduleDao extends BaseDao {
    constructor() { super(recurrentScheduleModel); }
}