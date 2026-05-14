import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Loader, ChevronRight, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentBooking = ({ onRefresh }) => {
    const { user } = useAuth();
    const [groupedClasses, setGroupedClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState(null);

    const fetchAvailableClasses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/classes');
            const classes = response.data.payload;

            // 🔥 LA MAGIA: Filtramos las clases para que solo muestre las del futuro
            const now = new Date();
            const futureClasses = classes.filter(cls => new Date(cls.dateTime) > now);

            const grouped = {};

            // Usamos futureClasses en lugar de classes
            futureClasses.forEach(cls => {
                const dateObj = new Date(cls.dateTime);
                const dayKey = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
                
                if (!grouped[dayKey]) {
                    grouped[dayKey] = {
                        dateObj: dateObj,
                        title: dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
                        classes: []
                    };
                }
                grouped[dayKey].classes.push(cls);
            });

            const sortedGroups = Object.values(grouped).sort((a, b) => a.dateObj - b.dateObj);
            sortedGroups.forEach(group => {
                group.classes.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            });

            setGroupedClasses(sortedGroups);
        } catch (error) {
            console.error("Error al cargar clases:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAvailableClasses(); }, []);

    const handleBooking = async (classItem) => {
        const capacity = classItem.maxQuota || 0;
        const enrolledCount = classItem.occupiedQuota || 0;
        const isFull = enrolledCount >= capacity;
        
        const msg = isFull ? "¿Deseas entrar en la lista de espera?" : `¿Reservar lugar para ${classItem.name}?`;

        if (window.confirm(msg)) {
            setBookingId(classItem._id);
            try {
                await api.post('/reserves', {
                    studentId: user._id,
                    scheduleId: classItem._id,
                    date: classItem.dateTime
                });
                alert(isFull ? "¡Te has unido a la lista de espera!" : "¡Reserva confirmada!");
                fetchAvailableClasses();
                if (onRefresh) onRefresh(); 
            } catch (error) {
                alert(error.response?.data?.error || "Error al procesar la reserva.");
            } finally {
                setBookingId(null);
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-alma-olive w-10 h-10" /></div>
    );

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-alma-olive/10 rounded-2xl text-alma-olive"><Calendar className="w-8 h-8" /></div>
                <div>
                    <h2 className="text-3xl font-serif text-alma-text">Cronograma de Clases</h2>
                    <p className="text-gray-500">Encuentra tu actividad por fecha y horario.</p>
                </div>
            </div>

            {groupedClasses.length === 0 ? (
                 <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400">No hay clases programadas para los próximos días.</p>
                </div>
            ) : (
                groupedClasses.map((group) => (
                    <div key={group.title} className="space-y-6">
                        <h3 className="text-2xl font-serif text-alma-text capitalize flex items-center gap-3">
                            <span className="w-10 h-px bg-alma-olive opacity-30"></span> {group.title}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {group.classes.map((cls) => {
                                const dateObj = new Date(cls.dateTime);
                                
                                // Lectura de campos exactos de tu modelo de mongoose
                                const capacity = cls.maxQuota || 0;
                                const enrolledCount = cls.occupiedQuota || 0;
                                const isFull = enrolledCount >= capacity;

                                return (
                                    <div key={cls._id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all p-7">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="bg-alma-olive/5 text-alma-olive px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                Presencial
                                            </span>
                                            
                                            {/* 🔥 AQUÍ ESTÁ LA MAGIA DEL FORMATO 0/5 */}
                                            <div className={`flex items-center gap-1.5 text-xs font-bold ${isFull ? 'text-red-500' : 'text-alma-olive'}`}>
                                                <Users className="w-4 h-4" /> 
                                                <span>{enrolledCount}/{capacity} {isFull ? '(Llena)' : 'ocupados'}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-5 mb-6">
                                            <div className="bg-gray-50 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                                                <Clock className="w-6 h-6 text-alma-olive mb-1" />
                                                <span className="text-xs font-black text-gray-800">
                                                    {dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-xl">{cls.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">Duración: 60 min</p>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleBooking(cls)}
                                            disabled={bookingId === cls._id}
                                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isFull ? 'bg-gray-800 text-white hover:bg-black' : 'bg-alma-olive text-white hover:bg-black'}`}
                                        >
                                            {bookingId === cls._id ? (
                                                <Loader className="w-4 h-4 animate-spin" />
                                            ) : isFull ? (
                                                <>Anotarse a la cola <ChevronRight className="w-4 h-4" /></>
                                            ) : (
                                                <>Reservar lugar <CheckCircle className="w-4 h-4" /></>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default StudentBooking;