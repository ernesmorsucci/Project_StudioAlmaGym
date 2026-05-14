import React from 'react';
import { Calendar, CheckCircle, Clock, Users } from 'lucide-react';

const links = [
  ['inicio', Calendar, 'Inicio'],
  ['clases', CheckCircle, 'Mis clases'],
  ['horas', Clock, 'Horas'],
  ['alumnos', Users, 'Alumnos'],
];

const ProfessorMobileTabs = ({ activeTab, onGoToTab }) => (
  <div className="mt-12 flex flex-wrap gap-3 md:hidden">
    {links.map(([tab, Icon, label]) => (
      <button
        key={tab}
        onClick={() => onGoToTab(tab)}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${
          activeTab === tab ? 'bg-alma-olive text-white' : 'bg-white text-alma-text border border-alma-border'
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    ))}
  </div>
);

export default ProfessorMobileTabs;
