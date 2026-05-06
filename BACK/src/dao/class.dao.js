import classModel from "./models/class.model.js";

export default class ClassDao {
    
    get = (params = {}) => {
        return classModel.find(params);
    }

    getBy = (params) => {
        return classModel.findOne(params);
    }

    save = (doc) => {
        return classModel.create(doc);
    }

    update = (id, doc) => {
        return classModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
    }

    delete = (id) => {
        return classModel.findByIdAndDelete(id);
    }

    updateRaw = (id, operators) => {
        return classModel.findByIdAndUpdate(id, operators, { new: true });
    }
}