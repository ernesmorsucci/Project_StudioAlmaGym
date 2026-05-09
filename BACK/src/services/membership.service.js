import MembershipRepository from "../repository/membership.repository.js";
const membershipRepo = new MembershipRepository();

export default class MembershipService {
    getAll = (params) => membershipRepo.getAll(params);
    getBy = (params) => membershipRepo.getBy(params);
    create = (doc) => membershipRepo.create(doc);
    update = (id, doc) => membershipRepo.update(id, doc);
    delete = (id) => membershipRepo.delete(id);

    // Métodos específicos (Usados por los Cron Jobs y el Dashboard)
    resetMonthlyCounters = (startDate) => membershipRepo.resetMonthlyCounters(startDate);
    findExpiredMemberships = () => membershipRepo.findExpiredMemberships();
    findSoonToExpire = (days) => membershipRepo.findSoonToExpire(days);
}