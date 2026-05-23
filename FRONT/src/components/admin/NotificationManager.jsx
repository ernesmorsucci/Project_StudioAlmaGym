import React, { useState, useEffect } from 'react';
import { Send, Bell, Users, AlertCircle, Calendar, User, MessageSquare, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { showError, showWarning } from '../../utils/alerts';

const NotificationManager = () => {
    // ESTADOS DE DATOS
    const [students, setStudents] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [classesList, setClassesList] = useState([]); // 🔥 Cambiado para manejar clases reales
    const [loading, setLoading] = useState(true);

    // ESTADOS DEL FORMULARIO
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        targetType: 'all_students',
        targetId: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        const fetchDirectoryData = async () => {
            try {
                const [studentsRes, professorsRes, classesRes] = await Promise.all([
                    api.get('/users/students-dashboard'),
                    api.get('/users/directory/professors'),
                    api.get('/classes') // 🔥 AHORA BUSCAMOS LAS CLASES REALES
                ]);

                setStudents(studentsRes.data.payload || []);
                setProfessors(professorsRes.data.payload || []);

                // 🔥 FILTRO: Solo clases con gente y ordenadas de más recientes a más antiguas
                const activeClasses = (classesRes.data.payload || [])
                    .filter(c => c.occupiedQuota > 0)
                    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

                setClassesList(activeClasses);
            } catch (error) {
                console.error("Error al cargar datos para notificaciones:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDirectoryData();
    }, []);

    const handleTargetTypeChange = (e) => {
        setFormData({ ...formData, targetType: e.target.value, targetId: '' });
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let resolvedIds = [];

            if (formData.targetType === 'all_students') {
                resolvedIds = students.map(s => s.id);
            } else if (formData.targetType === 'expired_students') {
                resolvedIds = students.filter(s => s.status === 'Vencida' || s.status === 'Sin plan').map(s => s.id);
            } else if (formData.targetType === 'expiring_soon') {
                resolvedIds = students.filter(s => s.status === 'Vence pronto').map(s => s.id);
            } else if (formData.targetType === 'all_professors') {
                resolvedIds = professors.map(p => p._id);
            } else if (formData.targetType === 'specific_user') {
                resolvedIds = [formData.targetId];
            } else if (formData.targetType === 'specific_class') {
                try {
                    // Vamos a buscar a los alumnos anotados en esta clase
                    const reservesRes = await api.get(`/reserves/class/${formData.targetId}`);
                    const classReserves = reservesRes.data.payload || [];

                    // Extraemos los IDs filtrando a los cancelados
                    resolvedIds = classReserves
                        .filter(r => r.status === 'reserved')
                        .map(r => typeof r.studentId === 'object' ? r.studentId._id : r.studentId);

                    if (resolvedIds.length === 0) {
                        showWarning("No hay ningún alumno activo inscrito en esta clase.");
                        setIsSubmitting(false);
                        return;
                    }
                } catch (error) {
                    showError("Error al conectar con el módulo de reservas.");
                    setIsSubmitting(false);
                    return;
                }
            }

            if (resolvedIds.length === 0) {
                showWarning("La audiencia seleccionada no tiene ningún usuario actualmente. No se enviará el mensaje.");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                targetType: formData.targetType,
                subject: formData.subject,
                message: formData.message,
                resolvedIds: resolvedIds
            };

            await api.post('/notifications', payload);

            setSuccessMessage(`¡Notificación enviada con éxito a ${resolvedIds.length} persona(s)!`);
            setFormData({ targetType: 'all_students', subject: '', message: '', targetId: '' });
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (error) {
            console.error(error);
            showError(error.response?.data?.error || "Error al enviar la notificación.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-alma-olive animate-pulse">Cargando módulo de comunicaciones...</div>;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-serif text-alma-text flex items-center gap-3">
                    <Bell className="w-8 h-8 text-alma-olive" />
                    Centro de Comunicaciones
                </h2>
                <p className="text-sm text-gray-500 mt-1">Envía avisos, recordatorios y comunicados a diferentes grupos del gimnasio.</p>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 font-medium animate-fade-in">
                    <CheckCircle className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <form onSubmit={handleSendNotification} className="space-y-6">

                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-alma-olive" /> 1. ¿A quién deseas enviar el mensaje?
                        </label>
                        <select
                            value={formData.targetType}
                            onChange={handleTargetTypeChange}
                            className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none bg-white text-gray-700 mb-4"
                        >
                            <option value="all_students">Todos los Alumnos (Activos e Inactivos)</option>
                            <option value="expired_students">Alumnos con Membresía Vencida / Deudores</option>
                            <option value="expiring_soon">Alumnos próximos a vencer (Próximos 3 días)</option>
                            <option value="all_professors">Todas las Profesoras (Staff)</option>
                            <option value="specific_class">Alumnos inscritos en una Clase / Horario específico</option>
                            <option value="specific_user">Un Alumno o Profesora individual</option>
                        </select>

                        {formData.targetType === 'specific_class' && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> Selecciona el horario</label>
                                <select required value={formData.targetId} onChange={(e) => setFormData({ ...formData, targetId: e.target.value })} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-alma-olive bg-white">
                                    <option value="">Selecciona una clase con alumnos...</option>
                                    {/* 🔥 FILTRO + FORMATO VISUAL */}
                                    {classesList
                                        .filter(c => {
                                            // Calculamos el límite de hace 24 horas en milisegundos
                                            const limite24hs = new Date(Date.now() - 24 * 60 * 60 * 1000);
                                            const fechaClase = new Date(c.dateTime);
                                            return fechaClase >= limite24hs; // Pasa si es del futuro o de ayer/hoy
                                        })
                                        .map(c => {
                                            const dateObj = new Date(c.dateTime);
                                            let dateStr = dateObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
                                            dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
                                            const timeStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                                            return (
                                                <option key={c._id} value={c._id}>
                                                    {c.name} - {dateStr} a las {timeStr} hs ({c.occupiedQuota} inscriptos)
                                                </option>
                                            )
                                        })
                                    }
                                </select>
                            </div>
                        )}

                        {formData.targetType === 'specific_user' && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><User className="w-3 h-3" /> Buscar persona</label>
                                <select required value={formData.targetId} onChange={(e) => setFormData({ ...formData, targetId: e.target.value })} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-alma-olive bg-white">
                                    <option value="">Selecciona la persona...</option>
                                    <optgroup label="Alumnos">
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.email}</option>)}
                                    </optgroup>
                                    <optgroup label="Profesoras">
                                        {professors.map(p => <option key={p._id} value={p._id}>Prof. {p.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-alma-olive" /> 2. Asunto del mensaje
                        </label>
                        <input
                            type="text"
                            required
                            maxLength="100"
                            placeholder="Ej: Recordatorio de Vencimiento de Cuota"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-alma-olive" /> 3. Contenido de la notificación
                        </label>
                        <textarea
                            required
                            rows="5"
                            placeholder="Escribe el mensaje aquí. Todos los destinatarios seleccionados recibirán esta notificación en su panel..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none resize-none"
                        />
                    </div>

                    <div className="pt-4 flex justify-end border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={isSubmitting || (['specific_class', 'specific_user'].includes(formData.targetType) && !formData.targetId)}
                            className="bg-alma-olive text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? 'Procesando envío...' : <><Send className="w-5 h-5" /> Enviar Notificación</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NotificationManager;
