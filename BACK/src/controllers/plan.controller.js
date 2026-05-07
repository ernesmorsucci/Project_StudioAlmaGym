import { planService } from "../services/index.service.js";

// 1. Obtener TODOS los planes (incluyendo los inactivos, para el Admin)
export const getAllPlans = async (req, res) => {
    try {
        const plans = await planService.getAll();
        res.status(200).json({ status: "success", payload: plans });
    } catch (error) {
        console.error("Error en getAllPlans:", error);
        res.status(500).json({ status: "error", error: "Error al obtener los planes" });
    }
};

// 2. Obtener un plan específico por ID
export const getPlanById = async (req, res) => {
    try {
        const { pid } = req.params;
        const plan = await planService.getBy({ _id: pid });
        
        if (!plan) return res.status(404).json({ status: "error", error: "Plan no encontrado" });
        
        res.status(200).json({ status: "success", payload: plan });
    } catch (error) {
        console.error("Error en getPlanById:", error);
        res.status(500).json({ status: "error", error: "Error al obtener el plan" });
    }
};

// 3. Crear un nuevo plan (Admin)
export const addPlan = async (req, res) => {
    try {
        const { name, weeklyClasses, price } = req.body;
        
        if (!name || !weeklyClasses || !price) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios (nombre, clases semanales o precio)" });
        }

        const newPlan = {
            name,
            weeklyClasses,
            price,
            isActive: true
        };

        const result = await planService.create(newPlan);
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en addPlan:", error);
        res.status(500).json({ status: "error", error: "Error al crear el plan" });
    }
};

// 4. Actualizar un plan (Admin - ej: cambiar el precio)
export const updatePlan = async (req, res) => {
    try {
        const { pid } = req.params;
        const updateData = req.body;

        const result = await planService.update(pid, updateData);
        if (!result) return res.status(404).json({ status: "error", error: "Plan no encontrado" });

        res.status(200).json({ status: "success", payload: result });
    } catch (error) {
        console.error("Error en updatePlan:", error);
        res.status(500).json({ status: "error", error: "Error al actualizar el plan" });
    }
};

// 5. Eliminar un plan (Borrando lógico deshabilitando isActive)
export const deletePlan = async (req, res) => {
    try {
        const { pid } = req.params;
        
        // Cambio a borrado físico
        const result = await planService.delete(pid);

        if (!result) return res.status(404).json({ status: "error", error: "Plan no encontrado" });

        res.status(200).json({ status: "success", message: "Plan eliminado de forma permanente" });
    } catch (error) {
        console.error("Error en deletePlan:", error);
        res.status(500).json({ status: "error", error: "Error al eliminar el plan" });
    }
};

// ==========================================
// MÉTODO DE NEGOCIO
// ==========================================

// 6. Obtener solo los planes ACTIVOS (Para mostrar en la web a los alumnos)
export const getActivePlans = async (req, res) => {
    try {
        // Usamos el método especializado del repositorio
        const plans = await planService.getActivePlans();
        res.status(200).json({ status: "success", payload: plans });
    } catch (error) {
        console.error("Error en getActivePlans:", error);
        res.status(500).json({ status: "error", error: "Error al obtener los planes activos" });
    }
};