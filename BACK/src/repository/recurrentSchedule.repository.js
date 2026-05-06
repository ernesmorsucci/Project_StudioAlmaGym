import GenericRepository from "./generic.repository.js";
import RecurrentScheduleDao from "../daos/recurrentSchedule_dao.js";

const dao = new RecurrentScheduleDao();

export default class RecurrentScheduleRepository extends GenericRepository {
    constructor() {
        super(dao);
    }
}