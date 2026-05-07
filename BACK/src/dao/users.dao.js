import BaseDao from "./base.dao.js";
import userModel from "./models/users.model.js";

export default class UsersDao extends BaseDao {
    constructor() { super(userModel); }
}