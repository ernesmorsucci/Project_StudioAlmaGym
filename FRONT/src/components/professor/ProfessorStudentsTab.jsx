import React from 'react';
import { Search } from 'lucide-react';
import { getPlanLabel, getStatusLabel, getStudentId, getUsageLabel } from './professorDashboardUtils';

const ProfessorStudentsTab = ({ studentSearch, onStudentSearchChange, filteredStudents }) => (
  <section className="max-w-4xl animate-fade-in">
    <h1 className="font-serif text-4xl text-alma-text md:text-5xl">Alumnos</h1>

    <div className="relative mt-10 max-w-3xl">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      <input
        value={studentSearch}
        onChange={(event) => onStudentSearchChange(event.target.value)}
        placeholder="Buscar alumno..."
        className="w-full rounded-lg border border-alma-border bg-white py-4 pl-14 pr-5 text-gray-700 outline-none transition focus:ring-2 focus:ring-alma-olive/30"
      />
    </div>

    <div className="mt-5 rounded-xl border border-alma-border bg-white p-7 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-alma-border text-xs font-black uppercase tracking-[0.18em] text-[#A99C88]">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Clases semana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-400">No hay alumnos para mostrar.</td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const debt = getStatusLabel(student) === 'Debe cuota';
                return (
                  <tr key={getStudentId(student)}>
                    <td className="px-4 py-4 font-medium text-gray-900">{student.name || 'Alumno sin nombre'}</td>
                    <td className="px-4 py-4">{getPlanLabel(student)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${debt ? 'bg-red-50 text-red-600' : 'bg-alma-olive/10 text-alma-olive'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${debt ? 'bg-red-500' : 'bg-alma-olive'}`} />
                        {getStatusLabel(student)}
                      </span>
                    </td>
                    <td className="px-4 py-4">{getUsageLabel(student)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default ProfessorStudentsTab;
