import React from 'react';
import { EmptyState, StatCard } from './ProfessorShared';
import { formatDate, formatTime } from './professorDashboardUtils';

const ProfessorHomeTab = ({
  firstName,
  now,
  todayClasses,
  todayReserveCount,
  todayDebtCount,
  getClassReserves,
  onGoToTab,
}) => (
  <section className="animate-fade-in">
    <h1 className="font-serif text-4xl text-alma-text md:text-5xl">Buenos días, {firstName}</h1>

    <div className="mt-12 grid gap-5 md:grid-cols-3">
      <StatCard
        title="Clases hoy"
        value={todayClasses.length}
        detail={todayClasses.map((classItem) => formatTime(classItem.dateTime)).join(' y ') || 'Sin clases hoy'}
      />
      <StatCard title="Alumnos hoy" value={todayReserveCount} detail="Inscriptos en tus clases" />
      <StatCard title="Deben cuota" value={todayDebtCount} detail="En tus clases de hoy" danger />
    </div>

    <div className="mt-8 rounded-xl border border-alma-border bg-white p-7 shadow-sm">
      <h2 className="text-xl font-semibold text-alma-text">
        Clases de hoy
        <span className="ml-2 font-normal text-gray-500">- {formatDate(now)}</span>
      </h2>

      <div className="mt-6 space-y-4">
        {todayClasses.length === 0 ? (
          <EmptyState>No tenés clases programadas para hoy.</EmptyState>
        ) : (
          todayClasses.map((classItem, index) => {
            const reserves = getClassReserves(classItem._id);
            return (
              <div key={classItem._id} className="grid items-center gap-4 rounded-xl border border-alma-border p-5 md:grid-cols-[90px_1fr_140px_120px]">
                <p className="font-serif text-2xl text-alma-text">{formatTime(classItem.dateTime)}</p>
                <div>
                  <p className="font-bold text-gray-900">{classItem.name}</p>
                  <p className="text-sm text-[#6E5A48]">{reserves.length} alumnos inscriptos</p>
                </div>
                <span className="inline-flex w-max items-center gap-2 rounded-full bg-alma-olive/10 px-4 py-1.5 text-sm font-bold text-alma-olive">
                  <span className="h-1.5 w-1.5 rounded-full bg-alma-olive" />
                  {reserves.length}/{classItem.maxQuota || '-'}
                </span>
                <button
                  onClick={() => onGoToTab('clases')}
                  className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
                    index === 0 ? 'bg-alma-olive text-white hover:bg-alma-oliveHover' : 'bg-alma-bg text-alma-text hover:bg-alma-border'
                  }`}
                >
                  Ver lista
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  </section>
);

export default ProfessorHomeTab;
