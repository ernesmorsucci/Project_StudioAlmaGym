import GenericRepository from "./generic.repository.js";
import PlanDao from "../dao/plan.dao.js"; // Ruta corregida

const dao = new PlanDao();

export default class PlanRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    
    /**
     * Obtiene solo los planes que están actualmente disponibles (activos).
     * Ideal para mostrar en el frontend cuando el alumno quiere ver precios.
     */
    getActivePlans = () => {
        return this.dao.get({ isActive: true });
    }
}