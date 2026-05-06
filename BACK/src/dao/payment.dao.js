import paymentModel from "./models/payment.model.js";

export default class PaymentDao {

    get = (params = {}) => {
        return paymentModel.find(params);
    }

    getBy = (params) => {
        return paymentModel.findOne(params);
    }

    save = (doc) => {
        return paymentModel.create(doc);
    }

    update = (id, doc) => {
        return paymentModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
    }

    delete = (id) => {
        return paymentModel.findByIdAndDelete(id);
    }

    markAsPaid = (id, method) => {
        return paymentModel.findByIdAndUpdate(
            id,
            {
                status: 'paid',
                method: method,
                date: new Date()
            },
            { new: true }
        );
    }
}