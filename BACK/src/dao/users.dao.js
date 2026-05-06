import userModel from "./models/users.model.js";

export default class UsersDao {
    get = (params = {}) => {
        return userModel.find(params);
    }

    getBy = (params) => {
        return userModel.findOne(params);
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