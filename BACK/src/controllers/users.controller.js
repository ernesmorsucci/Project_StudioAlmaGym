import { userService } from "../services/index.service.js";
import { createHash } from "../utils/hash.js";

// 1. Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAll();
        res.status(200).json({ status: 'success', payload: users });
    } catch (error) {
        console.error("Error en getAllUsers:", error);
        res.status(500).json({ status: 'error', error: 'Error al obtener usuarios' });
    }
};

// 2. Obtener un usuario por ID
export const getUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const user = await userService.getBy({ _id: uid });
        
        if (!user) return res.status(404).json({ status: 'error', error: 'Usuario no encontrado' });
        
        res.status(200).json({ status: 'success', payload: user });
    } catch (error) {
        console.error("Error en getUser:", error);
        res.status(500).json({ status: 'error', error: 'Error al obtener el usuario' });
    }
};

// 3. Agregar un usuario (Admin)
export const addUser = async (req, res) => {
    try {
        const { name, email, password, phone, rol, speciality } = req.body;
        
        const exists = await userService.findByEmail(email);
        if (exists) return res.status(400).json({ status: 'error', error: 'El usuario ya existe' });

        const hashedPassword = await createHash(password);
        
        const newUser = {
            name,
            email,
            password: hashedPassword,
            phone,
            rol: rol || 'alumno',
            speciality: speciality || []
        };

        const result = await userService.create(newUser);
        res.status(201).json({ status: 'success', payload: result });
    } catch (error) {
        console.error("Error en addUser:", error);
        res.status(500).json({ status: 'error', error: 'Error al crear el usuario' });
    }
};

// 4. Actualizar un usuario
export const updateUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const data = req.body;

        // Si se envía una nueva contraseña, hay que hashearla
        if (data.password) {
            data.password = await createHash(data.password);
        }

        const updatedUser = await userService.update(uid, data);
        if (!updatedUser) return res.status(404).json({ status: 'error', error: 'Usuario no encontrado' });

        res.status(200).json({ status: 'success', payload: updatedUser });
    } catch (error) {
        console.error("Error en updateUser:", error);
        res.status(500).json({ status: 'error', error: 'Error al actualizar el usuario' });
    }
};

// 5. Eliminar un usuario
export const deleteUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const result = await userService.delete(uid);
        
        if (!result) return res.status(404).json({ status: 'error', error: 'Usuario no encontrado' });

        res.status(200).json({ status: 'success', message: 'Usuario eliminado permanentemente' });
    } catch (error) {
        console.error("Error en deleteUser:", error);
        res.status(500).json({ status: 'error', error: 'Error al eliminar el usuario' });
    }
};

// 6. Buscar por Email
export const getByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await userService.findByEmail(email);
        
        if (!user) return res.status(404).json({ status: 'error', error: 'Email no encontrado' });

        res.status(200).json({ status: 'success', payload: user });
    } catch (error) {
        console.error("Error en getByEmail:", error);
        res.status(500).json({ status: 'error', error: 'Error al buscar por email' });
    }
};

// 7. Obtener todos por Rol (ej. traer todos los 'profesor')
export const getAllByRole = async (req, res) => {
    try {
        const { role } = req.params;
        // Importante: tu modelo usa el campo 'rol'
        const users = await userService.getAll({ rol: role });
        res.status(200).json({ status: 'success', payload: users });
    } catch (error) {
        console.error("Error en getAllByRole:", error);
        res.status(500).json({ status: 'error', error: 'Error al filtrar por rol' });
    }
};