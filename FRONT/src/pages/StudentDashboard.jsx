import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Loader } from 'lucide-react';

import StudentHome from '../components/StudentHome';
import StudentReservations from '../components/StudentReservations';
import StudentBooking from '../components/StudentBooking';
import StudentPayments from '../components/StudentPayments';
import StudentNotifications from '../components/StudentNotifications';
import StudentProfile from '../components/StudentProfile';

const StudentDashboard = () => {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'inicio';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard/student');
            setData(response.data.payload);
        } catch (error) {
            console.error("Error al cargar dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <Loader className="animate-spin text-alma-olive w-10 h-10" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
            {/* Pasamos onRefresh a los componentes que necesiten recargar datos */}
            {activeTab === 'inicio' && <StudentHome data={data} onRefresh={fetchDashboardData} />}
            {activeTab === 'mis-reservas' && <StudentReservations reservations={data?.reservations} onRefresh={fetchDashboardData} />}
            {activeTab === 'agendar' && <StudentBooking onRefresh={fetchDashboardData} />}
            {activeTab === 'pagos' && <StudentPayments />}
            {activeTab === 'notificaciones' && <StudentNotifications />}
            {activeTab === 'mi-perfil' && <StudentProfile />}
        </div>
    );
};

export default StudentDashboard;