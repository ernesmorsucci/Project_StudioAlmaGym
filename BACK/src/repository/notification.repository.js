import GenericRepository from "./generic.repository.js";
import NotificationDao from "../dao/notification.dao.js";

const dao = new NotificationDao();

export default class NotificationRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    
    getForUser = async (userId) => {
        return await this.dao.get({
            $or: [
                { receivers: 'all' },
                { receivers: 'specific', studentIds: userId }
            ]
        });
    };
}