import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Calendar, CreditCard, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../services/api';

const CreateStudentForm = ({ onSuccess, onCancel }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Obtenemos la fecha de hoy en formato YYYY-MM-DD para el input default
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        planId: '',
        startDate: today
    });

    // Cargar los planes disponibles desde la base de datos
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // Asumimos que tendrás una ruta para traer los planes. 
                // Si aún no existe, el catch evitará que se rompa el form.
                const response = await api.get('/plans/active');
                setPlans(response.data.payload || []);
            } catch (error) {
                console.error("Error cargando planes. Si aún no tienes la ruta en el back, es normal.", error);
            }
        };
        fetchPlans();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Enviaremos todo a un endpoint especial que creará al usuario y le asignará la membresía de una vez
            const response = await api.post('/users/student-with-membership', formData);
            
            setMessage({ type: 'success', text: response.data.message || 'Alumno registrado con éxito.' });
            
            setTimeout(() => {
                if(onSuccess) onSuccess();
            }, 2000);

        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Error al registrar al alumno.' });
        } finally {
            setLoading(false);
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

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* SECCIÓN 1: DATOS PERSONALES */}
                <div>
                    <h4 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-4">1. Datos Personales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1"><User className="w-4 h-4"/> Nombre completo</label>
                            <input 
                                type="text" required
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none" 
                                placeholder="Ej: Ana López"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1"><Mail className="w-4 h-4"/> Correo electrónico</label>
                            <input 
                                type="email" required
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none" 
                                placeholder="ana@ejemplo.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1"><Lock className="w-4 h-4"/> Contraseña provisoria</label>
                            <input 
                                type="text" required
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none" 
                                placeholder="Ej: Alma2025 (el alumno podrá cambiarla luego)"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: MEMBRESÍA INICIAL */}
                <div>
                    <h4 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-4">2. Membresía Inicial (Opcional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1"><CreditCard className="w-4 h-4"/> Asignar Plan</label>
                            <select 
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none"
                                value={formData.planId}
                                onChange={(e) => setFormData({...formData, planId: e.target.value})}
                            >
                                <option value="">Crear solo la cuenta (Sin Plan)</option>
                                {plans.map(p => (
                                    <option key={p._id} value={p._id}>{p.name} - ${p.price}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Si seleccionas un plan, se generará el mes de clases automáticamente.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-alma-textLight mb-1 flex items-center gap-1"><Calendar className="w-4 h-4"/> Fecha de inicio de plan</label>
                            <input 
                                type="date" 
                                disabled={!formData.planId} // Se deshabilita si no hay plan seleccionado
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none disabled:bg-gray-100 disabled:text-gray-400" 
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-alma-olive text-white px-8 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : 'Guardar Alumno'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateStudentForm;