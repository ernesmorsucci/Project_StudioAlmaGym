import React, { useState, useEffect } from 'react';
import { X, User, CreditCard, CalendarDays, Phone, Activity, HeartPulse, Save, Banknote, Landmark, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

const StudentDetailModal = ({ student, onClose }) => {
    const [activeTab, setActiveTab] = useState('perfil');

    // ESTADOS: PERFIL Y SALUD
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        phone: student.phone === 'Sin teléfono' ? '' : student.phone,
        emergencyContact: student.emergencyContact === '—' ? '' : student.emergencyContact,
        healthNotes: student.healthNotes === 'Sin notas' ? '' : student.healthNotes
    });

    // ESTADOS: MEMBRESÍA Y PAGOS
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [availablePlans, setAvailablePlans] = useState([]);
    const [paymentData, setPaymentData] = useState({
        planId: student.planId || '',
        amount: '',
        method: 'Transferencia'
    });

    // ESTADOS: RESERVAS E HISTORIAL
    const [reservations, setReservations] = useState({ upcoming: [], past: [] });
    const [loadingReservations, setLoadingReservations] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/plans/active');
                setAvailablePlans(res.data.payload || []);
            } catch (error) {
                console.error("Error al cargar planes:", error);
            }
        };
        fetchPlans();
    }, []);

    useEffect(() => {
        if (activeTab === 'historial') {
            fetchReservations();
        }
    }, [activeTab]);

    // ==========================================
    // LÓGICA REAL DE RESERVAS
    // ==========================================
    const fetchReservations = async () => {
        setLoadingReservations(true);
        try {
            const res = await api.get(`/reserves/student/${student.id}`);
            const allReserves = res.data.payload || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = [];
            const past = [];

            allReserves.forEach(reserve => {
                const reserveDate = new Date(reserve.date);
                
                // 🔥 CORRECCIÓN: Leemos el nombre usando el objeto real o el alias del backend
                const className = reserve.scheduleId?.name || reserve.class?.name || 'Clase Asignada';
                
                // 🔥 CORRECCIÓN: Usamos dateTime (el campo real de tu modelo) y extraemos la hora
                let classTime = 'S/H';
                const rawDateTime = reserve.scheduleId?.dateTime || reserve.class?.dateTime;
                if (rawDateTime) {
                    classTime = new Date(rawDateTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                }

                const formattedReserve = {
                    id: reserve._id,
                    date: reserveDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    time: classTime,
                    classType: className,
                    status: reserve.status === 'reserved' ? 'Confirmada' : 
                            reserve.status === 'cancelled' ? 'Cancelada' : 
                            reserve.status === 'attended' ? 'Asistió' : 'Ausente',
                    rawDate: reserveDate
                };

                // Clasificamos si es futura/activa o pasada/cancelada
                if (reserveDate >= today && reserve.status === 'reserved') {
                    upcoming.push(formattedReserve);
                } else {
                    past.push(formattedReserve);
                }
            });

            // Ordenamos: Próximas (más cercanas primero), Pasadas (más recientes primero)
            upcoming.sort((a, b) => a.rawDate - b.rawDate);
            past.sort((a, b) => b.rawDate - a.rawDate);

            setReservations({ upcoming, past });
            setLoadingReservations(false);
        } catch (error) {
            console.error("Error al cargar reservas:", error);
            if (error.response && error.response.status === 404) {
                setReservations({ upcoming: [], past: [] });
            }
            setLoadingReservations(false);
        }
    };

    const handleCancelReservation = async (reservationId) => {
        if (window.confirm("¿Estás seguro de que deseas cancelar esta reserva? Se le devolverá el cupo al alumno automáticamente.")) {
            try {
                await api.delete(`/reserves/${reservationId}`);
                alert("Reserva cancelada exitosamente.");
                fetchReservations(); 
            } catch (error) {
                console.error("Error al cancelar:", error);
                alert(error.response?.data?.error || "Error al cancelar la reserva.");
            }
        }
    };

    // ==========================================
    // LÓGICA DE PERFIL Y PAGOS
    // ==========================================
    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await api.put(`/users/${student.id}`, formData);
            student.phone = formData.phone || 'Sin teléfono';
            student.emergencyContact = formData.emergencyContact || '—';
            student.healthNotes = formData.healthNotes || 'Sin notas';
            setIsEditing(false);
        } catch (error) {
            alert("Hubo un error al guardar los datos.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!paymentData.planId || !paymentData.amount) {
            return alert("Por favor seleccione un plan y asegúrese de que el monto esté completo.");
        }

        try {
            await api.post('/payments', {
                studentId: student.id,
                planId: paymentData.planId,
                amount: Number(paymentData.amount),
                method: paymentData.method
            });

            alert(`¡Pago exitoso! La membresía se ha actualizado correctamente.`);
            setShowPaymentForm(false);
            onClose(); 
        } catch (error) {
            console.error("Error al procesar el pago:", error);
            alert(error.response?.data?.error || "Hubo un error al procesar el pago.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
                
                {/* HEADER */}
                <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-alma-olive text-white rounded-2xl flex items-center justify-center text-2xl font-serif shadow-lg rotate-3">
                            {student.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif text-alma-text tracking-tight">{student.name}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-500 flex items-center gap-1"><User className="w-3 h-3"/> Alumno</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-500">{student.email}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-red-100">
                        <X className="w-7 h-7" />
                    </button>
                </div>

                {/* NAVEGACIÓN */}
                <div className="flex border-b border-gray-200 px-8 bg-white sticky top-0 z-10">
                    {[
                        { id: 'perfil', label: 'Ficha y Salud', icon: HeartPulse },
                        { id: 'membresia', label: 'Membresía y Pagos', icon: CreditCard },
                        { id: 'historial', label: 'Clases y Reservas', icon: CalendarDays }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsEditing(false); setShowPaymentForm(false); }}
                            className={`py-5 px-6 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                                activeTab === tab.id 
                                ? 'border-alma-olive text-alma-olive bg-alma-olive/5' 
                                : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* CUERPO DEL MODAL */}
                <div className="p-8 overflow-y-auto flex-1 bg-[#FAFAFA]">
                    
                    {/* ======================================================== */}
                    {/* PESTAÑA 1: PERFIL Y SALUD                                */}
                    {/* ======================================================== */}
                    {activeTab === 'perfil' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Phone className="w-4 h-4 text-alma-olive"/> Info de Contacto</h4>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">WhatsApp / Celular</label>
                                            {isEditing ? (
                                                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none text-sm"/>
                                            ) : (
                                                <p className="text-gray-800 font-medium text-lg">{student.phone}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Contacto de Emergencia</label>
                                            {isEditing ? (
                                                <input type="text" value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alma-olive outline-none text-sm"/>
                                            ) : (
                                                <p className="text-gray-800 font-medium">{student.emergencyContact}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-8 rounded-2xl border-l-4 border-l-red-400 border border-gray-200 shadow-sm">
                                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 mb-6"><Activity className="w-5 h-5"/> Observaciones Médicas</h4>
                                    <div className={`${isEditing ? '' : 'bg-red-50/50 p-6 rounded-2xl border border-red-100/50'}`}>
                                        {isEditing ? (
                                            <textarea rows="4" value={formData.healthNotes} onChange={(e) => setFormData({...formData, healthNotes: e.target.value})} className="w-full p-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-sm text-gray-700 bg-red-50/20"/>
                                        ) : (
                                            <p className="text-gray-700 leading-relaxed text-lg italic font-serif">"{student.healthNotes}"</p>
                                        )}
                                    </div>
                                    <div className="mt-8 flex gap-4 border-t border-gray-100 pt-6">
                                        {isEditing ? (
                                            <>
                                                <button onClick={handleSaveProfile} disabled={isSaving} className="bg-alma-olive text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-opacity-90 flex items-center gap-2"><Save className="w-4 h-4"/> {isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
                                                <button onClick={() => setIsEditing(false)} disabled={isSaving} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200">Cancelar</button>
                                            </>
                                        ) : (
                                            <button onClick={() => setIsEditing(true)} className="bg-gray-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-900 shadow-md">Editar Perfil y Salud</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* PESTAÑA 2: MEMBRESÍA Y PAGOS                             */}
                    {/* ======================================================== */}
                    {activeTab === 'membresia' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between">
                                <div className="flex gap-6 items-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-alma-olive"><CreditCard className="w-10 h-10" /></div>
                                    <div>
                                        <span className="text-xs font-bold text-alma-olive uppercase tracking-tighter">Plan Actual</span>
                                        <h3 className="text-3xl font-serif text-gray-800">{student.plan}</h3>
                                        {student.membershipId && <p className="text-gray-500 mt-1">Vence: <span className="font-bold text-gray-800">{student.expiration}</span></p>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                                    <div className={`px-5 py-2 rounded-full text-sm font-black tracking-widest ${student.status === 'Al día' ? 'bg-green-100 text-green-700' : student.status === 'Vence pronto' ? 'bg-yellow-100 text-yellow-700' : student.status === 'Vencida' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {student.status.toUpperCase()}
                                    </div>
                                    {student.membershipId && (
                                        <div className="text-right">
                                            <p className="text-sm text-gray-400">Cupo mensual</p>
                                            <p className="text-2xl font-serif text-alma-text">{student.usage} clases</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!showPaymentForm ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                                    <button onClick={() => setShowPaymentForm(true)} className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-alma-olive transition-all text-left group shadow-sm hover:shadow-md">
                                        <h5 className="font-bold text-gray-800 text-lg flex items-center gap-2 group-hover:text-alma-olive"><Banknote className="w-5 h-5"/> {student.membershipId ? 'Renovar Membresía' : 'Registrar Primer Pago'}</h5>
                                        <p className="text-sm text-gray-500 mt-2">Registra el cobro, elige el plan y actualiza el vencimiento del alumno automáticamente.</p>
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-2xl border-2 border-alma-olive/20 shadow-md animate-fade-in">
                                    <h4 className="text-lg font-serif text-alma-text mb-6 border-b border-gray-100 pb-4">Registrar Pago y Asignar Plan</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-600 mb-2">Plan a abonar</label>
                                            <select 
                                                value={paymentData.planId}
                                                onChange={(e) => {
                                                    const selectedPlan = availablePlans.find(p => p._id === e.target.value);
                                                    setPaymentData({...paymentData, planId: e.target.value, amount: selectedPlan ? selectedPlan.price : ''});
                                                }}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none bg-white"
                                            >
                                                <option value="">Seleccione el plan que el alumno va a pagar...</option>
                                                {availablePlans.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name} - ${p.price}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2">Monto final ($)</label>
                                            <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none" placeholder="Ej: 30000" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2">Método de Pago</label>
                                            <div className="flex gap-4">
                                                <button onClick={() => setPaymentData({...paymentData, method: 'Transferencia'})} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${paymentData.method === 'Transferencia' ? 'border-alma-olive bg-alma-olive/10 text-alma-olive font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><Landmark className="w-4 h-4"/> Transferencia</button>
                                                <button onClick={() => setPaymentData({...paymentData, method: 'Efectivo'})} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${paymentData.method === 'Efectivo' ? 'border-alma-olive bg-alma-olive/10 text-alma-olive font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><Banknote className="w-4 h-4"/> Efectivo</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                                        <button onClick={() => setShowPaymentForm(false)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                                        <button onClick={handleConfirmPayment} disabled={!paymentData.amount || !paymentData.planId} className="bg-alma-olive text-white px-8 py-2.5 rounded-xl font-bold shadow-md hover:bg-opacity-90 disabled:opacity-50">Confirmar e Ingresar Pago</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* PESTAÑA 3: HISTORIAL DE CLASES Y RESERVAS                */}
                    {/* ======================================================== */}
                    {activeTab === 'historial' && (
                        <div className="animate-fade-in space-y-8">
                            {loadingReservations ? (
                                <div className="py-20 text-center text-gray-400 animate-pulse">Cargando reservas desde la base de datos...</div>
                            ) : (
                                <>
                                    {/* PRÓXIMAS RESERVAS */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-alma-olive uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4"/> Próximas Reservas
                                        </h4>
                                        {reservations.upcoming.length === 0 ? (
                                            <p className="text-gray-500 text-sm italic">El alumno no tiene reservas próximas.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {reservations.upcoming.map(res => (
                                                    <div key={res.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-100 bg-gray-50/50 rounded-xl hover:border-gray-200 transition-colors">
                                                        <div className="flex items-center gap-4 mb-3 md:mb-0">
                                                            <div className="bg-white p-2 rounded-lg border border-gray-100 text-center min-w-[60px] shadow-sm">
                                                                <span className="block text-[10px] font-bold text-gray-400 uppercase">{res.date.split('/')[1]}</span>
                                                                <span className="block text-xl font-serif text-alma-text">{res.date.split('/')[0]}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 flex items-center gap-2">{res.classType} <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full uppercase tracking-wider">{res.status}</span></p>
                                                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {res.time} hs</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleCancelReservation(res.id)}
                                                            className="text-sm font-medium text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100 w-full md:w-auto"
                                                        >
                                                            Cancelar reserva
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* HISTORIAL PASADO */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4"/> Historial de Asistencia
                                        </h4>
                                        {reservations.past.length === 0 ? (
                                            <p className="text-gray-500 text-sm italic">No hay registros de clases pasadas.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="text-gray-400 border-b border-gray-100">
                                                        <tr>
                                                            <th className="pb-3 font-medium pl-2">Fecha</th>
                                                            <th className="pb-3 font-medium">Clase</th>
                                                            <th className="pb-3 font-medium text-right pr-2">Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {reservations.past.map(res => (
                                                            <tr key={res.id} className="hover:bg-gray-50/50">
                                                                <td className="py-3 pl-2 text-gray-600">{res.date} a las {res.time}</td>
                                                                <td className="py-3 font-medium text-gray-700">{res.classType}</td>
                                                                <td className="py-3 text-right pr-2">
                                                                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${res.status === 'Asistió' || res.status === 'Confirmada' ? 'text-green-600' : 'text-red-500'}`}>
                                                                        {res.status === 'Asistió' || res.status === 'Confirmada' ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                                                                        {res.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default StudentDetailModal;