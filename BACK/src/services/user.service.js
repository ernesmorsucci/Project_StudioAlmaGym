import UsersRepository from "../repository/users.repository.js";
const userRepo = new UsersRepository();

export default class UserService {
    getAll = () => userRepo.getAll();
    getBy = (params) => userRepo.getBy(params);
    create = (doc) => userRepo.create(doc);
    update = (id, doc) => userRepo.update(id, doc);
    delete = (id) => userRepo.delete(id);

    // Métodos específicos
    findByEmail = (email) => userRepo.findByEmail(email);
    findByRole = (role) => userRepo.findByRole(role);
}