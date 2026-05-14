import api from '../../services/api';

export const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

export const monthFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
});

export const sameDay = (dateA, dateB) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

export const startOfWeek = (date) => {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day + 1);
  return copy;
};

export const getUserId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return value._id || value.id || '';
  return value;
};

export const getReserveStudent = (reserve) => {
  const student = reserve.studentId || reserve.student || reserve.userId || {};
  return typeof student === 'object' ? student : { _id: student };
};

export const getStudentId = (student) => student?._id || student?.id || '';

export const formatTime = (value) => {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (value) => {
  const label = dateFormatter.format(new Date(value)).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const getClassHours = (classItem) => {
  const start = new Date(classItem.dateTime);
  const end = new Date(classItem.endTime || classItem.dateTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max((end - start) / (1000 * 60 * 60), 1);
};

export const getStatusLabel = (student) => {
  const status = student?.status || student?.membership?.status || 'Sin plan';
  if (status === 'Al día' || status === 'Vence pronto') return 'Al día';
  if (status === 'Vencida' || status === 'Sin plan') return 'Debe cuota';
  return status;
};

export const getPlanLabel = (student) =>
  student?.plan || student?.membership?.planName || student?.planName || 'Sin plan';

export const getUsageLabel = (student) => {
  if (student?.usage) return student.usage;
  const used = student?.membership?.usedClasses;
  const total = student?.membership?.totalClasses;
  if (Number.isFinite(used) && Number.isFinite(total)) return `${used}/${total}`;
  return '-';
};

export const normalizeProfessorTab = (tab) => {
  const aliases = {
    home: 'inicio',
    dashboard: 'inicio',
    'mis-clases': 'clases',
    classes: 'clases',
    hours: 'horas',
    'horas-trabajadas': 'horas',
    students: 'alumnos',
  };

  return aliases[tab] || tab || 'inicio';
};

export const markReserveStatus = async (reserveId, status) => {
  const payload = { status };
  const attempts = [
    () => api.patch(`/reserves/${reserveId}/status`, payload),
    () => api.patch(`/reserves/${reserveId}`, payload),
    () => api.put(`/reserves/${reserveId}/status`, payload),
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (![404, 405].includes(error.response?.status)) break;
    }
  }
  throw lastError;
};
