import React, { useState } from 'react';
import { AlertCircle, CheckCircle, CreditCard, Hash, X } from 'lucide-react';
import api from '../../services/api';
import useFormValidation from '../../hooks/useFormValidation';
import { FormInput } from '../FormComponents';

const CreatePlanForm = ({ onSuccess, onCancel, initialData = null }) => {
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const validationSchema = {
        name: 'planName',
        weeklyClasses: { required: 'Debes especificar clases semanales', min: 1, minMessage: 'Mínimo 1 clase por semana' },
        price: { required: 'Debes especificar un precio', min: 0, minMessage: 'El precio no puede ser negativo' },
    };

    const {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
    } = useFormValidation(
        {
            name: initialData?.name || '',
            weeklyClasses: initialData?.weeklyClasses || 1,
            price: initialData?.price || '',
            isActive: initialData?.isActive ?? true
        },
        validationSchema
    );

    const onSubmit = async (formValues) => {
        setMessage({ type: '', text: '' });

        try {
            const payload = {
                ...formValues,
                weeklyClasses: Number(formValues.weeklyClasses),
                price: Number(formValues.price)
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                        label="Nombre del plan"
                        name="name"
                        type="text"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.name}
                        touched={touched.name}
                        placeholder="Ej: Plan 2x semana"
                        required
                    />
                    <FormInput
                        label="Clases semanales"
                        name="weeklyClasses"
                        type="number"
                        value={values.weeklyClasses}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.weeklyClasses}
                        touched={touched.weeklyClasses}
                        min="1"
                        max="6"
                        required
                    />
                    <FormInput
                        label="Precio mensual"
                        name="price"
                        type="number"
                        value={values.price}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.price}
                        touched={touched.price}
                        placeholder="Ej: 25000"
                        min="0"
                        required
                    />
                </div>

                <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={values.isActive}
                        onChange={(e) => handleChange({ target: { name: 'isActive', value: e.target.checked } })}
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
                        disabled={isSubmitting}
                        className="bg-alma-olive text-white px-8 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear plan'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePlanForm;
