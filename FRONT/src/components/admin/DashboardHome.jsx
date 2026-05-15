import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, ArrowRight, Bell, CreditCard, UserPlus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const DashboardHome = () => {
    const [, setSearchParams] = useSearchParams();
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        monthIncome: 0,
        todayClasses: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardSummary = async () => {
            try {
                // 1. Obtenemos la fecha de hoy en formato local YYYY-MM-DD
                const today = new Date();
                const localDateStr = today.toLocaleDateString('en-CA'); // Retorna YYYY-MM-DD local

                const [studentsRes, statsRes, classesRes] = await Promise.all([
                    api.get('/users/students-dashboard'),
                    api.get('/payments/stats'),
                    api.get(`/classes/filter?startDate=${localDateStr}&endDate=${localDateStr}`)
                ]);

                const students = studentsRes.data.payload || [];
                const activeCount = students.filter(s => s.status === 'Al día' || s.status === 'Vence pronto').length;

                // 2. DOBLE CANDADO: Filtramos en el front para asegurar que solo queden las de hoy
                const allFetchedClasses = classesRes.data.payload || [];
                const todayOnly = allFetchedClasses.filter(cls => {
                    const clsDate = new Date(cls.dateTime).toLocaleDateString('en-CA');
                    return clsDate === localDateStr;
                });

                setStats({
                    totalStudents: students.length,
                    activeStudents: activeCount,
                    monthIncome: statsRes.data.payload?.recaudadoMes || 0,
                    todayClasses: todayOnly
                });
            } catch (error) {
                console.error("Error al cargar el resumen del dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardSummary();
    }, []);

    const navigateTo = (tab) => {
        setSearchParams({ tab });
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-20 animate-pulse">
                <div className="w-12 h-12 border-4 border-alma-olive border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-medium">Sincronizando agenda y finanzas...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-6xl mx-auto space-y-8">
            
            {/* 1. BANNER DE BIENVENIDA */}
            <div className="bg-alma-olive p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-serif mb-2">¡Hola, Equipo Alma Gym!</h1>
                    <p className="text-alma-oliveLight text-lg">Resumen para hoy, {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
            </div>

            {/* 2. TARJETAS DE INDICADORES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl"><Users className="w-8 h-8"/></div>
                    <div>
                        <p className="text-xs text-gray-400 font-black tracking-widest uppercase">Alumnos Activas</p>
                        <h3 className="text-3xl font-serif text-gray-800 mt-1">{stats.activeStudents} <span className="text-sm font-sans text-gray-400 font-normal">/ {stats.totalStudents}</span></h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-green-50 text-green-500 rounded-2xl"><TrendingUp className="w-8 h-8"/></div>
                    <div>
                        <p className="text-xs text-gray-400 font-black tracking-widest uppercase">Ingresos Mes</p>
                        <h3 className="text-3xl font-serif text-gray-800 mt-1">${stats.monthIncome.toLocaleString('es-AR')}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-purple-50 text-purple-500 rounded-2xl"><Calendar className="w-8 h-8"/></div>
                    <div>
                        <p className="text-xs text-gray-400 font-black tracking-widest uppercase">Clases Hoy</p>
                        <h3 className="text-3xl font-serif text-gray-800 mt-1">{stats.todayClasses.length}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 3. ACCIONES RÁPIDAS */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
                    <h3 className="text-xl font-serif text-alma-text mb-5">Acciones Rápidas</h3>
                    <div className="space-y-3">
                        <button onClick={() => navigateTo('alumnos')} className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-alma-olive hover:text-white rounded-2xl transition-all text-gray-700 font-bold group border border-transparent">
                            <div className="p-2 bg-white rounded-lg text-alma-olive shadow-sm"><UserPlus className="w-5 h-5"/></div> Inscribir Alumno
                        </button>
                        <button onClick={() => navigateTo('pagos')} className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-alma-olive hover:text-white rounded-2xl transition-all text-gray-700 font-bold group border border-transparent">
                            <div className="p-2 bg-white rounded-lg text-alma-olive shadow-sm"><CreditCard className="w-5 h-5"/></div> Registrar Cobro
                        </button>
                        <button onClick={() => navigateTo('notificaciones')} className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-alma-olive hover:text-white rounded-2xl transition-all text-gray-700 font-bold group border border-transparent">
                            <div className="p-2 bg-white rounded-lg text-alma-olive shadow-sm"><Bell className="w-5 h-5"/></div> Enviar Aviso
                        </button>
                    </div>
                </div>

                {/* 4. AGENDA DEL DÍA */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-xl font-serif text-alma-text">Agenda de Hoy</h3>
                        <button onClick={() => navigateTo('horarios')} className="text-sm font-bold text-alma-olive flex items-center gap-1 hover:bg-alma-olive/10 px-3 py-1.5 rounded-lg transition-colors">Ver Horarios <ArrowRight className="w-4 h-4"/></button>
                    </div>
                    <div className="space-y-4">
                        {stats.todayClasses.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3"/>
                                <p className="text-gray-500 font-medium">No hay clases programadas para hoy.</p>
                            </div>
                        ) : (
                            [...stats.todayClasses].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).map(cls => {
                                const timeString = new Date(cls.dateTime).toLocaleTimeString('es-AR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                });

                                return (
                                    <div key={cls._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-alma-olive/30 transition-colors bg-white hover:shadow-sm">
                                        <div className="flex items-center gap-5">
                                            <div className="bg-alma-olive/10 p-4 rounded-xl text-alma-olive font-black tracking-wider border border-alma-olive/20">
                                                {timeString}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-lg">{cls.name}</h4>
                                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-alma-olive"></span> 
                                                    {cls.professorId?.name || 'Prof. sin asignar'} • {cls.classType}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right px-4 py-2 bg-gray-50 rounded-xl min-w-[80px]">
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Cupo</span>
                                            <p className={`font-black text-lg ${cls.occupiedQuota >= cls.maxQuota ? 'text-red-500' : 'text-alma-olive'}`}>
                                                {cls.occupiedQuota || 0} / {cls.maxQuota}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
