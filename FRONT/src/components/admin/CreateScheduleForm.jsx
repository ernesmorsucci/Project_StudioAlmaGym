import React, { useState, useEffect } from 'react';
import { Clock, Users, CalendarDays, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';

const CreateScheduleForm = ({ onSuccess, onCancel, initialData = null }) => {
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '', isWarning: false });
    
    // Si viene initialData, llenamos el formulario. Si no, vacío.
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        professorId: initialData?.professorId?._id || initialData?.professorId || '',
        classType: initialData?.classType || 'Mat', 
        daysWeek: initialData?.daysWeek || [], 
        startTime: initialData?.startTime || '',
        endTime: initialData?.endTime || '',
        maxQuota: initialData?.maxQuota || 5
    });

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
                // Asumimos que tienes una ruta para traer usuarios. Si falla, mostramos un error controlado.
                const response = await api.get('/users');
                // Filtramos solo los que pueden dar clase (profesores y admins)
                const profes = response.data.payload.filter(u => u.rol === 'profesor' || u.rol === 'admin');
                setProfessors(profes);
            } catch (error) {
                console.error("Error cargando profesores", error);
            }
        };
        fetchProfessors();
    }, []);

    const toggleDia = (numDia) => {
        setFormData(prev => {
            if (prev.daysWeek.includes(numDia)) {
                return { ...prev, daysWeek: prev.daysWeek.filter(d => d !== numDia) };
            } else {
                return { ...prev, daysWeek: [...prev.daysWeek, numDia].sort() };
            }
        });
    };

    const handleSubmit = async (e, force = false) => {
        if (e) e.preventDefault(); // El evento solo viene en el primer clic
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (formData.daysWeek.length === 0) {
            setMessage({ type: 'error', text: 'Debes seleccionar al menos un día.' });
            setLoading(false);
            return;
        }

        try {
            let response;
            if (initialData) {
                // MODO EDICIÓN
                response = await api.put(`/schedules/${initialData._id}`, formData);
            } else {
                // MODO CREACIÓN
                response = await api.post('/schedules', { ...formData, forceCreate: force });
            }
            
            setMessage({ type: 'success', text: response.data.message });
            setTimeout(() => { if(onSuccess) onSuccess(); }, 2000);

        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al crear el horario.';

            // Detectamos si es una advertencia de salón ocupado
            if (errorMsg.includes('ADVERTENCIA')) {
                setMessage({
                    type: 'warning',
                    text: errorMsg,
                    isWarning: true // Flag para mostrar botones especiales
                });
            } else {
                setMessage({ type: 'error', text: errorMsg });
            }
        } finally {
            setLoading(false);
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
                <div className={`p-3 mb-6 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Fila 1: Nombre y Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1">Nombre de la Clase</label>
                        <input
                            type="text" required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            placeholder="Ej: Pilates Reformer Mañana"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1">Tipo de Clase</label>
                        <select
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            value={formData.classType}
                            onChange={(e) => setFormData({ ...formData, classType: e.target.value })}
                        >
                            <option value="Mat">Pilates Mat</option>
                            <option value="Reformer">Pilates Reformer</option>
                            <option value="Terapeutico">Pilates Terapéutico</option>
                            <option value="Prenatal">Pilates Prenatal</option>
                            <option value="Yogalates">Pilates Yogalates</option>
                            <option value="Power_Pilates">Pilates Power_Pilates</option>
                            <option value="Reformer_Pro">Pilates Reformer_Pro</option>
                            <option value="Chair">Pilates Chair</option>
                            <option value="Tower">Pilates Tower</option>
                        </select>
                    </div>
                </div>

                {/* Fila 2: Profesor y Cupos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1"><Users className="w-4 h-4" /> Profesora Asignada</label>
                        <select
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            value={formData.professorId}
                            onChange={(e) => setFormData({ ...formData, professorId: e.target.value })}
                        >
                            <option value="">Seleccionar profesora...</option>
                            {professors.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1">Cupo Máximo</label>
                        <input
                            type="number" min="1" max="20" required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            value={formData.maxQuota}
                            onChange={(e) => setFormData({ ...formData, maxQuota: Number(e.target.value) })}
                        />
                    </div>
                </div>

                {/* Fila 3: Días de la semana */}
                <div>
                    <label className="block text-sm font-medium text-alma-textLight mb-2 flex items-center gap-1"><CalendarDays className="w-4 h-4" /> Días de la semana</label>
                    <div className="flex flex-wrap gap-2">
                        {diasSemana.map((dia) => {
                            const isSelected = formData.daysWeek.includes(dia.num);
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
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1"><Clock className="w-4 h-4" /> Hora Inicio</label>
                        <input
                            type="time" required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1"><Clock className="w-4 h-4" /> Hora Fin</label>
                        <input
                            type="time" required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    {/* SI HAY UNA ADVERTENCIA, MOSTRAMOS BOTONES DOBLES */}
                    {message.isWarning ? (
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => handleSubmit(null, true)} // Re-intentamos con force=true
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
                        /* BOTÓN NORMAL */
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-alma-olive text-white py-3 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50"
                        >
                            {loading ? 'Validando...' : 'Guardar Horario y Generar Clases'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CreateScheduleForm;
