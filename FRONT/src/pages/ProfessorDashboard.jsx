import React, { useState, useEffect } from 'react';
import { Users, Clock, Calendar as CalendarIcon, Loader, CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const primerNombre = user?.name?.split(' ')[0] || 'Profe';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/professor');
        setData(response.data.payload);
      } catch (error) {
        // RED DE SEGURIDAD: Datos simulados hasta que armemos el Backend
        console.log("Usando datos de respaldo para el Profesor...");
        setData({
          todayClasses: [
            { 
              id: 1, 
              time: '08:00', 
              name: 'Pilates Mat', 
              enrolled: 4, 
              capacity: 5,
              students: ['María García', 'Lucía Pérez', 'Ana Gómez', 'Clara Ruiz'] 
            },
            { 
              id: 2, 
              time: '18:00', 
              name: 'Reformer', 
              enrolled: 5, 
              capacity: 5,
              students: ['Julia Paz', 'Marta Soler', 'Elena Roca', 'Sofía Díaz', 'Laura Gil'] 
            }
          ],
          weeklyStats: { totalClasses: 8, totalStudents: 32 }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-alma-olive w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Cabecera */}
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-alma-text flex items-center gap-2">
          Hola, {primerNombre} 👋
        </h2>
        <p className="text-sm text-alma-textLight mt-1">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} • Tus clases de hoy
        </p>
      </div>

      {/* Resumen Semanal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-alma-border shadow-sm flex items-center gap-4 border-l-4 border-l-alma-olive">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-alma-textLight tracking-wider uppercase">Clases esta semana</h3>
            <p className="text-2xl font-serif text-alma-text">{data?.weeklyStats?.totalClasses} clases</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-alma-border shadow-sm flex items-center gap-4 border-l-4 border-l-alma-warning">
          <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-alma-textLight tracking-wider uppercase">Alumnos totales</h3>
            <p className="text-2xl font-serif text-alma-text">{data?.weeklyStats?.totalStudents} estudiantes</p>
          </div>
        </div>
      </div>

      {/* Lista de Clases de Hoy */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-alma-textLight" />
          <h3 className="text-lg font-medium text-alma-text">Tu agenda de hoy</h3>
        </div>
        
        {data?.todayClasses?.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-alma-border shadow-sm text-center">
            <p className="text-alma-textLight">No tienes clases programadas para hoy. ¡Disfruta tu día!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.todayClasses?.map((cls) => (
              <div key={cls.id} className="bg-white p-6 rounded-2xl border border-alma-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                  <div className="flex items-center gap-6">
                    <p className="text-3xl font-serif text-alma-olive w-20">{cls.time}</p>
                    <div>
                      <p className="text-xl font-medium text-alma-text">{cls.name}</p>
                      <p className="text-sm text-alma-textLight flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" /> 50 min
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls.enrolled === cls.capacity ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                      {cls.enrolled === cls.capacity ? 'Clase Llena' : 'Cupos disponibles'}
                    </span>
                    <p className="text-sm font-medium text-alma-text mt-2">
                      {cls.enrolled} / {cls.capacity} asistentes
                    </p>
                  </div>
                </div>

                {/* Lista de estudiantes anotados */}
                <div>
                  <p className="text-xs font-bold text-alma-textLight uppercase tracking-wider mb-3">Lista de asistencia</p>
                  <div className="flex flex-wrap gap-2">
                    {cls.students.map((student, index) => (
                      <span key={index} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-alma-text flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-alma-olive"></div>
                        {student}
                      </span>
                    ))}
                    {cls.enrolled === 0 && <span className="text-sm text-alma-textLight italic">Aún no hay estudiantes anotados.</span>}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfessorDashboard;