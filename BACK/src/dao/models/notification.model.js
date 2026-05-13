import mongoose from "mongoose";

const collection = 'Notification';

const schema = new mongoose.Schema({
    adminId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    subject: { // <-- NUEVO CAMPO
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    targetType: { // <-- REEMPLAZA AL VIEJO "receivers"
        type: String,
        required: true
    },
    studentIds: [{ // Aquí guardamos a los destinatarios finales
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }],
    sent: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const notificationModel = mongoose.model(collection, schema);

export default notificationModel;