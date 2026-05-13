import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CreateScheduleForm from '../components/CreateScheduleForm';
import CreateStudentForm from '../components/CreateStudentForm';
import StudentDetailModal from '../components/StudentDetailModal'; // <-- NUEVO IMPORT
import api from '../services/api';
import PaymentManager from '../components/PaymentManager'; // <-- NUEVO IMPORT

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  
  // ==========================================
  // ESTADOS PARA HORARIOS
  // ==========================================
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // ==========================================
  // ESTADOS PARA ALUMNOS
  // ==========================================
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null); // <-- NUEVO: Alumno seleccionado para el modal
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [studentFilter, setStudentFilter] = useState('todos');

  // ==========================================
  // FETCH DE DATOS
  // ==========================================
  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const response = await api.get('/schedules');
      setSchedules(response.data.payload);
    } catch (error) { console.error(error); } finally { setLoadingSchedules(false); }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await api.get('/users/students-dashboard');
      setStudents(response.data.payload);
    } catch (error) { console.error(error); } finally { setLoadingStudents(false); }
  };

  useEffect(() => {
    if (activeTab === 'horarios') fetchSchedules();
    if (activeTab === 'alumnos') fetchStudents();
  }, [activeTab]);

  // ==========================================
  // LÓGICA DE HORARIOS
  // ==========================================
  const formatDays = (daysArray) => {
    if (!daysArray || daysArray.length === 0) return 'Sin días';
    const dayNames = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 0: 'Dom' };
    const sortedDays = [...daysArray].sort((a, b) => a - b);
    return sortedDays.map(d => dayNames[d]).join(' • ');
  };

  const handleScheduleSuccess = () => {
    setShowScheduleForm(false);
    setEditingSchedule(null);
    fetchSchedules(); 
  };

  const handleEditClick = (schedule) => {
    setEditingSchedule(schedule);
    setShowScheduleForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este horario?')) {
        try {
            await api.delete(`/schedules/${id}`);
            fetchSchedules(); 
        } catch (error) { alert("Hubo un error al eliminar el horario."); }
    }
  };

  // ==========================================
  // LÓGICA DE ALUMNOS
  // ==========================================
  const handleStudentSuccess = () => {
    setShowStudentForm(false);
    fetchStudents();
  };

  const handleViewClick = (student) => {
    setSelectedStudent(student); // Abrimos el Centro de Comando
  };

  const countAlDia = students.filter(s => s.status === 'Al día' || s.status === 'Vence pronto').length;
  const countDeben = students.filter(s => s.status === 'Vencida' || s.status === 'Sin plan').length;

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchStudent.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchStudent.toLowerCase());
    let matchesTab = true;
    if (studentFilter === 'alDia') matchesTab = student.status === 'Al día' || student.status === 'Vence pronto';
    else if (studentFilter === 'deben') matchesTab = student.status === 'Vencida' || student.status === 'Sin plan';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-6xl mx-auto pb-10 pt-4 px-4 md:px-0">
      
      {/* ========================================== */}
      {/* MODAL DETALLE DE ALUMNO (Centro de Comando) */}
      {/* ========================================== */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

      {/* ========================================== */}
      {/* VISTA: GESTIÓN DE HORARIOS                */}
      {/* ========================================== */}
      {activeTab === 'horarios' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-serif text-alma-text">Gestión de horarios</h2>
              <p className="text-sm text-gray-500 mt-1">Configura las plantillas semanales y asigna profesoras.</p>
            </div>
            {!showScheduleForm && (
              <button 
                onClick={() => { setEditingSchedule(null); setShowScheduleForm(true); }}
                className="bg-[#6B7A5C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 shadow-sm"
              >
                + Nuevo horario
              </button>
            )}
          </div>

          {showScheduleForm && (
            <CreateScheduleForm 
              initialData={editingSchedule}
              onSuccess={handleScheduleSuccess} 
              onCancel={() => { setShowScheduleForm(false); setEditingSchedule(null); }} 
            />
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">CLASE</th><th className="px-6 py-4">DÍAS</th>
                  <th className="px-6 py-4">HORA</th><th className="px-6 py-4">PROFESORA</th>
                  <th className="px-6 py-4">CUPOS</th><th className="px-6 py-4 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingSchedules && <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">Cargando horarios...</td></tr>}
                {!loadingSchedules && schedules.length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No hay horarios configurados todavía.</td></tr>}
                {!loadingSchedules && schedules.map((schedule) => (
                  <tr key={schedule._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="font-medium text-alma-text">{schedule.name}</div><div className="text-xs text-gray-400">{schedule.classType}</div></td>
                    <td className="px-6 py-4 text-gray-600">{formatDays(schedule.daysWeek)}</td>
                    <td className="px-6 py-4 text-gray-600">{schedule.startTime} - {schedule.endTime}</td>
                    <td className="px-6 py-4 text-gray-600">{schedule.professorId ? schedule.professorId.name : 'Sin asignar'}</td>
                    <td className="px-6 py-4 text-gray-600">{schedule.maxQuota} máx</td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button onClick={() => handleEditClick(schedule)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">Editar</button>
                      <button onClick={() => handleDeleteClick(schedule._id)} className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VISTA: GESTIÓN DE ALUMNOS                  */}
      {/* ========================================== */}
      {activeTab === 'alumnos' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-serif text-alma-text">Gestión de alumnos</h2>
            {!showStudentForm && (
              <button 
                onClick={() => setShowStudentForm(true)}
                className="bg-[#6B7A5C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 shadow-sm"
              >
                + Nuevo alumno
              </button>
            )}
          </div>

          {showStudentForm && (
            <CreateStudentForm 
              onSuccess={handleStudentSuccess} 
              onCancel={() => setShowStudentForm(false)} 
            />
          )}

          {/* Filtros Píldoras */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button onClick={() => setStudentFilter('todos')} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${studentFilter === 'todos' ? 'bg-white border border-gray-200 shadow-sm text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>Todos ({students.length})</button>
            <button onClick={() => setStudentFilter('alDia')} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${studentFilter === 'alDia' ? 'bg-white border border-gray-200 shadow-sm text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>Al día ({countAlDia})</button>
            <button onClick={() => setStudentFilter('deben')} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${studentFilter === 'deben' ? 'bg-white border border-gray-200 shadow-sm text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>Deben cuota ({countDeben})</button>
          </div>

          <div className="mb-6">
            <input type="text" placeholder="Buscar por nombre o email..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-alma-olive shadow-sm text-sm" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Nombre</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Plan</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Vencimiento</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Estado</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Uso Mensual</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingStudents && <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">Cargando alumnos...</td></tr>}
                {!loadingStudents && filteredStudents.length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No se encontraron alumnos con esos filtros.</td></tr>}
                {!loadingStudents && filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {student.name}
                      <span className="block text-xs text-gray-400 font-normal">{student.email}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.plan}</td>
                    <td className="px-6 py-4 text-gray-600">{student.expiration}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center w-max gap-1.5 ${student.status === 'Al día' ? 'bg-green-100 text-green-800' : student.status === 'Vence pronto' ? 'bg-yellow-100 text-yellow-800' : student.status === 'Vencida' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'Al día' ? 'bg-green-500' : student.status === 'Vence pronto' ? 'bg-yellow-500' : student.status === 'Vencida' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.usage}</td>
                    <td className="px-6 py-4 text-right">
                      {/* BOTÓN VER ACTUALIZADO */}
                      <button 
                        onClick={() => handleViewClick(student)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors font-medium"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTAS PARA LAS DEMÁS SECCIONES */}
      {activeTab !== 'horarios' && activeTab !== 'alumnos' && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-xl font-serif mb-2 capitalize">Sección de {activeTab} en construcción</p>
          <p className="text-sm">Aquí conectaremos los endpoints correspondientes muy pronto.</p>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;