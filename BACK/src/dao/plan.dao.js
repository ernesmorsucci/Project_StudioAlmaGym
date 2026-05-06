import planModel from "./models/plan.model.js";

export default class PlanDao {
    get = (params = {}) => {
        return planModel.find(params);
    }

    getBy = (params) => {
        return planModel.findOne(params);
    }

    save = (doc) => {
        return planModel.create(doc);
    }

    update = (id, doc) => {
        return planModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
    }
    
    delete = (id) => {
        return planModel.findByIdAndDelete(id);
    }
}