import mongoose from "mongoose";

const collection = 'User';

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        enum: ['alumno', 'profesor', 'admin'],
        default: 'alumno'
    },
    speciality: {
        type: Array,
        default: []
    },
    // 👇 NUEVOS CAMPOS PARA LA FICHA DEL ALUMNO 👇
    phone: {
        type: String,
        default: ''
    },
    emergencyContact: {
        type: String,
        default: ''
    },
    healthNotes: {
        type: String,
        default: ''
    },
    // ------------------------------------------
    resetCode: {
        type: String,
        default: null
    },
    resetCodeExpires: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const userModel = mongoose.model(collection, schema);

export default userModel;