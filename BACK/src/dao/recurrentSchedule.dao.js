import recurrentScheduleModel from "./models/recurrentSchedule.model.js";

export default class RecurrentScheduleDao {
    get = (params = {}) => {
        return recurrentScheduleModel.find(params);
    }

    getBy = (params) => {
        return recurrentScheduleModel.findOne(params);
    }

    save = (doc) => {
        return recurrentScheduleModel.create(doc);
    }

    update = (id, doc) => {
        return recurrentScheduleModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
    }
    
    delete = (id) => {
        return recurrentScheduleModel.findByIdAndDelete(id);
    }
}