import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Mail, Sparkles, User, X } from 'lucide-react';
import api from '../../services/api';

const CreateProfessorForm = ({ onSuccess, onCancel, initialData = null }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        password: '',
        speciality: Array.isArray(initialData?.speciality) ? initialData.speciality.join(', ') : ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const payload = {
            name: formData.name,
            email: formData.email,
            rol: 'profesor',
            speciality: formData.speciality
                .split(',')
                .map(item => item.trim())
                .filter(Boolean)
        };

        if (!initialData || formData.password) {
            payload.password = formData.password;
        }

        try {
            const response = initialData
                ? await api.put(`/users/${initialData._id}`, payload)
                : await api.post('/users', payload);

            setMessage({
                type: 'success',
                text: response.data.message || (initialData ? 'Profesora actualizada con éxito.' : 'Profesora agregada con éxito.')
            });

            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 900);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Error al guardar la profesora.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-alma-border mb-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-serif text-alma-text">{initialData ? 'Editar Profesora' : 'Agregar Nueva Profesora'}</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1">
                            <User className="w-4 h-4" /> Nombre completo
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            placeholder="Ej: Laura Fernández"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1">
                            <Mail className="w-4 h-4" /> Correo electrónico
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            placeholder="laura@ejemplo.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1">
                            {initialData ? 'Nueva contraseña' : 'Contraseña provisoria'}
                        </label>
                        <input
                            type="text"
                            required={!initialData}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            placeholder={initialData ? 'Dejar vacío para mantener la actual' : 'Ej: Alma2026'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1">
                            <Sparkles className="w-4 h-4" /> Especialidad
                        </label>
                        <input
                            type="text"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            placeholder="Reformer, Mat, Prenatal"
                            value={formData.speciality}
                            onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                        />
                    </div>
                </div>

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
                        {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Agregar profesora'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProfessorForm;
