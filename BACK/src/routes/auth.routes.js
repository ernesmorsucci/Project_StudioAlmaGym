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
import rateLimit from 'express-rate-limit';


const authRouter = Router();

// 2. 🛡️ CONFIGURAMOS EL ESCUDO
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Tiempo de castigo: 15 minutos
    max: 5, // Límite estricto: Solo 5 intentos permitidos por cada IP
    message: { 
        status: "error", 
        error: "Demasiados intentos fallidos. Por seguridad, tu cuenta ha sido bloqueada temporalmente. Intenta en 15 minutos." 
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

authRouter.post("/register", register);
authRouter.post('/login', loginLimiter, login);
authRouter.post("/logout", logout);
authRouter.get("/current", isAuthenticated, getCurrentUser);

// NUEVAS RUTAS DE RECUPERACIÓN:
authRouter.post("/forgot-password", loginLimiter, forgotPassword); // Paso 1: Enviar email
authRouter.post("/reset-password", resetPassword);   // Paso 2: Verificar código y cambiar

export default authRouter;