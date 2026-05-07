import ClassRepository from "../repository/class.repository";
import MembershipRepository from "../repository/membership.repository.js";
import PaymentRepository from "../repository/payment.repository.js";
import PlanRepository from "../repository/plan.repository.js";
import RecurrentScheduleRepository from "../repository/recurrentSchedule.repository.js";
import ReserveRepository from "../repository/reserve.repository.js";
import UsersRepository from "../repository/users.repository.js";

export const classService = ClassRepository();
export const membershipServer = MembershipRepository();
export const paymentService = PaymentRepository();
export const planService = PlanRepository();
export const recurrentScheduleService = RecurrentScheduleRepository();
export const reserveService = ReserveRepository();
export const userService = UsersRepository();