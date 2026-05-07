import GenericRepository from "./generic.repository.js";
import UsersDao from "../dao/users.dao.js"; // Ruta corregida

const dao = new UsersDao();

export default class UsersRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    /**
     * AD-HDU-11: Obtener usuarios según su rol ('alumno', 'profesor', 'admin').
     * Nota: En tu modelo el campo se llama 'rol' (no 'role').
     */
    findByRole = (rolName) => {
        return this.dao.get({ rol: rolName });
    }

    /**
     * G-HDU-01: Buscar usuario por email (Para el Login y validación de duplicados).
     */
    findByEmail = (email) => {
        return this.dao.getBy({ email: email.toLowerCase() });
    }
}