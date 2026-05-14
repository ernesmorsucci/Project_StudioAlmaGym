import React from 'react';

export const StatCard = ({ title, value, detail, danger }) => (
  <div className={`bg-white border border-alma-border rounded-xl p-7 shadow-sm ${danger ? 'border-l-4 border-l-red-500' : ''}`}>
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A99C88]">{title}</p>
    <p className="mt-6 text-4xl font-serif text-alma-text leading-none">{value}</p>
    {detail && <p className="mt-4 text-sm text-[#6E5A48]">{detail}</p>}
  </div>
);

export const EmptyState = ({ children }) => (
  <div className="bg-white border border-dashed border-alma-border rounded-xl p-10 text-center text-gray-400">
    {children}
  </div>
);
