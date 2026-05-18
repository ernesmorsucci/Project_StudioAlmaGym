import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
    // Guardamos la fecha como 'YYYY-MM-DD' para evitar desfases UTC
    date: { type: String, required: true, unique: true }, 
    description: { type: String, required: true }
}, { timestamps: true });

const holidayModel = mongoose.model('Holiday', holidaySchema);
export default holidayModel;