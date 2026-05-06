import GenericRepository from "./generic.repository.js";
import MembershipDao from "../daos/membership_dao.js";

const dao = new MembershipDao();

export default class MembershipRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    incrementUsedClasses = (id) => {
        return this.dao.updateRaw(id, { $inc: { usedClassesThisWeek: 1 } });
    }

    resetWeeklyCounters = (startOfNewWeek) => {
        return this.dao.updateMany(
            {
                status: 'active',
                currentWeek: { $lt: startOfNewWeek }
            },
            {
                $set: {
                    usedClassesThisWeek: 0,
                    currentWeek: startOfNewWeek
                }
            }
        );
    }
}