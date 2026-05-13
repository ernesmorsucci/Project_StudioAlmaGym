import { userService, membershipService, planService } from '../services/index.service.js';
import { createHash } from '../utils/hash.js'; // <-- ¡NUEVO! Importamos la función para encriptar

//crear alumno con membresia (usado en el dashboard de admin)
export const createStudentWithMembership = async (req, res) => {
    try {
        const { name, email, password, planId, startDate } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ status: 'error', error: 'Faltan datos obligatorios del usuario.' });
        }

        const hashedPassword = await createHash(password);

        const newUser = await userService.create({
            name,
            email,
            password: hashedPassword,
            rol: 'alumno'
        });

        if (planId && startDate) {
            try {
                const plan = await planService.getBy({ _id: planId });
                
                if (plan) {
                    const start = new Date(startDate);
                    const expiration = new Date(start);
                    expiration.setMonth(expiration.getMonth() + 1);

                    await membershipService.create({
                        studentId: newUser._id,
                        planId: plan._id,
                        startDate: start,            
                        currentPeriod: start,        
                        expireDate: expiration,      
                        usedClassesThisMonth: 0,     
                        status: 'active'             
                    });
                }
            } catch (membershipError) {
                await userService.delete(newUser._id);
                throw new Error(`Error al asignar el plan: ${membershipError.message}. Se canceló la creación del usuario.`);
            }
        }

        res.status(201).json({ 
            status: 'success', 
            message: planId ? 'Alumno y membresía registrados con éxito.' : 'Alumno registrado sin plan activo.'
        });

    } catch (error) {
        console.error("Error al crear alumno con membresía:", error.message);
        if (error.message.includes('E11000')) {
            return res.status(400).json({ status: 'error', error: 'Ya existe un usuario con ese correo electrónico.' });
        }
        res.status(400).json({ status: 'error', error: error.message });
    }
};
// ==========================================
// DASHBOARD DE ALUMNOS (ADMIN)
// ==========================================
export const getStudentsDashboard = async (req, res) => {
    try {
        const data = await userService.getStudentsWithMembershipData();
        res.json({ status: 'success', payload: data });
    } catch (error) {
        console.error("Error en getStudentsDashboard:", error);
        res.status(500).json({ status: 'error', error: 'Error al obtener el listado de alumnos.' });
    }
};

// ==========================================
// CONTROLADORES EXISTENTES
// ==========================================
export const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAll();
        res.json({ status: 'success', payload: users });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await userService.getById(req.params.uid);
        if (!user) return res.status(404).json({ status: 'error', error: 'Usuario no encontrado' });
        res.json({ status: 'success', payload: user });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const addUser = async (req, res) => {
    try {
        const userData = { ...req.body };
        if (userData.password) {
            userData.password = await createHash(userData.password);
        }

        const result = await userService.create(userData);
        res.status(201).json({ status: 'success', payload: result });
    } catch (error) {
        res.status(400).json({ status: 'error', error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.password) {
            updateData.password = await createHash(updateData.password);
        } else {
            delete updateData.password;
        }

        const result = await userService.update(req.params.uid, updateData);
        res.json({ status: 'success', payload: result });
    } catch (error) {
        res.status(400).json({ status: 'error', error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await userService.delete(req.params.uid);
        res.json({ status: 'success', message: 'Usuario eliminado' });
    } catch (error) {
        res.status(400).json({ status: 'error', error: error.message });
    }
};

export const getByEmail = async (req, res) => {
    try {
        const user = await userService.getBy({ email: req.params.email });
        res.json({ status: 'success', payload: user });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const getAllByRole = async (req, res) => {
    try {
        const users = await userService.getAll({ rol: req.params.rol });
        res.json({ status: 'success', payload: users });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const getProfessorsDirectory = async (req, res) => {
    try {
        const professors = await userService.getAll({ rol: 'profesor' });
        res.json({ status: 'success', payload: professors });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const getStudentsDirectory = async (req, res) => {
    try {
        const students = await userService.getAll({ rol: 'alumno' });
        res.json({ status: 'success', payload: students });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const getProfessors = async (req, res) => {
    try {
        const professors = await userService.getAll({ 
            rol: { $in: ['profesor', 'admin'] } 
        });
        res.json({ status: 'success', payload: professors });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export default {
    createStudentWithMembership,
    getStudentsDashboard,
    getAllUsers,
    getUser,
    addUser,
    updateUser,
    deleteUser,
    getByEmail,
    getAllByRole,
    getProfessorsDirectory,
    getStudentsDirectory,
    getProfessors
};