import membershipModel from "./models/membership.model.js";

export default class MembershipDao {

    get = (params = {}) => {
        return membershipModel.find(params);
    }

    getBy = (params) => {
        return membershipModel.findOne(params);
    }

    save = (doc) => {
        return membershipModel.create(doc);
    }

    update = (id, doc) => {
        return membershipModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
    }

    delete = (id) => {
        return membershipModel.findByIdAndDelete(id);
    }

    incrementUsedClasses = (id) => {
        return membershipModel.findByIdAndUpdate(
            id,
            { $inc: { usedClassesThisWeek: 1 } },
            { new: true }
        );
    }

    resetWeeklyCounters = (startOfNewWeek) => {
        return membershipModel.updateMany(
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