//
import mongoose from "mongoose";

const collection = 'User';

const schema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password:{ type: String, required: true },
    phone:{ type: String },
    rol:{ type: String, enum: ['alumno', 'profesor', 'admin'], default: 'alumno' },
    speciality:[{ type: String }],
    // NUEVOS CAMPOS PARA RECUPERACIÓN:
    resetCode: { type: String, default: null },
    resetCodeExpires: { type: Date, default: null }
}, { timestamps: true });

const userModel = mongoose.model(collection, schema);
export default userModel;