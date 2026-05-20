import mongoose from "mongoose";

const collection = 'Reserve';

const schema = new mongoose.Schema({
    studentId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    scheduleId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Class', // <-- CAMBIAMOS 'Schedule' por 'Class' para que coincida con tu modelo
        required: true
    },
    classId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Class',
        required: false
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        // 🔥 AGREGAMOS 'waitlist' A LA LISTA DE PERMITIDOS
        enum: ['reserved', 'cancelled', 'attended', 'absent', 'waitlist'], 
        default: 'reserved'
    }
}, { timestamps: true });

schema.index({ studentId: 1, scheduleId: 1, date: 1 }, { unique: true });

const reserveModel = mongoose.models[collection] || mongoose.model(collection, schema);

export default reserveModel;
