import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { showError, showSuccess, showConfirm, showWarning } from '../utils/alerts';
import ProfessorClassesTab from '../components/professor/ProfessorClassesTab';
import ProfessorHomeTab from '../components/professor/ProfessorHomeTab';
import ProfessorHoursTab from '../components/professor/ProfessorHoursTab';
import ProfessorMobileTabs from '../components/professor/ProfessorMobileTabs';
import ProfessorStudentsTab from '../components/professor/ProfessorStudentsTab';
import {
  getClassHours,
  getReserveStudent,
  getStatusLabel,
  getStudentId,
  getUserId,
  markReserveStatus,
  normalizeProfessorTab,
  sameDay,
  startOfWeek,
} from '../components/professor/professorDashboardUtils';

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeProfessorTab(searchParams.get('tab'));

  const [classes, setClasses] = useState([]);
  const [reservesByClass, setReservesByClass] = useState({});
  const [studentsDirectory, setStudentsDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingReserve, setUpdatingReserve] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  const professorId = user?._id || user?.id;
  const professorName = user?.name || 'Profesora';
  const firstName = professorName.split(' ')[0] || 'Profesora';

  const loadData = async () => {
    if (!professorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users/students-dashboard').catch(() => ({ data: { payload: [] } })),
      ]);

      const allClasses = classesRes.data.payload || [];
      const professorClasses = allClasses
        .filter((classItem) => getUserId(classItem.professorId)?.toString() === professorId.toString())
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

      // Obtenemos todas las reservas de las clases que dicta la profesora en UNA sola llamada
      try {
        const reservesRes = await api.get(`/reserves/professor/${professorId}`);
        const reservesMap = reservesRes.data.payload || {};

        // DEBUG: Mostrar en consola para verificar keys/ids
        // console.log('ProfessorDashboard: clases encontradas', professorClasses.map(c => c._id));
        // console.log('ProfessorDashboard: reservas por clase (keys)', Object.keys(reservesMap));

        setClasses(professorClasses);
        setStudentsDirectory(studentsRes.data.payload || []);
        setReservesByClass(reservesMap);
      } catch (error) {
        console.error('Error al cargar reservas por profesor:', error?.response?.data || error.message);
        setClasses(professorClasses);
        setStudentsDirectory(studentsRes.data.payload || []);
        setReservesByClass({});
      }
    } catch (error) {
      console.error('Error al cargar el panel de profesoras:', error);
      showError('No pudimos cargar tus clases. Intentá nuevamente en unos minutos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [professorId]);

  const now = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfWeek(now), [now]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 7);
    return end;
  }, [weekStart]);

  const completedClasses = useMemo(
    () => classes.filter((classItem) => new Date(classItem.dateTime) <= now),
    [classes, now]
  );

  const todayClasses = useMemo(
    () => classes.filter((classItem) => sameDay(new Date(classItem.dateTime), now)),
    [classes, now]
  );

  const monthClasses = useMemo(
    () =>
      completedClasses.filter((classItem) => {
        const date = new Date(classItem.dateTime);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }),
    [completedClasses, now]
  );

  const weekClasses = useMemo(
    () =>
      completedClasses.filter((classItem) => {
        const date = new Date(classItem.dateTime);
        return date >= weekStart && date < weekEnd;
      }),
    [completedClasses, weekEnd, weekStart]
  );

  const studentsById = useMemo(() => {
    const map = new Map();
    studentsDirectory.forEach((student) => map.set(getStudentId(student), student));
    return map;
  }, [studentsDirectory]);

  // Mostrar solo reservas activas y correspondientes al mismo día de la clase (futuras del mismo día)
  const getClassReserves = (classId) => {
    const classItem = classes.find((c) => String(c._id) === String(classId));
    if (!classItem) return [];

    const reserves = reservesByClass[classId] || [];
    return reserves.filter((reserve) => {
      if (!reserve) return false;
      if (reserve.status === 'cancelled') return false;

      const reserveDate = reserve.date ? new Date(reserve.date) : new Date(reserve.dateTime || reserve.date);
      const classDate = new Date(classItem.dateTime || classItem.date);
      if (Number.isNaN(reserveDate.getTime()) || Number.isNaN(classDate.getTime())) return false;

      // Mostrar solo si la reserva es del mismo día de la clase y es futura o igual a ahora
      return sameDay(reserveDate, classDate) && reserveDate >= now;
    });
  };

  const getHydratedStudent = (reserve) => {
    const reserveStudent = getReserveStudent(reserve);
    return {
      ...reserveStudent,
      ...(studentsById.get(getStudentId(reserveStudent)) || {}),
    };
  };

  const todayReserveCount = todayClasses.reduce((acc, classItem) => acc + getClassReserves(classItem._id).length, 0);
  const todayDebtCount = todayClasses.reduce((acc, classItem) => {
    return acc + getClassReserves(classItem._id).filter((reserve) => getStatusLabel(getHydratedStudent(reserve)) === 'Debe cuota').length;
  }, 0);
  const monthHours = monthClasses.reduce((acc, classItem) => acc + getClassHours(classItem), 0);
  const weekHours = weekClasses.reduce((acc, classItem) => acc + getClassHours(classItem), 0);

  const professorStudents = useMemo(() => {
    const map = new Map();
    Object.values(reservesByClass).flat().forEach((reserve) => {
      const student = getHydratedStudent(reserve);
      const studentId = getStudentId(student);
      if (studentId) map.set(studentId, student);
    });
    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [reservesByClass, studentsById]);

  const filteredStudents = professorStudents.filter((student) => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return true;
    return `${student.name || ''} ${student.email || ''}`.toLowerCase().includes(query);
  });

  const handleMarkAttendance = async (reserveId, status) => {
    // 🔥 NUESTRA LÓGICA: Preguntar antes de marcar Ausente
    if (status === 'absent') {
        const isConfirmed = await showConfirm(
            "¿Marcar como Ausente?",
            "Esta acción le descontará el crédito a la alumna y no se puede deshacer."
        );
        if (!isConfirmed) return; // Si la profe cancela, no hacemos nada
    }

    try {
      setUpdatingReserve(`${reserveId}-${status}`);
      
      // Llama a la función que dejó tu compañero
      await markReserveStatus(reserveId, status); 
      
      showSuccess(status === 'attended' ? '¡Asistencia registrada!' : 'Ausencia registrada');
      
      // Esto recarga los datos para que el botón cambie de color
      await loadData();
    } catch (error) {
      console.error(error);
      showError('Error al actualizar la asistencia');
    } finally {
      setUpdatingReserve(null);
    }
  };

  const handleCancelClass = async (classItem) => {
    // 1️⃣ PEDIR CONFIRMACIÓN
    const isConfirmed = await showConfirm(
      "¿Cancelar esta clase?",
      `Se cancelarán todas las reservas de "${classItem.name}" y se notificará a los estudiantes inscritos.`
    );
    if (!isConfirmed) return;

    try {
      setUpdatingReserve(`cancel-${classItem._id}`);

      const response = await api.delete(`/classes/${classItem._id}/cancel`);
      const notified = response.data?.payload?.studentsNotified ?? 0;
      const cancelled = response.data?.payload?.cancelledReserves ?? 0;

      showSuccess(`✓ Clase cancelada. ${cancelled} reserva(s) cancelada(s) y ${notified} estudiante(s) notificado(s).`);
      await loadData();
    } catch (error) {
      console.error("Error al cancelar la clase:", error);
      showError(error.response?.data?.error || "Error al cancelar la clase. Intenta nuevamente.");
    } finally {
      setUpdatingReserve(null);
    }
  };

  const goToTab = (tab) => setSearchParams(tab === 'inicio' ? {} : { tab });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-10 w-10 animate-spin text-alma-olive" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl px-4 py-8 md:px-8">
      {activeTab === 'inicio' && (
        <ProfessorHomeTab
          firstName={firstName}
          now={now}
          todayClasses={todayClasses}
          todayReserveCount={todayReserveCount}
          todayDebtCount={todayDebtCount}
          getClassReserves={getClassReserves}
          onGoToTab={goToTab}
        />
      )}

      {activeTab === 'clases' && (
        <ProfessorClassesTab
          todayClasses={todayClasses}
          getClassReserves={getClassReserves}
          getHydratedStudent={getHydratedStudent}
          updatingReserve={updatingReserve}
          onMarkAttendance={handleMarkAttendance}
          onCancelClass={handleCancelClass}
        />
      )}

      {activeTab === 'horas' && (
        <ProfessorHoursTab
          now={now}
          monthClasses={monthClasses}
          monthHours={monthHours}
          weekClasses={weekClasses}
          weekHours={weekHours}
        />
      )}

      {activeTab === 'alumnos' && (
        <ProfessorStudentsTab
          studentSearch={studentSearch}
          onStudentSearchChange={setStudentSearch}
          filteredStudents={filteredStudents}
        />
      )}

      <ProfessorMobileTabs activeTab={activeTab} onGoToTab={goToTab} />
    </div>
  );
};

export default ProfessorDashboard;
