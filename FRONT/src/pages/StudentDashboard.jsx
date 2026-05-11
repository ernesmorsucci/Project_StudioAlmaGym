import React, { useState, useEffect } from 'react';
import { Check, Calendar as CalendarIcon, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extraemos el primer nombre y usamos un fallback neutro
  const primerNombre = user?.name?.split(' ')[0] || 'Estudiante';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Intentamos buscar la info real en el backend
        const response = await api.get('/dashboard/student');
        setData(response.data.payload);
      } catch (error) {
        // RED DE SEGURIDAD: Si el backend aún no tiene esta ruta lista, 
        // no rompemos la pantalla. Mostramos datos simulados.
        console.log("Usando datos de respaldo (Endpoint en construcción)...");
        setData({
          membership: {
            status: 'active',
            planName: 'Plan 2x semana',
            expireDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
            usedClasses: 2,
            totalClasses: 2
          },
          nextPayment: { amount: 30000 },
          reservations: [
            { time: '08:00', name: 'Pilates Mat', instructor: 'Sofía Ramos', status: 'Mañana', quota: '3/5', percentage: '60%' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Pantalla de carga mientras trae los datos
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-alma-olive w-8 h-8" />
      </div>
    );
  }

  // Helper para formatear fechas al estilo argentino
  const formatVencimiento = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="max-w-5xl">
      
      {/* Cabecera */}
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-alma-text flex items-center gap-2">
          Hola, {primerNombre} <span className="text-2xl">🌿</span>
        </h2>
        <p className="text-sm text-alma-textLight mt-1">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} • Tu Espacio
        </p>
      </div>

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Tarjeta 1: Membresía */}
        <div className="bg-white p-6 rounded-2xl border border-alma-border shadow-sm flex flex-col justify-between border-l-4 border-l-alma-olive">
          <div>
            <h3 className="text-xs font-bold text-alma-textLight tracking-wider uppercase mb-4">Membresía</h3>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                Activa
              </span>
              <span className="text-sm font-medium text-alma-text">{data?.membership?.planName}</span>
            </div>
          </div>
          <p className="text-sm text-alma-textLight mt-4">Vence el {data?.membership ? formatVencimiento(data.membership.expireDate) : '-'}</p>
        </div>

        {/* Tarjeta 2: Clases (Neutral) */}
        <div className="bg-white p-6 rounded-2xl border border-alma-border shadow-sm flex flex-col justify-between border-l-4 border-l-alma-warning">
          <div>
            <h3 className="text-xs font-bold text-alma-textLight tracking-wider uppercase mb-4">Clases Usadas</h3>
            <div className="flex items-center gap-2 mb-2">
              {Array.from({ length: data?.membership?.usedClasses || 0 }).map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-alma-olive text-white flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-alma-textLight mt-4">{data?.membership?.usedClasses}/{data?.membership?.totalClasses} clases utilizadas</p>
        </div>

        {/* Tarjeta 3: Próximo Pago */}
        <div className="bg-white p-6 rounded-2xl border border-alma-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-alma-textLight tracking-wider uppercase mb-2">Próximo Pago</h3>
            <p className="text-3xl font-serif text-alma-text">${data?.nextPayment?.amount?.toLocaleString('es-AR') || '0'}</p>
          </div>
          <button className="bg-alma-olive hover:bg-alma-oliveHover text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors w-fit mt-4">
            Pagar ahora
          </button>
        </div>
      </div>

      {/* Próximas Reservas */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-alma-textLight" />
          <h3 className="text-lg font-medium text-alma-text">Próximas reservas</h3>
        </div>
        
        {data?.reservations?.map((res, index) => (
          <div key={index} className="bg-white p-5 rounded-2xl border border-alma-border shadow-sm mb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <p className="text-xl font-serif text-alma-text w-16">{res.time}</p>
                <div>
                  <p className="font-medium text-alma-text">{res.name}</p>
                  <p className="text-sm text-alma-textLight">con {res.instructor}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                  {res.status}
                </span>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-alma-textLight">{res.quota} cupos</span>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-alma-olive rounded-full" style={{ width: res.percentage }}></div>
                  </div>
                </div>

                <button className="px-4 py-2 text-sm font-medium text-alma-danger bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-2">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;