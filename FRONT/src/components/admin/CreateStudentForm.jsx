import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Calendar, CreditCard, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';
import useFormValidation from '../../hooks/useFormValidation';
import { FormInput, FormSelect } from '../FormComponents';

const CreateStudentForm = ({ onSuccess, onCancel }) => {
    const [plans, setPlans] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Obtenemos la fecha de hoy en formato YYYY-MM-DD para el input default
    const today = new Date().toISOString().split('T')[0];

    const validationSchema = {
        name: 'name',
        email: 'email',
        password: 'password',
        planId: 'required',
        startDate: 'required',
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
            name: '',
            email: '',
            password: '',
            planId: '',
            startDate: today
        },
        validationSchema
    );

    // Cargar los planes disponibles desde la base de datos
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await api.get('/plans/active');
                setPlans(response.data.payload || []);
            } catch (error) {
                console.error("Error cargando planes. Si aún no tienes la ruta en el back, es normal.", error);
            }
        };
        fetchPlans();
    }, []);

    const onSubmit = async (formValues) => {
        setMessage({ type: '', text: '' });

        try {
            const response = await api.post('/users/student-with-membership', formValues);
            
            setMessage({ type: 'success', text: response.data.message || 'Alumno registrado con éxito.' });
            
            setTimeout(() => {
                if(onSuccess) onSuccess();
            }, 2000);

        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Error al registrar al alumno.' });
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-alma-border mb-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-serif text-alma-text">Registrar Nuevo Alumno</h3>
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* SECCIÓN 1: DATOS PERSONALES */}
                <div>
                    <h4 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-4">1. Datos Personales</h4>
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
                            placeholder="Ej: Ana López"
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
                            placeholder="ana@ejemplo.com"
                            required
                        />
                        <div className="md:col-span-2">
                            <FormInput
                                label="Contraseña provisoria"
                                name="password"
                                type="text"
                                value={values.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.password}
                                touched={touched.password}
                                placeholder="Ej: Alma2025 (el alumno podrá cambiarla luego)"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: MEMBRESÍA INICIAL */}
                <div>
                    <h4 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-4">2. Membresía Inicial (Opcional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormSelect
                            label="Asignar Plan"
                            name="planId"
                            value={values.planId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.planId}
                            touched={touched.planId}
                            options={plans.map(p => ({ value: p._id, label: `${p.name} - $${p.price}` }))}
                        />
                        <FormInput
                            label="Fecha de inicio de plan"
                            name="startDate"
                            type="date"
                            value={values.startDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.startDate}
                            touched={touched.startDate}
                            disabled={!values.planId}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Si seleccionas un plan, se generará el mes de clases automáticamente.</p>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-alma-olive text-white px-8 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? 'Procesando...' : 'Guardar Alumno'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateStudentForm;
