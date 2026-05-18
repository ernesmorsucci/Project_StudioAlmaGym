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
    emergencyContact: {
        type: String,
        default: ''
    },
    healthNotes: {
        type: String,
        default: ''
    },
    phone: { 
        type: String,
        default: "" 
    },
    isPhoneVerified: {
        type: Boolean,
        default: false 
    },
    phoneVerificationCode: {
        type: String, 
        default: null 
    },
    phoneVerificationExpires: { 
        type: Date, 
        default: null 
    },
    
    // ==========================================
    // MÓDULO DE SEGURIDAD (2FA)
    // ==========================================
    isEmailVerified: { 
        type: Boolean, 
        default: false 
    },
    updateCode: { 
        type: String, 
        default: null 
    },
    updateCodeExpires: { 
        type: Date, 
        default: null 
    }
}, { timestamps: true });

const usersModel = mongoose.model(collection, schema);
export default usersModel;