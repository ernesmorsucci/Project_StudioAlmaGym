import holidayModel from '../dao/models/holiday.model.js';

export const getHolidays = async (req, res) => {
    try {
        const holidays = await holidayModel.find().sort({ date: 1 });
        res.status(200).json({ status: 'success', payload: holidays });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const addHoliday = async (req, res) => {
    try {
        const { date, description } = req.body;
        if (!date || !description) {
            return res.status(400).json({ status: 'error', error: 'Faltan campos obligatorios' });
        }
        const newHoliday = await holidayModel.create({ date, description });
        res.status(201).json({ status: 'success', payload: newHoliday });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: 'error', error: 'Esta fecha ya está registrada como feriado.' });
        }
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const deleteHoliday = async (req, res) => {
    try {
        const { hid } = req.params;
        await holidayModel.findByIdAndDelete(hid);
        res.status(200).json({ status: 'success', message: 'Feriado eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};