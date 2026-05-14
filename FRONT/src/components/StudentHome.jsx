import React from 'react';
import { Check, CreditCard, Calendar, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const StudentHome = ({ data, onRefresh }) => {
    const { user } = useAuth();
    const primerNombre = user?.name?.split(' ')[0] || 'Estudiante';
    
    const isExpired = data?.membership?.expireDate ? new Date(data.membership.expireDate) < new Date() : false;
    const hasNoPlan = data?.membership?.status === 'Sin plan';
    const navigate = useNavigate();
    
    const handleCancel = async (id) => {
        if (window.confirm('¿Deseas cancelar tu asistencia a esta clase?')) {
            try {
                // 🔥 LA MAGIA ESTÁ AQUÍ: Cambiamos /reserve/ a /reserves/
                await api.delete(`/reserves/${id}`);
                
                alert("Reserva cancelada correctamente. La clase se ha devuelto a tu plan.");
                onRefresh(); 
            } catch (error) {
                const errorDelBackend = error.response?.data?.error || error.message;
                alert(`Error: ${errorDelBackend}`);
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-serif text-alma-text">Hola, {primerNombre} 🌿</h2>
                    <p className="text-gray-500 mt-2 text-lg">Tu resumen de entrenamiento en Studio Alma.</p>
                </div>
            </div>

            {/* Tarjetas de Estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-8 rounded-[2rem] border-l-8 shadow-sm flex flex-col justify-between ${hasNoPlan ? 'bg-gray-50 border-l-gray-300' : isExpired ? 'bg-red-50 border-l-red-500' : 'bg-white border-l-alma-olive'}`}>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Tu Membresía</h3>
                    <p className="font-bold text-gray-800 text-2xl">{data?.membership?.planName}</p>
                    <p className={`text-sm mt-4 ${isExpired ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {data?.membership?.expireDate ? `Vence el ${new Date(data.membership.expireDate).toLocaleDateString('es-AR')}` : 'Sin plan activo'}
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border-l-8 border-l-alma-warning shadow-sm">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Clases Usadas</h3>
                    <div className="flex flex-wrap gap-2.5">
                        {data?.membership?.totalClasses > 0 ? (
                            Array.from({ length: data.membership.totalClasses }).map((_, i) => (
                                <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${i < data.membership.usedClasses ? 'bg-alma-olive text-white shadow-md' : 'bg-gray-100 border-2 border-dashed border-gray-300'}`}>
                                    {i < data.membership.usedClasses && <Check className="w-5 h-5" strokeWidth={3} />}
                                </div>
                            ))
                        ) : <p className="text-sm text-gray-400 italic">No tienes clases para usar.</p>}
                    </div>
                    <p className="text-sm text-gray-500 mt-6 font-bold">Uso mensual: {data?.membership?.usedClasses} / {data?.membership?.totalClasses}</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border-l-8 border-l-blue-400 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Cuota del Mes</h3>
                        <p className="text-5xl font-serif text-gray-800">${data?.nextPayment?.amount?.toLocaleString('es-AR')}</p>
                    </div>
                    <button onClick={() => navigate('/inicio?tab=pagos')} className="mt-6 bg-gray-800 text-white text-sm font-bold py-3.5 px-7 rounded-2xl hover:bg-black transition-all flex items-center gap-2 w-fit shadow-lg">
                        <CreditCard className="w-4 h-4"/> Abonar Cuota
                    </button>
                </div>
            </div>

            {/* LISTADO COMPLETO DE PRÓXIMAS CLASES (ORDENADAS) */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-alma-olive/10 rounded-2xl text-alma-olive">
                        <Calendar className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-serif text-alma-text">Tus Próximas Clases</h3>
                </div>

                <div className="space-y-5">
                    {!data?.reservations || data.reservations.length === 0 ? (
                        <div className="py-16 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-400 italic text-lg">No tienes ninguna reserva activa actualmente.</p>
                        </div>
                    ) : (
                        data.reservations.map(res => (
                            <div key={res._id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-7">
                                    <div className="bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm text-center min-w-[120px]">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{res.date}</p>
                                        <p className="text-3xl font-black text-alma-olive">{res.time}</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-xl">{res.name}</p>
                                        <p className="text-base text-gray-500 mt-1">
                                            Con <span className="text-alma-olive font-black">{res.instructor}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-8 pt-6 md:pt-0 border-t md:border-0 border-gray-100">
                                    <span className="px-5 py-2 rounded-full bg-green-100 text-green-700 text-[11px] font-black uppercase tracking-wider">Confirmada</span>
                                    <button 
                                        onClick={() => handleCancel(res._id)}
                                        className="flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 px-5 py-3 rounded-2xl transition-all"
                                    >
                                        <XCircle className="w-5 h-5" /> Cancelar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentHome;