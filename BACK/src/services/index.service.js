// ==========================================================================
// CENTRAL DE SERVICIOS (Arquitectura Limpia)
// Aquí exportamos las instancias de toda la lógica de negocio de la app.
// ==========================================================================

import ReserveService from "./reserve.service.js";
import PaymentService from "./payment.service.js";
import ClassService from "./class.service.js";
import MembershipService from "./membership.service.js";
import PlanService from "./plan.service.js";
import RecurrentScheduleService from "./recurrentSchedule.service.js";
import UserService from "./user.service.js";
import NotificationService from "./notification.service.js";


// Instanciamos y exportamos los servicios
export const reserveService = new ReserveService();
export const paymentService = new PaymentService();
export const classService = new ClassService();
export const membershipService = new MembershipService();
export const planService = new PlanService();
export const recurrentScheduleService = new RecurrentScheduleService();
export const userService = new UserService();
export const notificationService = new NotificationService();
// Nota para mantener compatibilidad con algunos controladores:
// Exportamos paymentService temporalmente también como repoPaymentService 
// si tu controlador aún usa ese alias en alguna línea de importación.
export const repoPaymentService = paymentService;