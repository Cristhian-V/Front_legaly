import React, { useState } from 'react';
import TabUsuarios from '../components/configuracion/TabUsuarios';
// Más adelante importarás: import TabRoles from '../components/configuracion/TabRoles';

const Configuracion = () => {
  const [pestañaActiva, setPestañaActiva] = useState('usuarios');

  const tabStyle = (tab) =>
    `pb-4 px-4 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${
      pestañaActiva === tab ? 'border-[#080E21] text-[#080E21]' : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  return (
    <main className="p-8 max-w-7xl mx-auto">

      {/* Menú de Pestañas (Tabs) */}
      <div className="border-b border-gray-200 mb-8 flex gap-4 overflow-x-auto">
        <button onClick={() => setPestañaActiva('usuarios')} className={tabStyle('usuarios')}>
          👥 Usuarios y Accesos
        </button>
        <button onClick={() => setPestañaActiva('catalogos')} className={tabStyle('catalogos')}>
          🗂️ Catálogos Generales
        </button>
        <button onClick={() => setPestañaActiva('empresa')} className={tabStyle('empresa')}>
          🏢 Datos de la Firma
        </button>
      </div>

      {/* Contenido Dinámico según la Pestaña */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
        {pestañaActiva === 'usuarios' && <TabUsuarios />}
        {pestañaActiva === 'catalogos' && <div className="text-center py-20 text-gray-500">Módulo de Catálogos en construcción...</div>}
        {pestañaActiva === 'empresa' && <div className="text-center py-20 text-gray-500">Módulo de Empresa en construcción...</div>}
      </div>
    </main>
  );
};

export default Configuracion;