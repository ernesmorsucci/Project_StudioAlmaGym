import React from 'react';
import { StatCard } from './ProfessorShared';
import { formatDate, formatTime, getClassHours, monthFormatter } from './professorDashboardUtils';

const ProfessorHoursTab = ({ now, monthClasses, monthHours, weekClasses, weekHours }) => (
  <section className="max-w-4xl animate-fade-in">
    <h1 className="font-serif text-4xl text-alma-text md:text-5xl">Horas trabajadas</h1>

    <div className="mt-10 grid gap-5 md:grid-cols-3">
      <StatCard title="Este mes" value={`${monthHours}hs`} detail={monthFormatter.format(now)} />
      <StatCard
        title="Clases dadas"
        value={monthClasses.length}
        detail={`${monthClasses.length ? (monthHours / monthClasses.length).toFixed(1) : 0}hs promedio`}
      />
      <StatCard title="Esta semana" value={`${weekHours}hs`} detail={`${weekClasses.length} clases`} />
    </div>

    <div className="mt-8 rounded-xl border border-alma-border bg-white p-7 shadow-sm">
      <h2 className="text-xl font-semibold text-alma-text">Registro</h2>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-alma-border text-xs font-black uppercase tracking-[0.18em] text-[#A99C88]">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Clase</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">Horas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monthClasses.map((classItem) => (
              <tr key={classItem._id}>
                <td className="px-4 py-4">{formatDate(classItem.dateTime)}</td>
                <td className="px-4 py-4">{classItem.name}</td>
                <td className="px-4 py-4">{formatTime(classItem.dateTime)}</td>
                <td className="px-4 py-4">{formatTime(classItem.endTime)}</td>
                <td className="px-4 py-4">{getClassHours(classItem)}hs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default ProfessorHoursTab;
