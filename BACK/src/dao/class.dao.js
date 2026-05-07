import BaseDao from "./base.dao.js";
import classModel from "./models/class.model.js";

export default class ClassDao extends BaseDao {
    constructor() { super(classModel); }
}