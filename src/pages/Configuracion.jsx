import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TabUsuarios from '../components/configuracion/TabUsuarios';
import TabCatalogos from '../components/configuracion/TabCatalogos';

const Configuracion = () => {
  const [pestañaActiva, setPestañaActiva] = useState('usuarios');
    const {  datosUsuario } = useOutletContext() || {};

  const tabStyle = (tab) =>
    `pb-4 px-4 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${
      pestañaActiva === tab ? 'border-[#152844] text-[#152844]' : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  return (
    <main className="px-4 py-4 md:px-8 md:py-8 max-w-7xl mx-auto">

      {/* Menú de Pestañas (Tabs) */}
      <div className="border-b border-gray-200 mb-8 flex gap-4 overflow-x-auto">
        <button onClick={() => setPestañaActiva('usuarios')} className={tabStyle('usuarios')}>
          👥 Usuarios y Accesos
        </button>
        {datosUsuario?.rol === 'Abogado Socio' && (
        <button onClick={() => setPestañaActiva('catalogos')} className={tabStyle('catalogos')}>
          🗂️ Catálogos Generales
        </button>
        )}
      </div>

      {/* Contenido Dinámico según la Pestaña */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
        {pestañaActiva === 'usuarios' && <TabUsuarios />}
        {pestañaActiva === 'catalogos' && <TabCatalogos datosUsuario={datosUsuario}  />}
      </div>
    </main>
  );
};

export default Configuracion;