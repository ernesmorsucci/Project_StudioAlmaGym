import GenericRepository from "./generic.repository.js";
import NotificationDao from "../dao/notification.dao.js";

const dao = new NotificationDao();

export default class NotificationRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    getForUser = async (userId) => {
        // 🔥 LA MAGIA: Buscamos donde el ID del alumno esté dentro del array de destinatarios
        // Lo ordenamos de más nuevo a más viejo y limitamos a los últimos 20 avisos.
        return await this.dao.model.find({ studentIds: userId })
            .sort({ createdAt: -1 }) 
            .limit(20);
    };
}