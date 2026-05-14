import { userService, membershipService, planService } from '../services/index.service.js';
import { createHash } from '../utils/hash.js'; // <-- ¡NUEVO! Importamos la función para encriptar
import EmailService from '../services/email.service.js';

const emailService = new EmailService();
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
// ==========================================
// SEGURIDAD: VERIFICACIÓN 2FA PARA PERFIL
// ==========================================
export const requestUpdateCode = async (req, res) => {
    try {
        const { newEmail, changingPassword } = req.body;
        // Protección extra por si el token usa .id en lugar de ._id
        const userId = req.user._id || req.user.id; 

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000); 

        // 🕵️‍♂️ DEBUG: Confirmar que estamos guardando el código
        console.log(`\n[2FA] Generando código ${code} para el usuario ${userId}`);

        await userService.update(userId, {
            resetCode: code,
            resetCodeExpires: expires
        });

        const targetEmail = newEmail ? newEmail : req.user.email;
        await emailService.sendRecoveryCode(targetEmail, code);

        res.status(200).json({ status: 'success', message: 'Código de verificación enviado.' });
    } catch (error) {
        console.error("Error en requestUpdateCode:", error);
        res.status(500).json({ status: 'error', error: 'Error al generar el código de seguridad.' });
    }
};

export const verifyUpdate = async (req, res) => {
    try {
        const { code, updates } = req.body;
        const userId = req.user._id || req.user.id;

        const user = await userService.getById(userId);
        const cleanCode = code ? code.toString().trim() : '';

        // 1. Validaciones de seguridad
        if (!user || !user.resetCode) {
            return res.status(400).json({ status: 'error', error: 'No hay ningún código pendiente para este usuario.' });
        }

        if (user.resetCode !== cleanCode) {
            return res.status(400).json({ status: 'error', error: 'El código ingresado es incorrecto.' });
        }

        // Comparamos el tiempo exacto en milisegundos para evitar fallos de zona horaria
        const now = new Date().getTime();
        const expires = new Date(user.resetCodeExpires).getTime();
        if (now > expires) {
            return res.status(400).json({ status: 'error', error: 'El código ha expirado. Solicita uno nuevo.' });
        }

        // 2. Preparación de los datos a guardar
        const finalUpdates = { ...updates, resetCode: null, resetCodeExpires: null };

        if (finalUpdates.password && finalUpdates.password.trim() !== '') {
            finalUpdates.password = await createHash(finalUpdates.password);
        } else {
            delete finalUpdates.password; // Evita guardar contraseñas vacías
        }

        // 🔥 LA SOLUCIÓN: Limpiamos cualquier campo "undefined" que el frontend haya enviado 
        // y que esté haciendo explotar a Mongoose en silencio.
        Object.keys(finalUpdates).forEach(key => {
            if (finalUpdates[key] === undefined) {
                delete finalUpdates[key];
            }
        });

        // 3. Guardado en Base de Datos
        const updatedUser = await userService.update(userId, finalUpdates);

        // Si el DAO no devuelve el usuario actualizado, lanzamos un error claro
        if (!updatedUser) {
            throw new Error("No se pudo actualizar el documento en MongoDB.");
        }

        const safeUser = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
        delete safeUser.password;

        res.status(200).json({ status: 'success', payload: safeUser });
    } catch (error) {
        console.error("❌ Error en verifyUpdate:", error);
        // 🔥 Ahora obligamos al servidor a mandar el error EXACTO al frontend
        res.status(400).json({ status: 'error', error: `Fallo interno: ${error.message}` });
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
    getProfessors,
    requestUpdateCode,
    verifyUpdate
};