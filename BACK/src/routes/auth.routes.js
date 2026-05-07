import { Router } from "express";
import { register, login, logout, getCurrentUser } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

// Endpoint para registrar un usuario (AD-HDU-12)
router.post("/register", register);

// Endpoint para iniciar sesión y recibir la cookie JWT (G-HDU-01)
router.post("/login", login);

// Endpoint para cerrar sesión y destruir la cookie
router.post("/logout", logout);

// Endpoint para que React valide si hay una sesión activa al recargar la página
router.get("/current", isAuthenticated, getCurrentUser);

export default router;