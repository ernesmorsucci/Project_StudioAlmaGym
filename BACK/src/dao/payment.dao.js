import BaseDao from "./base.dao.js";
import paymentModel from "./models/payment.model.js";

export default class PaymentDao extends BaseDao {
    constructor() { super(paymentModel); }
}