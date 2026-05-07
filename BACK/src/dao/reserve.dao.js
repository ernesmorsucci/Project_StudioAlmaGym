import BaseDao from "./base.dao.js";
import reserveModel from "./models/reserve.model.js";

export default class ReserveDao extends BaseDao {
    constructor() { super(reserveModel); }
}