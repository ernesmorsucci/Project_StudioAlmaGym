import mongoose from "mongoose";

const collection = 'Reserve';

const schema = new mongoose.Schema({
    studentId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    classId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Class',
        required: true
    },
    status:{
        type: String,
        enum: ['confirmed','canceled','pending'],
        default: 'confirmed'
    },
    assistance:{
        type: String,
        enum: ['assisted','absent','pending'],
        default: 'pending'
    },
    waitingPosition:{
        type: Number,   //modificado a number
        required: true
    }
}, { timestamps: true });

schema.index({ studentId: 1, classId: 1 }, { unique: true }); //evita duplicados
schema.index({ classId: 1, status: 1 });
schema.index({ classId: 1, waitingPosition: 1 }); //mover lista de espera

const reserveModel = mongoose.model(collection,schema);

export default reserveModel;