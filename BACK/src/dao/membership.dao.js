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

    updateRaw = (id, operators) => {
        return membershipModel.findByIdAndUpdate(id, operators, { new: true });
    }
    
    updateMany = (filter, operators) => {
        return membershipModel.updateMany(filter, operators);
    }
}