import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CreateScheduleForm from '../components/CreateScheduleForm';
import CreateStudentForm from '../components/CreateStudentForm';
import CreatePlanForm from '../components/CreatePlanForm';
import CreateProfessorForm from '../components/CreateProfessorForm';
import StudentDetailModal from '../components/StudentDetailModal';
import api from '../services/api';
import PaymentManager from '../components/PaymentManager'; // <-- MÓDULO DE PAGOS LISTO
import NotificationManager from '../components/NotificationManager';
import DashboardHome from '../components/DashboardHome';
import { showConfirm, showError } from '../utils/alerts';


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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [studentFilter, setStudentFilter] = useState('todos');

  // ==========================================
  // ESTADOS PARA PLANES
  // ==========================================
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // ==========================================
  // ESTADOS PARA PROFESORAS
  // ==========================================
  const [showProfessorForm, setShowProfessorForm] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [monthlyClasses, setMonthlyClasses] = useState([]);
  const [loadingProfessors, setLoadingProfessors] = useState(false);

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

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await api.get('/plans');
      setPlans(response.data.payload || []);
    } catch (error) { console.error(error); } finally { setLoadingPlans(false); }
  };

  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toInputDate = (date) => date.toISOString().split('T')[0];

    return {
      startDate: toInputDate(start),
      endDate: toInputDate(end)
    };
  };

  const fetchProfessorsDashboard = async () => {
    try {
      setLoadingProfessors(true);
      const { startDate, endDate } = getCurrentMonthRange();
      const [professorsResponse, classesResponse] = await Promise.all([
        api.get('/users/directory/professors'),
        api.get(`/classes/filter?startDate=${startDate}&endDate=${endDate}`)
      ]);

      setProfessors(professorsResponse.data.payload || []);
      setMonthlyClasses(classesResponse.data.payload || []);
    } catch (error) { console.error(error); } finally { setLoadingProfessors(false); }
  };

  useEffect(() => {
    if (activeTab === 'horarios') fetchSchedules();
    if (activeTab === 'alumnos') fetchStudents();
    if (activeTab === 'planes') fetchPlans();
    if (activeTab === 'profesoras') fetchProfessorsDashboard();
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
    const confirmed = await showConfirm({
      title: 'Eliminar horario',
      text: '¿Estás seguro de que deseas eliminar este horario?',
      confirmButtonText: 'Eliminar',
      icon: 'warning',
      confirmButtonColor: '#E07A5F',
    });

    if (confirmed) {
      try {
        await api.delete(`/schedules/${id}`);
        fetchSchedules();
      } catch (error) { showError("Hubo un error al eliminar el horario."); }
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
    setSelectedStudent(student);
  };

  // ==========================================
  // LÓGICA DE PLANES
  // ==========================================
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const handlePlanSuccess = () => {
    setShowPlanForm(false);
    setEditingPlan(null);
    fetchPlans();
  };

  const handleEditPlanClick = (plan) => {
    setEditingPlan(plan);
    setShowPlanForm(true);
  };

  const handleDeletePlanClick = async (id) => {
    const confirmed = await showConfirm({
      title: 'Eliminar plan',
      text: '¿Estás seguro de que deseas eliminar este plan?',
      confirmButtonText: 'Eliminar',
      icon: 'warning',
      confirmButtonColor: '#E07A5F',
    });

    if (confirmed) {
      try {
        await api.delete(`/plans/${id}`);
        fetchPlans();
      } catch (error) {
        showError(error.response?.data?.error || 'Hubo un error al eliminar el plan.');
      }
    }
  };

  // ==========================================
  // LÓGICA DE PROFESORAS
  // ==========================================
  const getClassProfessorId = (classItem) => {
    if (!classItem?.professorId) return null;
    return typeof classItem.professorId === 'object' ? classItem.professorId._id : classItem.professorId;
  };

  const getClassDurationHours = (classItem) => {
    const start = new Date(classItem.dateTime);
    const end = new Date(classItem.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    return Math.max((end - start) / (1000 * 60 * 60), 0);
  };

  const getProfessorStats = (professorId) => {
    const professorClasses = monthlyClasses.filter(classItem => getClassProfessorId(classItem)?.toString() === professorId?.toString());
    const totalHours = professorClasses.reduce((acc, classItem) => acc + getClassDurationHours(classItem), 0);

    return {
      assignedClasses: professorClasses.length,
      workedHours: totalHours
    };
  };

  const formatHours = (hours) => {
    if (!hours) return '0 h';
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
  };

  const formatSpeciality = (speciality) => {
    if (!speciality || speciality.length === 0) return 'Sin especialidad';
    return Array.isArray(speciality) ? speciality.join(', ') : speciality;
  };

  const handleProfessorSuccess = () => {
    setShowProfessorForm(false);
    setEditingProfessor(null);
    fetchProfessorsDashboard();
  };

  const handleEditProfessorClick = (professor) => {
    setEditingProfessor(professor);
    setShowProfessorForm(true);
  };

  const handleDeleteProfessorClick = async (id) => {
    const confirmed = await showConfirm({
      title: 'Eliminar profesora',
      text: '¿Estás seguro de que deseas eliminar esta profesora?',
      confirmButtonText: 'Eliminar',
      icon: 'warning',
      confirmButtonColor: '#E07A5F',
    });

    if (confirmed) {
      try {
        await api.delete(`/users/${id}`);
        fetchProfessorsDashboard();
      } catch (error) {
        showError(error.response?.data?.error || 'Hubo un error al eliminar la profesora.');
      }
    }
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[60px]">
                          <div
                            className="bg-alma-olive h-1.5 rounded-full"
                            style={{ width: `${((schedule.registeredCount || 0) / schedule.maxQuota) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-600 font-bold">
                          {schedule.registeredCount || 0}/{schedule.maxQuota}
                        </span>
                      </div>
                    </td>
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

      {/* ========================================== */}
      {/* VISTA: GESTIÓN DE PLANES                   */}
      {/* ========================================== */}
      {activeTab === 'planes' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-serif text-alma-text">Gestión de planes</h2>
              <p className="text-sm text-gray-500 mt-1">Administra los planes mensuales disponibles para las alumnas.</p>
            </div>
            {!showPlanForm && (
              <button
                onClick={() => { setEditingPlan(null); setShowPlanForm(true); }}
                className="bg-[#6B7A5C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 shadow-sm"
              >
                + Nuevo plan
              </button>
            )}
          </div>

          {showPlanForm && (
            <CreatePlanForm
              initialData={editingPlan}
              onSuccess={handlePlanSuccess}
              onCancel={() => { setShowPlanForm(false); setEditingPlan(null); }}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Total planes</p>
              <p className="text-2xl font-serif text-alma-text mt-2">{plans.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Activos</p>
              <p className="text-2xl font-serif text-alma-text mt-2">{plans.filter(plan => plan.isActive).length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Inactivos</p>
              <p className="text-2xl font-serif text-alma-text mt-2">{plans.filter(plan => !plan.isActive).length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Plan</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Clases semanales</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Precio</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingPlans && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Cargando planes...</td></tr>}
                {!loadingPlans && plans.length === 0 && <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">No hay planes cargados todavía.</td></tr>}
                {!loadingPlans && plans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{plan.name}</td>
                    <td className="px-6 py-4 text-gray-600">{plan.weeklyClasses} por semana</td>
                    <td className="px-6 py-4 text-gray-600">{formatCurrency(plan.price)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center w-max gap-1.5 ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {plan.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button onClick={() => handleEditPlanClick(plan)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">Editar</button>
                      <button onClick={() => handleDeletePlanClick(plan._id)} className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VISTA: GESTIÓN DE PROFESORAS               */}
      {/* ========================================== */}
      {activeTab === 'profesoras' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-serif text-alma-text">Gestión de profesoras</h2>
              <p className="text-sm text-gray-500 mt-1">Consulta carga mensual, especialidades y datos de acceso.</p>
            </div>
            {!showProfessorForm && (
              <button
                onClick={() => { setEditingProfessor(null); setShowProfessorForm(true); }}
                className="bg-[#6B7A5C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 shadow-sm"
              >
                + Nueva profesora
              </button>
            )}
          </div>

          {showProfessorForm && (
            <CreateProfessorForm
              initialData={editingProfessor}
              onSuccess={handleProfessorSuccess}
              onCancel={() => { setShowProfessorForm(false); setEditingProfessor(null); }}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Profesoras</p>
              <p className="text-2xl font-serif text-alma-text mt-2">{professors.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Clases del mes</p>
              <p className="text-2xl font-serif text-alma-text mt-2">{monthlyClasses.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Horas del mes</p>
              <p className="text-2xl font-serif text-alma-text mt-2">{formatHours(monthlyClasses.reduce((acc, classItem) => acc + getClassDurationHours(classItem), 0))}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Nombre</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Especialidad</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Clases asignadas</th>
                  <th className="px-6 py-4 uppercase text-xs tracking-wider">Horas trabajadas este mes</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingProfessors && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Cargando profesoras...</td></tr>}
                {!loadingProfessors && professors.length === 0 && <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">No hay profesoras cargadas todavía.</td></tr>}
                {!loadingProfessors && professors.map((professor) => {
                  const stats = getProfessorStats(professor._id);

                  return (
                    <tr key={professor._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {professor.name}
                        <span className="block text-xs text-gray-400 font-normal">{professor.email}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatSpeciality(professor.speciality)}</td>
                      <td className="px-6 py-4 text-gray-600">{stats.assignedClasses}</td>
                      <td className="px-6 py-4 text-gray-600">{formatHours(stats.workedHours)}</td>
                      <td className="px-6 py-4 flex justify-end gap-3">
                        <button onClick={() => handleEditProfessorClick(professor)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">Editar</button>
                        <button onClick={() => handleDeleteProfessorClick(professor._id)} className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VISTA: GESTIÓN DE PAGOS (NUEVO)            */}
      {/* ========================================== */}
      {activeTab === 'pagos' && (
        <PaymentManager />
      )}

      {/* ========================================== */}
      {/* VISTA: COMUNICACIONES Y NOTIFICACIONES     */}
      {/* ========================================== */}
      {activeTab === 'notificaciones' && (
        <NotificationManager />
      )}

      {/* ========================================== */}
      {/* VISTA: HOME (DASHBOARD PRINCIPAL)          */}
      {/* ========================================== */}
      {activeTab === 'dashboard' && (
        <DashboardHome />
      )}

    </div>
  );
};

export default AdminDashboard;
