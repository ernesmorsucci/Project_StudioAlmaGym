import React, { useState, useEffect } from 'react';
import { Clock, Users, CalendarDays, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';
import useFormValidation from '../../hooks/useFormValidation';
import { FormInput, FormSelect } from '../FormComponents';

const CreateScheduleForm = ({ onSuccess, onCancel, initialData = null }) => {
    const [professors, setProfessors] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '', isWarning: false });
    
    const validationSchema = {
        name: 'className',
        professorId: 'required',
        maxQuota: { required: 'Debes seleccionar un cupo máximo', min: 1, minMessage: 'El cupo debe ser al menos 1' },
        startTime: 'required',
        endTime: 'required',
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
            professorId: initialData?.professorId?._id || initialData?.professorId || '',
            classType: initialData?.classType || 'Mat',
            daysWeek: initialData?.daysWeek || [],
            startTime: initialData?.startTime || '',
            endTime: initialData?.endTime || '',
            maxQuota: initialData?.maxQuota || 5
        },
        validationSchema
    );

    const diasSemana = [
        { num: 1, label: 'Lun' },
        { num: 2, label: 'Mar' },
        { num: 3, label: 'Mié' },
        { num: 4, label: 'Jue' },
        { num: 5, label: 'Vie' },
        { num: 6, label: 'Sáb' }
    ];

    // Cargar los profesores al abrir el componente
    useEffect(() => {
        const fetchProfessors = async () => {
            try {
                const response = await api.get('/users');
                const profes = response.data.payload.filter(u => u.rol === 'profesor' || u.rol === 'admin');
                setProfessors(profes);
            } catch (error) {
                console.error("Error cargando profesores", error);
            }
        };
        fetchProfessors();
    }, []);

    const toggleDia = (numDia) => {
        const newDaysWeek = values.daysWeek.includes(numDia)
            ? values.daysWeek.filter(d => d !== numDia)
            : [...values.daysWeek, numDia].sort();
        handleChange({ target: { name: 'daysWeek', value: newDaysWeek } });
    };

    const onSubmit = async (formValues, force = false) => {
        setMessage({ type: '', text: '' });

        if (formValues.daysWeek.length === 0) {
            setMessage({ type: 'error', text: 'Debes seleccionar al menos un día.' });
            return;
        }

        try {
            let response;
            if (initialData) {
                response = await api.put(`/schedules/${initialData._id}`, formValues);
            } else {
                response = await api.post('/schedules', { ...formValues, forceCreate: force });
            }
            
            setMessage({ type: 'success', text: response.data.message });
            setTimeout(() => { if(onSuccess) onSuccess(); }, 2000);

        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al crear el horario.';

            if (errorMsg.includes('ADVERTENCIA')) {
                setMessage({
                    type: 'warning',
                    text: errorMsg,
                    isWarning: true
                });
            } else {
                setMessage({ type: 'error', text: errorMsg });
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-alma-border mb-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-serif text-alma-text">Configurar Nuevo Horario</h3>
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
                <div className={`p-3 mb-6 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : message.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit((vals) => onSubmit(vals))} className="space-y-6">
                {/* Fila 1: Nombre y Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Nombre de la Clase"
                        name="name"
                        type="text"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.name}
                        touched={touched.name}
                        placeholder="Ej: Pilates Reformer Mañana"
                        required
                    />
                    <FormSelect
                        label="Tipo de Clase"
                        name="classType"
                        value={values.classType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.classType}
                        touched={touched.classType}
                        options={[
                            { value: 'Mat', label: 'Pilates Mat' },
                            { value: 'Reformer', label: 'Pilates Reformer' },
                            { value: 'Terapeutico', label: 'Pilates Terapéutico' },
                            { value: 'Prenatal', label: 'Pilates Prenatal' },
                            { value: 'Yogalates', label: 'Pilates Yogalates' },
                            { value: 'Power_Pilates', label: 'Pilates Power_Pilates' },
                            { value: 'Reformer_Pro', label: 'Pilates Reformer_Pro' },
                            { value: 'Chair', label: 'Pilates Chair' },
                            { value: 'Tower', label: 'Pilates Tower' },
                        ]}
                    />
                </div>

                {/* Fila 2: Profesor y Cupos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormSelect
                        label="Profesora Asignada"
                        name="professorId"
                        value={values.professorId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.professorId}
                        touched={touched.professorId}
                        options={professors.map(p => ({ value: p._id, label: p.name }))}
                        required
                    />
                    <FormInput
                        label="Cupo Máximo"
                        name="maxQuota"
                        type="number"
                        value={values.maxQuota}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.maxQuota}
                        touched={touched.maxQuota}
                        placeholder="1-20"
                        required
                        min="1"
                        max="20"
                    />
                </div>

                {/* Fila 3: Días de la semana */}
                <div>
                    <label className="block text-sm font-medium text-alma-textLight mb-2 flex items-center gap-1"><CalendarDays className="w-4 h-4" /> Días de la semana <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-2">
                        {diasSemana.map((dia) => {
                            const isSelected = values.daysWeek.includes(dia.num);
                            return (
                                <button
                                    key={dia.num} type="button"
                                    onClick={() => toggleDia(dia.num)}
                                    className={`w-12 h-12 rounded-full border-2 font-medium transition-all ${isSelected
                                            ? 'bg-alma-olive border-alma-olive text-white shadow-md scale-105'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-alma-olive hover:text-alma-olive'
                                        }`}
                                >
                                    {dia.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Fila 4: Horarios */}
                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Hora Inicio"
                        name="startTime"
                        type="time"
                        value={values.startTime}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.startTime}
                        touched={touched.startTime}
                        required
                    />
                    <FormInput
                        label="Hora Fin"
                        name="endTime"
                        type="time"
                        value={values.endTime}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.endTime}
                        touched={touched.endTime}
                        required
                    />
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    {message.isWarning ? (
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => onSubmit(values, true)}
                                className="flex-1 bg-alma-olive text-white py-3 rounded-lg font-medium hover:bg-opacity-90"
                            >
                                Crear de todas formas
                            </button>
                            <button
                                type="button"
                                onClick={() => setMessage({ type: '', text: '' })}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-alma-olive text-white py-3 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Validando...' : 'Guardar Horario y Generar Clases'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CreateScheduleForm;
