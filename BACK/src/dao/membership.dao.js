import BaseDao from "./base.dao.js";
import membershipModel from "./models/membership.model.js";

export default class MembershipDao extends BaseDao {
    constructor() { super(membershipModel); }
}