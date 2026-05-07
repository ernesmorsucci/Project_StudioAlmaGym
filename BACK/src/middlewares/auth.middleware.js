import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no definido en .env");
const JWT_SECRET = process.env.JWT_SECRET;

export const isAuthenticated = (req, res, next) => {
    const token = req.cookies.almaCookieToken;

    if (!token) {
        return res.status(401).json({ error: "Acceso denegado. No hay sesión iniciada." });
    }

    try {
        const decodedUser = jwt.verify(token, JWT_SECRET);
        req.user = decodedUser;
        next();
    } catch (error) {
        console.error("JWT inválido:", error.message);
        res.clearCookie('almaCookieToken');
        return res.status(401).json({ error: "Sesión inválida o expirada." });
    }
};

export const checkRole = (rolesAllowed) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Usuario no autenticado." });
        }
        if (!rolesAllowed.includes(req.user.rol)) {
            return res.status(403).json({ error: "Acceso denegado. No tienes permisos para esta acción." });
        }
        next();
    };
};