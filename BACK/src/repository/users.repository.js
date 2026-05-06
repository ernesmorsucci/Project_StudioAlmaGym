import GenericRepository from "./generic.repository.js";
import UsersDao from "../daos/users_dao.js";

const dao = new UsersDao();

export default class UsersRepository extends GenericRepository {
    constructor() {
        super(dao);
    }
}