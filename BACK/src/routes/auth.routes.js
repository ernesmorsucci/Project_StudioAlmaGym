//
import { Router } from "express";
import { 
    register, 
    login, 
    logout, 
    getCurrentUser, 
    forgotPassword, 
    resetPassword 
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/current", isAuthenticated, getCurrentUser);

// NUEVAS RUTAS DE RECUPERACIÓN:
authRouter.post("/forgot-password", forgotPassword); // Paso 1: Enviar email
authRouter.post("/reset-password", resetPassword);   // Paso 2: Verificar código y cambiar

export default authRouter;