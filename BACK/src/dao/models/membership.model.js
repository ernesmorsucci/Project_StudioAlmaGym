import mongoose from "mongoose";

const collection = 'Membership';

const schema = new mongoose.Schema({
    studentId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    planId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Plan',
        required: true
    },
    startDate:{
        type: Date,
        required: true
    },
    expireDate:{
        type: Date,
        required: true
    },
    status:{
        type: String,
        enum: ['active','expired','suspended'],
        default: 'active'
    },
    usedClassesThisWeek:{
        type: Number,
        default: 0
    },
    currentWeek:{
        type: Date,
        required: true
    }
}, { timestamps: true });

schema.index({ studentId: 1, status: 1 });

const membershipModel = mongoose.model(collection, schema);

export default membershipModel;