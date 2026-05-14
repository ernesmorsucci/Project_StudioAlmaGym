import { membershipService } from "../services/index.service.js";
import membershipModel from "../dao/models/membership.model.js"; // 🔥 AGREGAMOS ESTO

// 1. Obtener TODAS las membresías (Ideal para la tabla del Admin)
export const getAllMemberships = async (req, res) => {
    try {
        const memberships = await membershipService.getAll();
        res.status(200).json({ status: "success", payload: memberships });
    } catch (error) {
        console.error("Error en getAllMemberships:", error);
        res.status(500).json({ status: "error", error: "Error al obtener membresías" });
    }
};

// 2. Obtener una membresía específica por su ID
export const getMembershipById = async (req, res) => {
    try {
        const { mid } = req.params;
        const membership = await membershipService.getBy({ _id: mid });
        
        if (!membership) return res.status(404).json({ status: "error", error: "Membresía no encontrada" });
        
        res.status(200).json({ status: "success", payload: membership });
    } catch (error) {
        console.error("Error en getMembershipById:", error);
        res.status(500).json({ status: "error", error: "Error al obtener la membresía" });
    }
};

// 3. Crear una nueva membresía
// REGLA DE NEGOCIO: Un alumno solo puede tener UNA membresía activa a la vez.
// Si ya tiene una activa, se la suspende automáticamente antes de crear la nueva.
export const addMembership = async (req, res) => {
    try {
        const { studentId, planId, startDate, expireDate } = req.body;
        
        if (!studentId || !planId || !startDate || !expireDate) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios" });
        }

        const existingActive = await membershipService.getBy({ studentId, status: 'active' });

        if (existingActive) {
            await membershipService.update(existingActive._id, { status: 'suspended' });
            console.warn(`Membresía anterior ${existingActive._id} suspendida al crear una nueva para el alumno ${studentId}`);
        }

        const newMembership = {
            studentId,
            planId,
            startDate,
            expireDate,
            status: 'active',
            usedClassesThisMonth: 0,
            currentPeriod: new Date()
        };

        const result = await membershipService.create(newMembership);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en addMembership:", error);
        res.status(500).json({ status: "error", error: "Error al crear la membresía" });
    }
};

// 4. Actualizar datos de una membresía (Admin)
export const updateMembership = async (req, res) => {
    try {
        const { mid } = req.params;
        const updateData = req.body;

        const result = await membershipService.update(mid, updateData);
        if (!result) return res.status(404).json({ status: "error", error: "Membresía no encontrada" });

        res.status(200).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en updateMembership:", error);
        res.status(500).json({ status: "error", error: "Error al actualizar la membresía" });
    }
};

// 5. Borrar Membresía (borrado físico)
export const deleteMembership = async (req, res) => {
    try {
        const { mid } = req.params;
        
        const result = await membershipService.delete(mid);

        if (!result) return res.status(404).json({ status: "error", error: "Membresía no encontrada" });

        res.status(200).json({ status: "success", message: "Membresía eliminada de forma permanente" });
    } catch (error) {
        console.error("Error en deleteMembership:", error);
        res.status(500).json({ status: "error", error: "Error al eliminar la membresía" });
    }
};

// ==========================================
// MÉTODOS DE NEGOCIO
// ==========================================

// 6. Obtener la membresía activa de un alumno
// Si por algún error existieran dos activas, devuelve la más reciente y loguea una alerta.
// 6. Obtener la membresía activa de un alumno
export const getStudentActiveMembership = async (req, res) => {
    try {
        const { uid } = req.params; 
        const requestingUser = req.user;

        // 🛡️ ESCUDO DE PRIVACIDAD
        if (requestingUser._id !== uid && requestingUser.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "Acceso denegado: No puedes ver membresías de otros alumnos" });
        }

        // 🔥 LA MAGIA: Usamos el modelo directo y populamos el plan
        const activeMemberships = await membershipModel.find({ studentId: uid, status: 'active' }).populate('planId');

        if (!activeMemberships || activeMemberships.length === 0) {
            return res.status(404).json({ status: "error", error: "El alumno no tiene una membresía activa" });
        }

        if (activeMemberships.length > 1) {
            console.error(`ALERTA: El alumno ${uid} tiene ${activeMemberships.length} membresías activas. Se devuelve la más reciente.`);
        }

        const latest = activeMemberships.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];

        res.status(200).json({ status: "success", payload: latest });
    } catch (error) {
        console.error("Error en getStudentActiveMembership:", error);
        res.status(500).json({ status: "error", error: "Error al buscar la membresía del alumno" });
    }
};

// 7. Obtener membresías a punto de vencer (Dashboard del Admin)
export const getExpiringMemberships = async (req, res) => {
    try {
        const expiring = await membershipService.findSoonToExpire(3);
        res.status(200).json({ status: "success", payload: expiring });
    } catch (error) {
        console.error("Error en getExpiringMemberships:", error);
        res.status(500).json({ status: "error", error: "Error al buscar membresías por vencer" });
    }
};