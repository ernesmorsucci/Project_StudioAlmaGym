import { Router } from "express";
import { 
    getAllUsers, 
    getUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    getByEmail, 
    getAllByRole 
} from "../controllers/users.controller.js";
import { isAuthenticated, checkRole } from "../middlewares/auth.middleware.js";

const usersRouter = Router();

/**
 * RUTAS DE ADMINISTRACIÓN DE USUARIOS
 * Todas estas rutas requieren que el usuario esté logueado.
 */

// 1. Obtener la lista de todos los usuarios (Solo Admin)
router.get("/", isAuthenticated, checkRole(['admin']), getAllUsers);

// 2. Crear un usuario manualmente (Solo Admin)
router.post("/", isAuthenticated, checkRole(['admin']), addUser);

// 3. Obtener usuarios por rol (ej: /api/users/role/profesor) (Solo Admin)
router.get("/role/:role", isAuthenticated, checkRole(['admin']), getAllByRole);

// 4. Buscar usuario por email (Solo Admin)
router.get("/email/:email", isAuthenticated, checkRole(['admin']), getByEmail);

// 5. Obtener, Actualizar o Eliminar un usuario específico por ID
// Nota: Aquí el Admin tiene poder total, pero un alumno podría actualizar sus propios datos
router.get("/:uid", isAuthenticated, getUser);
router.put("/:uid", isAuthenticated, updateUser);
router.delete("/:uid", isAuthenticated, checkRole(['admin']), deleteUser);
///Revisar la confirmacion del Rol ya que un usuario Alumno podria cambiar su rol a admin 
export default usersRouter;