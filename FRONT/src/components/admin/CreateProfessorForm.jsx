import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Mail, Sparkles, User, X } from 'lucide-react';
import api from '../../services/api';
import useFormValidation from '../../hooks/useFormValidation';
import { FormInput } from '../FormComponents';

const CreateProfessorForm = ({ onSuccess, onCancel, initialData = null }) => {
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const validationSchema = {
        name: 'name',
        email: 'email',
        password: 'password',
        speciality: 'required',
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
            email: initialData?.email || '',
            password: '',
            speciality: Array.isArray(initialData?.speciality) ? initialData.speciality.join(', ') : ''
        },
        validationSchema
    );

    const onSubmit = async (formValues) => {
        setMessage({ type: '', text: '' });

        const payload = {
            name: formValues.name,
            email: formValues.email,
            rol: 'profesor',
            speciality: formValues.speciality
                .split(',')
                .map(item => item.trim())
                .filter(Boolean)
        };

        if (!initialData || formValues.password) {
            payload.password = formValues.password;
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Nombre completo"
                        name="name"
                        type="text"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.name}
                        touched={touched.name}
                        placeholder="Ej: Laura Fernández"
                        required
                    />
                    <FormInput
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.email}
                        touched={touched.email}
                        placeholder="laura@ejemplo.com"
                        required
                    />
                    <FormInput
                        label={initialData ? 'Nueva contraseña' : 'Contraseña provisoria'}
                        name="password"
                        type="text"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.password}
                        touched={touched.password}
                        placeholder={initialData ? 'Dejar vacío para mantener la actual' : 'Ej: Alma2026'}
                        required={!initialData}
                    />
                    <FormInput
                        label="Especialidad"
                        name="speciality"
                        type="text"
                        value={values.speciality}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.speciality}
                        touched={touched.speciality}
                        placeholder="Reformer, Mat, Prenatal"
                        required
                    />
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
                        disabled={isSubmitting}
                        className="bg-alma-olive text-white px-8 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Agregar profesora'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProfessorForm;
