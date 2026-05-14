import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { showConfirm, showError, showSuccess } from '../utils/alerts';

const StudentReservations = ({ onRefresh }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [upcoming, setUpcoming] = useState([]);
    const [past, setPast] = useState([]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/reserves/student/${user._id}`);
            const allReserves = res.data.payload || [];

            const now = new Date();
            const upcomingList = [];
            const pastList = [];

            allReserves.forEach(reserve => {
                const reserveDate = new Date(reserve.date);
                const className = reserve.scheduleId?.name || reserve.class?.name || 'Clase de Studio';
                const professorName = reserve.scheduleId?.professorId?.name || reserve.class?.professorId?.name || 'Staff';

                let dateStr = reserveDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
                dateStr = dateStr.replace('.', '').replace(/(^\w|\s\w)/g, m => m.toUpperCase());

                const formatted = {
                    id: reserve._id,
                    className: className,
                    dateStr: dateStr,
                    timeStr: reserveDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                    professor: professorName,
                    status: reserve.status,
                    rawDate: reserveDate
                };

                // Si la clase es futura y está reservada, va a Próximas
                if (reserveDate >= now && reserve.status === 'reserved') {
                    upcomingList.push(formatted);
                } 
                // 🔥 LA SOLUCIÓN: Todo lo que no sea una reserva activa futura, va al historial (incluyendo canceladas)
                else {
                    pastList.push(formatted);
                }
            });

            upcomingList.sort((a, b) => a.rawDate - b.rawDate);
            pastList.sort((a, b) => b.rawDate - a.rawDate);

            setUpcoming(upcomingList);
            setPast(pastList);
        } catch (error) {
            console.error("Error al cargar las reservas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleCancel = async (id) => {
        const confirmed = await showConfirm({
            title: 'Cancelar reserva',
            text: '¿Deseas cancelar tu asistencia a esta clase?',
            confirmButtonText: 'Cancelar reserva',
            icon: 'warning',
            confirmButtonColor: '#E07A5F',
        });

        if (confirmed) {
            try {
                await api.delete(`/reserves/${id}`);
                showSuccess("Reserva cancelada correctamente. La clase ha sido devuelta a tu plan.");
                fetchReservations(); 
                if (onRefresh) onRefresh(); 
            } catch (error) {
                showError(error.response?.data?.error || "Error al cancelar la reserva.");
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin text-alma-olive w-10 h-10" />
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            <h2 className="text-4xl font-serif text-alma-text mb-8">Mis reservas</h2>

            {/* TABLA: PRÓXIMAS RESERVAS */}
            <div className="bg-white rounded-[1.5rem] border border-gray-200 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Próximas</h3>
                
                {upcoming.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-4">No tienes clases próximas reservadas.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                    <th className="pb-4 font-black">Clase</th>
                                    <th className="pb-4 font-black">Fecha</th>
                                    <th className="pb-4 font-black">Hora</th>
                                    <th className="pb-4 font-black">Profesora</th>
                                    <th className="pb-4 font-black">Estado</th>
                                    <th className="pb-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {upcoming.map(res => (
                                    <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-5 font-medium text-gray-700">{res.className}</td>
                                        <td className="py-5 text-gray-600">{res.dateStr}</td>
                                        <td className="py-5 text-gray-600">{res.timeStr}</td>
                                        <td className="py-5 text-gray-600">{res.professor}</td>
                                        <td className="py-5">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Confirmada
                                            </span>
                                        </td>
                                        <td className="py-5 text-right pr-2">
                                            <button 
                                                onClick={() => handleCancel(res.id)}
                                                className="px-4 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* TABLA: HISTORIAL RECIENTE */}
            <div className="bg-white rounded-[1.5rem] border border-gray-200 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Historial reciente</h3>
                
                {past.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-4">Aún no hay registros en tu historial.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                                <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                    <th className="pb-4 font-black w-1/3">Clase</th>
                                    <th className="pb-4 font-black w-1/3">Fecha</th>
                                    <th className="pb-4 font-black w-1/3">Asistencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {past.map(res => (
                                    <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-5 font-medium text-gray-700">{res.className}</td>
                                        <td className="py-5 text-gray-600">{res.dateStr}</td>
                                        <td className="py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold 
                                                ${res.status === 'attended' ? 'bg-green-50 text-green-700' : 
                                                  res.status === 'cancelled' ? 'bg-gray-100 text-gray-500' : 
                                                  'bg-red-50 text-red-700'}`}>
                                                
                                                <span className={`w-1.5 h-1.5 rounded-full 
                                                    ${res.status === 'attended' ? 'bg-green-500' : 
                                                      res.status === 'cancelled' ? 'bg-gray-400' : 
                                                      'bg-red-500'}`}></span> 
                                                
                                                {res.status === 'attended' ? 'Asistió' : 
                                                 res.status === 'cancelled' ? 'Cancelada' : 
                                                 'Ausente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentReservations;
