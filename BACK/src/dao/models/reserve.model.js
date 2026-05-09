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
        type: Number,
        default: 0
    }
}, { timestamps: true });

// ÍNDICE PARCIAL: Solo bloquea duplicados cuando la reserva NO está cancelada.
// Esto permite que un alumno vuelva a reservar una clase que canceló previamente,
// ya que el documento cancelado queda en la DB y el índice unique total lo bloqueaba.
schema.index(
    { studentId: 1, classId: 1 },
    { 
        unique: true,
        partialFilterExpression: { status: { $in: ['confirmed', 'pending'] } }
    }
);
schema.index({ classId: 1, status: 1 });
schema.index({ classId: 1, waitingPosition: 1 });

const reserveModel = mongoose.model(collection, schema);

export default reserveModel;