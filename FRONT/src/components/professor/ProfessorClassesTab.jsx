import React from 'react';
// Antes: import { Check, Loader, X } from 'lucide-react';
import { Check, Loader, X, Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
import { EmptyState } from './ProfessorShared';
import { formatDate, formatTime, getPlanLabel, getStatusLabel } from './professorDashboardUtils';

const ProfessorClassesTab = ({
  todayClasses,
  getClassReserves,
  getHydratedStudent,
  updatingReserve,
  onMarkAttendance,
  onCancelClass,
}) => (
  <section className="max-w-3xl animate-fade-in">
    <h1 className="font-serif text-4xl text-alma-text md:text-5xl">Mis clases</h1>

    <div className="mt-10 space-y-5">
      {todayClasses.length === 0 ? (
        <EmptyState>No tenés clases para tomar asistencia hoy.</EmptyState>
      ) : (
        todayClasses.map((classItem) => {
          const reserves = getClassReserves(classItem._id);
          return (
            <article key={classItem._id} className="rounded-xl border border-alma-border bg-white p-7 shadow-sm">
              {/* 🔥 NUEVO ENCABEZADO CON DISEÑO MODERNO 🔥 */}
              <div className="mb-6 flex flex-col justify-between gap-4 border-b border-alma-border/50 pb-5 sm:flex-row sm:items-center">
                {/* Izquierda: Nombre, Fecha y Hora */}
                <div>
                  <h2 className="font-serif text-2xl text-alma-text md:text-3xl">
                    {classItem.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-alma-textLight">
                    <span className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700">
                      <Calendar className="h-4 w-4 text-alma-olive" />
                      {formatDate(classItem.dateTime)}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700">
                      <Clock className="h-4 w-4 text-alma-olive" />
                      {formatTime(classItem.dateTime)}
                    </span>
                  </div>
                </div>

                {/* Derecha: Contador de Cupos + Botón Cancelar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex w-fit items-center gap-2 rounded-xl bg-alma-bg px-4 py-2.5 text-alma-olive border border-alma-olive/20 shadow-sm">
                    <Users className="h-5 w-5" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">{reserves.length}</span>
                      <span className="text-sm font-medium opacity-80">/ {classItem.maxQuota || '-'} alumnos</span>
                    </div>
                  </div>
                  
                  {/* 🔥 BOTÓN CANCELAR CLASE */}
                  <button
                    onClick={() => onCancelClass(classItem)}
                    disabled={Boolean(updatingReserve?.startsWith('cancel'))}
                    title="Cancelar esta clase"
                    className="flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 border border-red-300 text-red-600 font-bold text-sm transition-all hover:bg-red-100 disabled:opacity-50"
                  >
                    {updatingReserve === `cancel-${classItem._id}` ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        Cancelar Clase
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-7 divide-y divide-alma-border/80">
                {reserves.length === 0 ? (
                  <p className="py-6 text-sm text-gray-400">Todavía no hay alumnos inscriptos.</p>
                ) : (
                  reserves.map((reserve) => {
                    const student = getHydratedStudent(reserve);
                    const reserveId = reserve._id || reserve.id;
                    const debt = getStatusLabel(student) === 'Debe cuota';
                    return (
                      <div key={reserveId} className="flex items-center justify-between gap-4 py-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-medium text-gray-900">{student.name || 'Alumno sin nombre'}</p>
                            {debt && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                Debe cuota
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-[#6E5A48]">
                            {getPlanLabel(student)} - {student.status || getStatusLabel(student)}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-3">
                          <button
                            onClick={() => onMarkAttendance(reserveId, 'attended')}
                            disabled={Boolean(updatingReserve)}
                            title="Marcar presente"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-green-300 text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50"
                          >
                            {updatingReserve === `${reserveId}-attended` ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => onMarkAttendance(reserveId, 'absent')}
                            disabled={Boolean(updatingReserve)}
                            title="Marcar ausente"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-alma-border text-gray-900 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            {updatingReserve === `${reserveId}-absent` ? <Loader className="h-4 w-4 animate-spin" /> : <X className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          );
        })
      )}
    </div>
  </section>
);

export default ProfessorClassesTab;
