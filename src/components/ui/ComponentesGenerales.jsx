// src/components/ui/ComponentesGenerales.jsx
//componentes atomicos que se usa en Detalle de Expedientes.
import React from 'react';

export const Badge = ({ text, color = 'blue' }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-bold ${color === 'green' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
    {text}
  </span>
);

export const InfoBox = ({ label, value, color = 'text-gray-600' }) => (
  <div>
    <h4 className="text-sm font-bold text-[#080E21] mb-1">{label}</h4>
    <p className={`text-sm ${color}`}>{value}</p>
  </div>
);

export const EmptyState = ({ icon, title, description, onAction, actionText = "Comenzar ahora" }) => (
  <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
    <div className="text-4xl mb-4">{icon}</div>
    <h4 className="font-bold mb-2 text-gray-800">{title}</h4>
    <p className="text-sm text-gray-500 mb-6">{description}</p>
    {onAction && <button onClick={onAction} className="border px-6 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors">{actionText}</button>}
  </div>
);

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
      <div className="bg-[#080E21] p-4 flex justify-between items-center">
        <h2 className="text-white font-bold">{title}</h2>
        <button type="button" onClick={onClose} className="text-white text-xl">&times;</button>
      </div>
      <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

export const Label = ({ text }) => <label className="block text-xs font-bold text-gray-700 mb-1">{text}</label>;
export const Input = ({ ...props }) => <input {...props} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" />;