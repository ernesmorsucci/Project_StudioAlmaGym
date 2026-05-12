import { userService } from "../services/index.service.js";
import { createHash, isValidPassword } from "../utils/hash.js";
import jwt from "jsonwebtoken";
import EmailService from "../services/email.service.js"; // Importamos el servicio de mail

const emailService = new EmailService();
const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
    try {
        // Ignoramos 'rol' si lo mandan en el body
        const { name, email, password, phone, speciality } = req.body;

        const exists = await userService.findByEmail(email);
        if (exists) return res.status(400).json({ error: "El email ya está registrado" });

        const newUser = {
            name,
            email,
            password: await createHash(password),
            phone,
            rol: 'alumno', // 🛡️ FUERZA EL ROL: Siempre será alumno al registrarse por fuera
            speciality: speciality || []
        };

        const result = await userService.create(newUser);
        res.status(201).json({ message: "Usuario creado con éxito", payload: result });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userService.findByEmail(email);
        if (!user || !await isValidPassword(user, password)) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const tokenPayload = {
            _id: user._id,
            name: user.name,
            email: user.email,
            rol: user.rol
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        res.cookie('almaCookieToken', token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(200).json({ message: "Login exitoso", payload: tokenPayload });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

export const logout = (req, res) => {
    res.clearCookie('almaCookieToken');
    res.status(200).json({ message: "Sesión cerrada" });
};

export const getCurrentUser = (req, res) => {
    res.status(200).json({ payload: req.user });
};

// 1. Solicitar recuperación: Genera el código de 6 dígitos
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userService.getBy({ email: email });

        if (!user) {
            // Por seguridad, no confirmamos si el email existe o no
            return res.status(200).json({ status: "success", message: "Si el email está registrado, recibirás un código pronto." });
        }

        // Generar código aleatorio de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // Expira en 15 minutos

        // Guardar en la base de datos
        await userService.update(user._id, {
            resetCode: code,
            resetCodeExpires: expires
        });

        // Enviar por correo
        await emailService.sendRecoveryCode(email, code);

        res.status(200).json({ status: "success", message: "Código enviado al correo." });
    } catch (error) {
        console.error("Error en forgotPassword:", error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    }
};

// 2. Verificar código y cambiar contraseña
export const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        const user = await userService.getBy({ email: email });

        if (!user || user.resetCode !== code || new Date() > user.resetCodeExpires) {
            return res.status(400).json({ error: "El código es inválido o ha expirado." });
        }

        // Todo correcto: hashear nueva contraseña y limpiar campos de reset
        const hashedPassword = await createHash(newPassword);
        
        await userService.update(user._id, {
            password: hashedPassword,
            resetCode: null,
            resetCodeExpires: null
        });

        res.status(200).json({ status: "success", message: "Contraseña actualizada correctamente." });
    } catch (error) {
        console.error("Error en resetPassword:", error);
        res.status(500).json({ error: "Error al resetear la contraseña" });
    }
};