import GenericRepository from "./generic.repository.js";
import ClassDao from "../daos/class_dao.js";

const dao = new ClassDao();

export default class ClassRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    incrementOccupiedQuota = (id, value) => {
        return this.dao.updateRaw(id, { $inc: { occupiedQuota: value } });
    }
}