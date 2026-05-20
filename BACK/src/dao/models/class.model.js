import mongoose from "mongoose";

const collection = 'Class';

const schema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    classType: {
        type: String,
        enum: ['Reformer', 'Mat', 'Terapeutico','Prenatal','Yogalates','Power_Pilates','Reformer_Pro','Chair','Tower'],
        default: 'Reformer'
    },
    professorId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    recurrentScheduleId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'RecurrentSchedule',
        required: false
    },
    dateTime:{
        type: Date,
        required: true
    },
    endTime:{
        type: Date,
        required: true
    },
    maxQuota:{
        type: Number,
        required: true
    },
    occupiedQuota:{
        type: Number,
        default: 0
    },
    isActive:{
        type: Boolean,
        default: true
    }
}, {timestamps: true});

schema.index({ dateTime: 1 });
schema.index({ professorId: 1, dateTime: 1 });
schema.index({ recurrentScheduleId: 1 });

const classModel = mongoose.model(collection, schema);

export default classModel;