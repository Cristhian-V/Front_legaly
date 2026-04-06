import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import casosService from '../services/casosService';
import authService from '../services/authService';

const DetalleExpediente = () => {
  const { id } = useParams(); // Capturamos el ID de la URL
  const navigate = useNavigate();
  
  // Estado para manejar qué pestaña está activa
  const [pestañaActiva, setPestañaActiva] = useState('general');
  const [detalleCaso, setDetalleCaso] = useState({})

  const autenticado = async () => {
    const esAuth = await authService.isAuthenticated();
    if (!esAuth) {
      navigate('/login');
    }
  };

  const cargarDetalleCaso = async () => {
    try {
      // Promise.all ejecuta ambas peticiones al mismo tiempo y espera a que LAS DOS terminen
      const respuestaDetalleCaso = await (
        casosService.obtenerDetalleCaso(id)
      );
      console.log(respuestaDetalleCaso)
      setDetalleCaso(respuestaDetalleCaso);
      
    } catch (error) {
      console.error("Error al cargar los datos del caso:", error);
    } 
  };

  useEffect(() => {
    cargarDetalleCaso();
    autenticado();
  }, []);

  // Clases para las pestañas
  const tabStyle = "pb-4 px-2 font-semibold text-sm transition-colors cursor-pointer border-b-2 ";
  const activeTabStyle = tabStyle + "border-[#080E21] text-[#080E21]";
  const inactiveTabStyle = tabStyle + "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300";

  return (
    <main className="p-8 max-w-7xl mx-auto">
      
      {/* Botón Volver */}
      <button 
        onClick={() => navigate('/expedientes')}
        className="flex items-center text-gray-500 hover:text-[#080E21] font-medium text-sm mb-6 transition-colors"
      >
        <span className="mr-2">←</span> Volver a Casos
      </button>

      {/* Encabezado del Caso */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-600">
            {detalleCaso.caso?.categoria_cliente}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-600">
            {detalleCaso.caso?.expediente_id}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
            {detalleCaso.caso?.estado}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-[#080E21]">{detalleCaso.caso?.titulo} - {detalleCaso.caso?.nombre_cliente}</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition shadow-sm">
              Editar
            </button>
            <button className="px-4 py-2 bg-[#212A3E] text-white font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm">
              Acciones
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div className="border-b border-gray-200 mb-8 flex gap-8">
        <button 
          onClick={() => setPestañaActiva('general')}
          className={pestañaActiva === 'general' ? activeTabStyle : inactiveTabStyle}
        >
          Información General
        </button>
        <button 
          onClick={() => setPestañaActiva('documentos')}
          className={pestañaActiva === 'documentos' ? activeTabStyle : inactiveTabStyle}
        >
          Documentos (espera de conteto de documentos)
        </button>
        <button 
          onClick={() => setPestañaActiva('equipo')}
          className={pestañaActiva === 'equipo' ? activeTabStyle : inactiveTabStyle}
        >
          Equipo Legal
        </button>
        <button 
          onClick={() => setPestañaActiva('historial')}
          className={pestañaActiva === 'historial' ? activeTabStyle : inactiveTabStyle}
        >
          Historial y Actividad
        </button>
      </div>

      {/* Contenido de la Pestaña: Información General */}
      {pestañaActiva === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tarjeta Izquierda (Detalles principales) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#080E21] mb-4">Descripción del Caso</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {detalleCaso.caso?.descripcion}
              </p>
            </div>

            <hr className="border-gray-100 mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-4">
              <div>
                <h4 className="text-sm font-bold text-[#080E21] mb-1">Cliente</h4>
                <p className="text-gray-600">{detalleCaso.caso?.nombre_cliente}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#080E21] mb-1">Contraparte</h4>
                <p className="text-gray-600">{detalleCaso.caso?.contraparte}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#080E21] mb-1">Fecha de Inicio</h4>
                <p className="text-gray-600">{detalleCaso.caso?.fecha_inicio}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#080E21] mb-1">Vencimiento</h4>
                {/* En rojo simulando que es una fecha próxima/crítica */}
                <p className="text-red-500 font-semibold">Esperando fecha VEN</p>
              </div>
            </div>
          </div>

          {/* Tarjeta Derecha (Estado) */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-8 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-[#080E21] mb-6">Estado Actual</h3>
            
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-start gap-3 mb-8">
              <span className="text-gray-400 text-xl mt-0.5">🕒</span>
              <div>
                <h4 className="font-bold text-[#080E21] text-sm">esperando historial</h4>
                <p className="text-gray-500 text-xs mt-1">esperando historial</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Progreso estimado</span>
                <span className="text-sm font-bold text-[#080E21]">esperando detalle historial</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[#212A3E] h-2.5 rounded-full" 
                  style={{ width: `esperando historial` }}
                ></div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Aquí irían los otros contenidos según la pestaña activa */}
      {pestañaActiva === 'documentos' && <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">Sección de Documentos en construcción...</div>}
      {pestañaActiva === 'equipo' && <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">Sección de Equipo en construcción...</div>}
      {pestañaActiva === 'historial' && <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">Sección de Historial en construcción...</div>}

    </main>
  );
};

export default DetalleExpediente;