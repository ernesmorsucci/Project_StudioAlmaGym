import { userService, membershipService, planService } from '../services/index.service.js';
import { createHash } from '../utils/hash.js'; // <-- ¡NUEVO! Importamos la función para encriptar
import EmailService from '../services/email.service.js';

const emailService = new EmailService();

const sanitizeUser = (user) => {
    // Si viene de Mongoose, los datos reales están en user._doc, si es un objeto JS normal, usamos user
    const userData = user._doc || user; 
    
    // Extraemos la "basura tóxica" y guardamos el resto en 'safeUser'
    const { 
        password, 
        resetCode, 
        resetCodeExpires, 
        updateCode, 
        updateCodeExpires, 
        phoneVerificationCode, 
        phoneVerificationExpires, 
        ...safeUser 
    } = userData;
    
    return safeUser;
};


//crear alumno con membresia (usado en el dashboard de admin)
export const createStudentWithMembership = async (req, res) => {
    try {
        const { name, email, password, planId, startDate } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ status: 'error', error: 'Faltan datos obligatorios del usuario.' });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ status: 'error', error: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.' });
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
        // 🛡️ LISTA BLANCA: Solo sacamos lo que nos interesa para un nuevo usuario manual (Profesora/Admin)
        const { name, email, password, phone, rol, speciality } = req.body;

        if (!name || !email) {
            return res.status(400).json({ status: 'error', error: 'El nombre y el correo son obligatorios.' });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
        if (password && !passwordRegex.test(password)) {
            return res.status(400).json({ status: 'error', error: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.' });
        }

        // Armamos el objeto limpio
        const cleanUserData = {
            name,
            email,
            rol: rol || 'alumno', // Aquí sí permitimos que el Admin elija el rol
        };

        if (phone) cleanUserData.phone = phone;
        if (speciality) cleanUserData.speciality = speciality;
        
        if (password) {
            cleanUserData.password = await createHash(password);
        }

        // Lo mandamos a la base de datos sin basura inyectada
        const result = await userService.create(cleanUserData);
        res.status(201).json({ status: 'success', payload: result });
    } catch (error) {
        // 🔥 EL TRADUCTOR DE ERRORES DE MONGODB
        if (error.message.includes('E11000')) {
            return res.status(400).json({ status: 'error', error: 'Ya existe un usuario con este correo electrónico.' });
        }
        res.status(400).json({ status: 'error', error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        // 🛡️ EL CANDADO: Lista Blanca (Whitelisting)
        // Extraemos explícitamente SOLO los campos que un usuario tiene permitido tocar
        const { name, phone, password } = req.body;

        // Armamos un objeto limpio desde cero
        const cleanUpdateData = {};

        // Validamos e insertamos solo si existen
        if (name) cleanUpdateData.name = name;

        if (phone) {
            cleanUpdateData.phone = phone;
            cleanUpdateData.isPhoneVerified = false; // Se cambia el número, se pierde la verificación
        }

        if (password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({ status: 'error', error: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.' });
            }
            cleanUpdateData.password = await createHash(password);
        }

        // 👑 EXCEPCIÓN PARA ADMINS (Solo si tu panel de admin usa esta misma ruta para editar usuarios)
        // Si tienes el middleware de JWT, 'req.user' debería existir. Verificamos que sea Dios.
        if (req.user && (req.user.rol === 'admin' || req.user.role === 'admin')) {
            if (req.body.rol) cleanUpdateData.rol = req.body.rol;
            if (req.body.role) cleanUpdateData.rol = req.body.role; 
            if (req.body.speciality) cleanUpdateData.speciality = req.body.speciality;
        }

        // Mandamos a guardar nuestro objeto limpio, ignorando por completo cualquier otra cosa (como { rol: 'admin' } enviado por un alumno)
        const result = await userService.update(req.params.uid, cleanUpdateData);
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
        // 🛡️ APLICAMOS EL FILTRO A LA LISTA
        const safeProfessors = professors.map(sanitizeUser);
        res.json({ status: 'success', payload: safeProfessors });
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
        // 🛡️ APLICAMOS EL FILTRO A LA LISTA
        const safeProfessors = professors.map(sanitizeUser);
        res.json({ status: 'success', payload: safeProfessors });
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
        const userId = req.user._id || req.user.id; 

        // 1. Buscamos al usuario real
        const user = await userService.getById(userId);
        
        // 2. 🛡️ BLOQUEO DE SEGURIDAD: No puede cambiar contraseña si su email no está verificado
        if (changingPassword && user.isEmailVerified === false) {
            return res.status(403).json({ 
                status: 'error', 
                error: 'Debes verificar tu email principal antes de poder cambiar tu contraseña.' 
            });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000); 

        console.log(`\n[2FA] Generando código ${code} para el usuario ${userId}`);

        // 3. Guardamos el código (usando los nombres correctos del modelo)
        await userService.update(userId, {
            updateCode: code,
            updateCodeExpires: expires
        });

        // 4. Enviamos al correo. Si cambia email, va al nuevo; si cambia pass, va al actual.
        const targetEmail = newEmail ? newEmail : user.email;
        const sent = await emailService.sendRecoveryCode(targetEmail, code);
        if (!sent) {
            return res.status(500).json({
                status: 'error',
                error: 'No se pudo enviar el código por correo. Revisa la configuración de email del servidor.'
            });
        }

        res.status(200).json({ status: 'success', message: 'Código de seguridad enviado.' });
    } catch (error) {
        console.error("Error en requestUpdateCode:", error);
        res.status(500).json({ status: 'error', error: 'Error al generar el código de seguridad.' });
    }
};

export const verifyUpdate = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { code, updates } = req.body;

        // 1. Buscamos por la vía correcta (Capa de Servicios)
        const user = await userService.getById(userId);

        console.log("🔍 1. Petición de verificación recibida. Updates:", updates);

        if (!user) return res.status(404).json({ status: "error", error: "Usuario no encontrado" });

        // Validaciones de seguridad
        if (user.updateCode !== code) return res.status(400).json({ status: "error", error: "Código incorrecto" });
        if (new Date() > user.updateCodeExpires) return res.status(400).json({ status: "error", error: "Código expirado" });

        // 2. Armamos un objeto LIMPIO exclusivo para actualizar
        const dataToUpdate = { ...updates };

        if (updates.email) {
            dataToUpdate.isEmailVerified = true;
        }

        if (updates.phone) {
            dataToUpdate.isPhoneVerified = true; 
        }

        if (updates.password) {
            // 🔥 NUEVA VALIDACIÓN
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
            if (!passwordRegex.test(updates.password)) {
                return res.status(400).json({ status: "error", error: "La nueva contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número." });
            }
            dataToUpdate.password = await createHash(updates.password);
        }

        // Limpiamos códigos
        dataToUpdate.updateCode = null;
        dataToUpdate.updateCodeExpires = null;

        console.log("🔍 2. Objeto dataToUpdate que se enviará a MongoDB:", dataToUpdate);
        // 3. Enviamos el paquete completo a la capa de Servicios (Buenas prácticas intactas)
        await userService.update(userId, dataToUpdate);

        // 4. Volvemos a pedir el usuario para obtener los datos 100% frescos de la DB
        const freshUser = await userService.getById(userId); 
        
        console.log("🔍 3. Usuario fresco desde la DB. ¿Se guardó el isEmailVerified?:", freshUser.isEmailVerified);

        // 5. Se lo mandamos a React
        res.status(200).json({ status: "success", payload: freshUser });
    } catch (error) {
        console.error("Error en verifyUpdate:", error);
        res.status(500).json({ status: "error", error: error.message });
    }
};

// 🔥 1. Enviar el código (Simulado)
export const sendPhoneCode = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { phone } = req.body;
        
        if (!phone) return res.status(400).json({ status: "error", error: "El teléfono es requerido" });

        // Generamos un código de 6 dígitos al azar
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Le damos 15 minutos de vida al código
        const expires = new Date(Date.now() + 15 * 60000); 

        // Guardamos el número y el código en la base de datos
        await userService.update(userId, { 
            phone: phone, 
            phoneVerificationCode: code, 
            phoneVerificationExpires: expires 
        });

        // 📱 LA SIMULACIÓN: Imprimimos el SMS en tu consola de VS Code
        console.log(`\n========================================`);
        console.log(`📱 SMS SIMULADO PARA: ${phone}`);
        console.log(`🔑 CÓDIGO DE VERIFICACIÓN DE STUDIO ALMA: ${code}`);
        console.log(`========================================\n`);

        res.status(200).json({ status: "success", message: "Código enviado" });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
};

// 🔥 2. Verificar si la alumna escribió el código correcto
export const verifyPhoneCode = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { code } = req.body;

        const user = await userService.getById(userId);

        if (!user.phoneVerificationCode) return res.status(400).json({ status: "error", error: "No se solicitó ningún código" });
        if (user.phoneVerificationCode !== code) return res.status(400).json({ status: "error", error: "Código incorrecto" });
        if (new Date() > user.phoneVerificationExpires) return res.status(400).json({ status: "error", error: "El código ha expirado" });

        // Si todo está bien, verificamos a la alumna y borramos el código secreto
        user.isPhoneVerified = true;
        user.phoneVerificationCode = null;
        user.phoneVerificationExpires = null;
        await user.save();

        res.status(200).json({ status: "success", message: "Teléfono verificado correctamente" });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
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
    verifyUpdate,
    sendPhoneCode,
    verifyPhoneCode
};
