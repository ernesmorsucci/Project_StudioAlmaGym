import React, { useState } from 'react';
import { AlertCircle, CheckCircle, CreditCard, Hash, X } from 'lucide-react';
import api from '../services/api';

const CreatePlanForm = ({ onSuccess, onCancel, initialData = null }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        weeklyClasses: initialData?.weeklyClasses || 1,
        price: initialData?.price || '',
        isActive: initialData?.isActive ?? true
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const payload = {
                ...formData,
                weeklyClasses: Number(formData.weeklyClasses),
                price: Number(formData.price)
            };

            const response = initialData
                ? await api.put(`/plans/${initialData._id}`, payload)
                : await api.post('/plans', payload);

            setMessage({
                type: 'success',
                text: response.data.message || (initialData ? 'Plan actualizado con éxito.' : 'Plan creado con éxito.')
            });

            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 900);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Error al guardar el plan.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-alma-border mb-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-serif text-alma-text">{initialData ? 'Editar Plan' : 'Agregar Nuevo Plan'}</h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                    title="Cerrar formulario"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 text-sm font-medium ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <span>{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1">
                            <CreditCard className="w-4 h-4" /> Nombre del plan
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            placeholder="Ej: Plan 2x semana"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1">
                            <Hash className="w-4 h-4" /> Clases semanales
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="6"
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            value={formData.weeklyClasses}
                            onChange={(e) => setFormData({ ...formData, weeklyClasses: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1">Precio mensual</label>
                        <input
                            type="number"
                            min="0"
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            placeholder="Ej: 25000"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>
                </div>

                <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-alma-olive focus:ring-alma-olive"
                    />
                    Plan activo y disponible para asignar a alumnos
                </label>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-alma-olive text-white px-8 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear plan'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePlanForm;
