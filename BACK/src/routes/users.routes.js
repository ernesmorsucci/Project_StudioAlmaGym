import { Router } from "express";
import { 
    getAllUsers, 
    getUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    getByEmail, 
    getAllByRole,
    getProfessorsDirectory, 
    getStudentsDirectory,   
    getProfessors,
    getStudentsDashboard,
    createStudentWithMembership // <-- NUEVA IMPORTACIÓN
} from "../controllers/users.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const usersRouter = Router();

// ==========================================
// RUTAS FIJAS (SIEMPRE ARRIBA DE /:uid)
// ==========================================
usersRouter.get("/directory/professors", isAuthenticated, checkRole(['admin']), getProfessorsDirectory);
usersRouter.get("/directory/students", isAuthenticated, checkRole(['profesor', 'admin']), getStudentsDirectory);
usersRouter.get("/professors", isAuthenticated, checkRole(['admin']), getProfessors); 
usersRouter.get("/students-dashboard", isAuthenticated, checkRole(['admin']), getStudentsDashboard);

// 👇 NUESTRA NUEVA RUTA PARA CREAR ALUMNO + MEMBRESÍA 👇
usersRouter.post("/student-with-membership", isAuthenticated, checkRole(['admin']), createStudentWithMembership);

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