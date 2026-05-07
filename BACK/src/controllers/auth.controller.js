import UsersRepository from "../repository/users.repository.js";
import { createHash, isValidPassword } from "../utils/hash.js";
import jwt from "jsonwebtoken";

const usersRepository = new UsersRepository();

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no definido en .env");
const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
    try {
        const { name, email, password, phone, rol, speciality } = req.body;

        const exists = await usersRepository.findByEmail(email);
        if (exists) return res.status(400).json({ error: "El email ya está registrado" });

        const newUser = {
            name,
            email,
            password: await createHash(password),
            phone,
            rol: rol || 'alumno',
            speciality: speciality || []
        };

        const result = await usersRepository.create(newUser);
        res.status(201).json({ message: "Usuario creado con éxito", payload: result });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await usersRepository.findByEmail(email);
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