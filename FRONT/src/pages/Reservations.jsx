import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // 1. AHORA IMPORTAMOS TU HOOK CORRECTO

const Reservations = () => {
  const { user } = useAuth(); // 2. AHORA SACAMOS EL USUARIO USANDO EL HOOK

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes/available');
      setClasses(response.data.payload || []);
    } catch (error) {
      console.error("Error cargando clases", error);
      setMessage({ type: 'error', text: 'Error al cargar las clases disponibles.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleBookClass = async (cls) => {
    try {
      setMessage({ type: '', text: '' });
      
      const studentId = user?._id || user?.id;

      if (!studentId) {
          setMessage({ type: 'error', text: 'Error: Debes iniciar sesión como alumno para reservar.' });
          return;
      }

      const response = await api.post('/reserves', { 
          studentId: studentId,
          scheduleId: cls._id || cls.id,
          date: new Date() 
      });
      
      setMessage({ type: 'success', text: response.data.message || '¡Reserva confirmada con éxito!' });
      fetchClasses();
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al intentar reservar la clase.';
      setMessage({ type: 'error', text: errorMsg });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-alma-olive w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-alma-text">Reservar Clase</h2>
        <p className="text-sm text-alma-textLight mt-1">Elige tu próxima sesión y asegura tu lugar.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 transition-all ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!classes || classes.length === 0) ? (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-alma-border">
            <p className="text-alma-textLight">No hay clases disponibles en este momento.</p>
          </div>
        ) : (
          classes.map((cls) => (
            <div key={cls._id || cls.id} className="bg-white p-6 rounded-2xl border border-alma-border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ${
                    cls.status === 'available' ? 'bg-alma-bg text-alma-olive' : 'bg-red-50 text-red-600'
                  }`}>
                    {cls.status === 'available' ? 'Disponible' : 'Lleno'}
                  </span>
                  <div className="flex items-center gap-1 text-alma-textLight text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    {cls.time}
                  </div>
                </div>
                
                <h3 className="text-xl font-serif text-alma-text mb-2">{cls.name}</h3>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-alma-textLight">
                    <User className="w-4 h-4" />
                    <span>{cls.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-alma-textLight">
                    <Calendar className="w-4 h-4" />
                    <span>Cupo total: {cls.spots} estudiantes</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleBookClass(cls)}
                className="w-full py-3 px-4 bg-alma-olive text-white rounded-xl font-medium hover:bg-alma-oliveHover transition-colors focus:ring-4 focus:ring-alma-olive/20"
              >
                Reservar Lugar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reservations;