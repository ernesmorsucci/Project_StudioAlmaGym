import reserveModel from "./models/reserve.model.js";

export default class ReserveDao {

    get = (params = {}) => {
        return reserveModel.find(params);
    }

    getBy = (params) => {
        return reserveModel.findOne(params);
    }

    save = (doc) => {
        return reserveModel.create(doc);
    }

    update = (id, doc) => {
        return reserveModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
    }

    delete = (id) => {
        return reserveModel.findByIdAndDelete(id);
    }
}