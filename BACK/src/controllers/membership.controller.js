import { membershipService } from "../services/index.service.js";

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

// 3. Crear una nueva membresía (Cuando un alumno paga su primer plan)
export const addMembership = async (req, res) => {
    try {
        const { studentId, planId, startDate, expireDate } = req.body;
        
        if (!studentId || !planId || !startDate || !expireDate) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios" });
        }

        // Se crea con 0 clases usadas y la fecha actual como semana de inicio
        const newMembership = {
            studentId,
            planId,
            startDate,
            expireDate,
            status: 'active',
            usedClassesThisWeek: 0,
            currentWeek: new Date() 
        };

        const result = await membershipService.create(newMembership);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en addMembership:", error);
        res.status(500).json({ status: "error", error: "Error al crear la membresía" });
    }
};

// 4. Actualizar datos de una membresía (Admin) / tambien activamos y desactivamos 
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

// 5. Borrar Membresía 
export const deleteMembership = async (req, res) => {
    try {
        const { mid } = req.params;
        
        // Cambio a borrado físico
        const result = await membershipService.delete(mid);

        if (!result) return res.status(404).json({ status: "error", error: "Membresía no encontrada" });

        res.status(200).json({ status: "success", message: "Membresía eliminada de forma permanente" });
    } catch (error) {
        console.error("Error en deleteMembership:", error);
        res.status(500).json({ status: "error", error: "Error al eliminar la membresía" });
    }
};

// ==========================================
// MÉTODOS DE NEGOCIO (Usan las funciones pro del Repo)
// ==========================================

// 6. Obtener la membresía ACTIVA de un alumno en particular (Ideal para su panel de control)
export const getStudentActiveMembership = async (req, res) => {
    try {
        const { uid } = req.params; // ID del usuario (studentId)
        
        const membership = await membershipService.getBy({ 
            studentId: uid, 
            status: 'active' 
        });

        if (!membership) {
            return res.status(404).json({ status: "error", error: "El alumno no tiene una membresía activa" });
        }

        res.status(200).json({ status: "success", payload: membership });
    } catch (error) {
        console.error("Error en getStudentActiveMembership:", error);
        res.status(500).json({ status: "error", error: "Error al buscar la membresía del alumno" });
    }
};

// 7. Obtener membresías a punto de vencer (Para el Dashboard del Admin o mandar WhatsApps)
export const getExpiringMemberships = async (req, res) => {
    try {
        // Aprovechamos el método que ya crearon en el repositorio
        const expiring = await membershipService.findSoonToExpire(3); // Vencen en 3 días o menos
        
        res.status(200).json({ status: "success", payload: expiring });
    } catch (error) {
        console.error("Error en getExpiringMemberships:", error);
        res.status(500).json({ status: "error", error: "Error al buscar membresías por vencer" });
    }
};