import { Router } from "express";
import { register, login, logout, getCurrentUser } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const authRouter = Router();

// Endpoint para registrar un usuario (AD-HDU-12)
authRouter.post("/register", register);

// Endpoint para iniciar sesión y recibir la cookie JWT (G-HDU-01)
authRouter.post("/login", login);

// Endpoint para cerrar sesión y destruir la cookie
authRouter.post("/logout", logout);

// Endpoint para que React valide si hay una sesión activa al recargar la página
authRouter.get("/current", isAuthenticated, getCurrentUser);

export default authRouter; 