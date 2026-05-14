import React, { useState, useEffect } from 'react';
import { Loader, AlertTriangle, Calendar, Megaphone, Bell } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// 🔥 DICCIONARIO INTELIGENTE: Mapeamos el "targetType" del Admin a un icono y color
const NOTIFICATION_TYPES = {
    expired_students: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' }, // Alerta naranja
    expiring_soon: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },    // Alerta naranja
    specific_class: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },          // Recordatorio azul
    all_students: { icon: Megaphone, color: 'text-pink-500', bg: 'bg-pink-50' },           // Aviso general rosa
    specific_user: { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100' },              // Mensaje personal gris
    default: { icon: Bell, color: 'text-gray-400', bg: 'bg-gray-50' }
};

const StudentNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/notifications/student/${user._id}`);
                setNotifications(res.data.payload || []);
            } catch (error) {
                console.error("Error al cargar notificaciones:", error);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [user._id]);

    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today - targetDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        return `hace ${diffDays} días`;
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin text-alma-olive w-10 h-10" />
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            <h2 className="text-4xl font-serif text-alma-text mb-8">Notificaciones</h2>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No tienes notificaciones nuevas.</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        // 🔥 Leemos el targetType de tu backend
                        const style = NOTIFICATION_TYPES[notif.targetType] || NOTIFICATION_TYPES.default;
                        const IconComponent = style.icon;

                        return (
                            <div 
                                key={notif._id} 
                                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex gap-5 hover:border-alma-olive/30 transition-colors"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                                    <IconComponent className={`w-6 h-6 ${style.color}`} />
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="flex justify-between items-start mb-1">
                                        {/* 🔥 Usamos notif.subject en lugar de title */}
                                        <h4 className="font-bold text-gray-800">{notif.subject}</h4>
                                        <span className="text-xs font-medium text-gray-400 capitalize">
                                            {getRelativeTime(notif.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StudentNotifications;
