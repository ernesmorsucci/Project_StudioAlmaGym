import mongoose from "mongoose";

const collection = 'Payment';

const schema = new mongoose.Schema({
    studentId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    membershipId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Membership',
        required: true
    },
    planId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Plan',
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    date:{
        type: Date,
        required: true
    },
    expiration:{
        type: Date,
        required: true
    },
    status:{
        type: String,
        enum: ['pending','paid','expired'],
        default: 'pending'
    },
    method:{
        type: String,
        required: false
    }
}, { timestamps: true });

schema.index({ studentId: 1, date: -1 });

const paymentModel = mongoose.models[collection] || mongoose.model(collection, schema);

export default paymentModel;