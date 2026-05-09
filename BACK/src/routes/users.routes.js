import { Router } from "express";
import { 
    getAllUsers, 
    getUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    getByEmail, 
    getAllByRole,
    getProfessorsDirectory, // Asegúrate de que esté importado
    getStudentsDirectory   // Añadimos este para la gestión de alumnos
} from "../controllers/users.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const usersRouter = Router();

// ==========================================
// RUTAS FIJAS (SIEMPRE ARRIBA DE /:uid)
// ==========================================
usersRouter.get("/directory/professors", isAuthenticated, checkRole(['admin']), getProfessorsDirectory);
usersRouter.get("/directory/students", isAuthenticated, checkRole(['profesor', 'admin']), getStudentsDirectory);

usersRouter.get("/", isAuthenticated, checkRole(['admin']), getAllUsers);
usersRouter.post("/", isAuthenticated, checkRole(['admin']), addUser);
usersRouter.get("/role/:rol", isAuthenticated, checkRole(['admin']), getAllByRole);
usersRouter.get("/email/:email", isAuthenticated, checkRole(['admin']), getByEmail);

// ==========================================
// RUTAS CON PARÁMETROS
// ==========================================
usersRouter.get("/:uid", isAuthenticated, getUser);
usersRouter.put("/:uid", isAuthenticated, updateUser);
usersRouter.delete("/:uid", isAuthenticated, checkRole(['admin']), deleteUser);

export default usersRouter;