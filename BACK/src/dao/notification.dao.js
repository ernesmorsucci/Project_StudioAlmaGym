import BaseDao from "./base.dao.js";
import notificationModel from "./models/notification.model.js";

export default class NotificationDao extends BaseDao {
    constructor() {
        
        super(notificationModel);
    }
    
    
}