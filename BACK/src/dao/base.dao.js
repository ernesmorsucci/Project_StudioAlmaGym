export default class BaseDao {
    constructor(model) {
        this.model = model;
    }

    get = (params = {}) => {
        return this.model.find(params);
    }

    getBy = (params) => {
        return this.model.findOne(params);
    }

    save = (doc) => {
        return this.model.create(doc);
    }

    update = (id, doc) => {
        return this.model.findByIdAndUpdate(id, { $set: doc }, { new: true });
    }

    delete = (id) => {
        return this.model.findByIdAndDelete(id);
    }

    updateRaw = (id, operators) => {
        return this.model.findByIdAndUpdate(id, operators, { new: true });
    }

    updateMany = (filter, operators) => {
        return this.model.updateMany(filter, operators);
    }
}