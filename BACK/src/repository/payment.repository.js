import GenericRepository from "./generic.repository.js";
import PaymentDao from "../daos/payment_dao.js";

const dao = new PaymentDao();

export default class PaymentRepository extends GenericRepository {
    constructor() {
        super(dao);
    }

    markAsPaid = (id, method) => {
        return this.dao.updateRaw(id, {
            $set: {
                status: 'paid',
                method: method,
                date: new Date()
            }
        });
    }
}