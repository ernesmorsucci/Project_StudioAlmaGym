import ClassRepository from "../repository/class.repository";
import MembershipRepository from "../repository/membership.repository.js";
import PaymentRepository from "../repository/payment.repository.js";
import PlanRepository from "../repository/plan.repository.js";
import RecurrentScheduleRepository from "../repository/recurrentSchedule.repository.js";
import ReserveRepository from "../repository/reserve.repository.js";
import UsersRepository from "../repository/users.repository.js";

export const classService = new ClassRepository();
export const membershipService = new MembershipRepository(); // -Corregido de membershipServer a membershipService 
export const paymentService = new PaymentRepository();
export const planService = new PlanRepository();
export const recurrentScheduleService = new RecurrentScheduleRepository();
export const reserveService = new ReserveRepository();
export const userService = new UsersRepository();