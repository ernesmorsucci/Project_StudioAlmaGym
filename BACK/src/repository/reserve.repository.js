import GenericRepository from "./generic.repository.js";
import ReserveDao from "../daos/reserve_dao.js";

const dao = new ReserveDao();

export default class ReserveRepository extends GenericRepository {
    constructor() {
        super(dao);
    }
}