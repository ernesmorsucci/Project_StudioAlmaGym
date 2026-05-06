import userModel from "./models/users.model.js";

export default class UsersDao {

    get = (params = {}, populate = '') => {
        return userModel.find(params).populate(populate);
    }

    getBy = (params, populate = '') => {
        return userModel.findOne(params).populate(populate);
    }

    save = (doc) => {
        return userModel.create(doc);
    }

    update = (id, doc) => {
        return userModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
    }

    delete = (id) => {
        return userModel.findByIdAndDelete(id);
    }
}