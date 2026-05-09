import { userService } from "../services/index.service.js";
import { createHash } from "../utils/hash.js";
import { recurrentScheduleService, classService } from "../services/index.service.js";
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
        const requestingUser = req.user;

        // 🛡️ ESCUDO: Solo el admin o el propio dueño pueden ver todo el perfil
        if (requestingUser._id !== uid && requestingUser.rol !== 'admin') {
            return res.status(403).json({ status: 'error', error: 'Acceso denegado al perfil' });
        }

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

// 4. Actualizar un usuario (con escudo de seguridad)
export const updateUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const requestingUser = req.user; 
        
        const { rol, email, password, ...allowedUpdates } = req.body;

        // 🛡️ ESCUDO DE PRIVACIDAD
        if (requestingUser._id !== uid && requestingUser.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "No tienes permiso para modificar este perfil" });
        }

        let finalUpdates = { ...allowedUpdates };
        
        // Bloqueo de rol: solo un admin real puede ascender a alguien
        if (requestingUser.rol === 'admin' && rol) {
            finalUpdates.rol = rol;
        }

        // Email y password bloqueados en este endpoint (requieren flujo dedicado con verificación)
        if (email || password) {
            console.warn(`Intento de cambio de credenciales bloqueado para el usuario: ${uid}`);
        }

        const updatedUser = await userService.update(uid, finalUpdates);
        if (!updatedUser) return res.status(404).json({ status: "error", error: "Usuario no encontrado" });

        res.status(200).json({ status: "success", message: "Perfil actualizado", payload: updatedUser });
    } catch (error) {
        console.error("Error en updateUser:", error);
        res.status(500).json({ status: "error", error: "Error interno al actualizar" });
    }
};

// 5. Eliminar un usuario (borrado físico)
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

// 7. Obtener todos los usuarios por Rol (ej: /api/users/role/profesor)
// CORREGIDO: usa findByRole() del repositorio en vez de getAll() con filtro manual
export const getAllByRole = async (req, res) => {
    try {
        const { rol } = req.params;

        const rolesValidos = ['alumno', 'profesor', 'admin'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({ status: 'error', error: `Rol inválido. Los valores posibles son: ${rolesValidos.join(', ')}` });
        }

        const users = await userService.findByRole(rol);
        
        res.status(200).json({ status: 'success', payload: users });
    } catch (error) {
        console.error("Error en getAllByRole:", error);
        res.status(500).json({ status: 'error', error: 'Error al filtrar por rol' });
    }

    
};

export const getProfessorsDirectory = async (req, res) => {
    try {
        const professors = await userService.findByRole('profesor');
        
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);
        const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

        const directory = await Promise.all(professors.map(async (prof) => {
            // 1. Buscar sus plantillas para armar el texto "Lun/Mié/Vie 08:00"
            const schedules = await recurrentScheduleService.getSchedulesByProfessor(prof._id);
            const diasMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            
            const clasesAsignadas = schedules.map(sch => {
                const diasTexto = sch.daysWeek.map(d => diasMap[d]).join('/');
                return `${diasTexto} ${sch.startTime}`;
            }).join(', ');

            // 2. Calcular sus horas del mes actual
            const report = await classService.getProfessorProductivity(prof._id, startOfMonth, endOfMonth);
            const totalHours = report.reduce((acc, curr) => acc + curr.totalHoursWorked, 0);

            return {
                _id: prof._id,
                name: prof.name,
                speciality: prof.speciality.join(' - '),
                clasesAsignadas: clasesAsignadas || 'Sin clases',
                horasMes: `${totalHours}hs`
            };
        }));

        res.status(200).json({ status: 'success', payload: directory });
    } catch (error) {
        console.error("Error en getProfessorsDirectory:", error);
        res.status(500).json({ status: 'error', error: 'Error al obtener profesores' });
    }
};

export const getStudentsDirectory = async (req, res) => {
    try {
        const students = await userService.findByRole('alumno');
        const directory = await Promise.all(students.map(async (student) => {
            const memberships = await membershipService.getAll({ studentId: student._id, status: 'active' });
            const activeM = memberships.length > 0 ? memberships[0] : null;
            
            let planName = "-";
            let isDefaulter = true;
            let usage = "0/0";

            if (activeM) {
                isDefaulter = new Date(activeM.expireDate) < new Date();
                const plan = await planService.getBy({ _id: activeM.planId });
                planName = plan ? plan.name : "-";
                usage = `${activeM.usedClassesThisMonth}/${(plan ? plan.weeklyClasses : 0) * 4}`;
            }

            return {
                _id: student._id,
                name: student.name,
                planName,
                expireDate: activeM ? activeM.expireDate : null,
                isDefaulter,
                usage
            };
        }));

        res.status(200).json({ status: 'success', payload: directory });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Error al obtener el directorio' });
    }
};