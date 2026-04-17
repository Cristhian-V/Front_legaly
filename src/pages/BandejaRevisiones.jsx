import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

// Importaciones de servicios
import userService from '../services/userService';
import casosService from '../services/casosService';

const BandejaRevisiones = () => {
  const navigate = useNavigate();
  const { casosPendientes } = useOutletContext();

  const [cargando, setCargando] = useState(!casosPendientes);
  const [casos_pendientes, setCasosPendientes] = useState(casosPendientes || []);
  // --- NUEVO ESTADO PARA PESTAÑAS ---
  const [pestañaActiva, setPestañaActiva] = useState('pendientes'); // 'pendientes' o 'en_revision'

  // Si entró por el menú lateral (no hay datos previos), hacemos la petición al backend
  const RecargaCasosPendientes = async () => {
    try {
      const data = await userService.obtenerCasosPendientes();
      setCasosPendientes(data);
      setCargando(false);
    } catch (error) {
      console.error("Error al cargar revisiones:", error);
      setCargando(false);
    }
  };

  useEffect(() => {
  }, [casosPendientes]);

  // Función para formatear la fecha de forma amigable
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';

    const fecha = new Date(fechaISO);
    const hoy = new Date();

    const esHoy =
      fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear();

    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const horaTexto = `${horas}:${minutos}`;

    if (esHoy) {
      return `Hoy, ${horaTexto}`;
    } else {
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const anio = fecha.getFullYear();
      return `${dia}/${mes}/${anio}, ${horaTexto} Hrs.`;
    }
  };

  // --- FUNCIÓN PARA INICIAR LA REVISIÓN ---
  // Ahora recibe el objeto 'revision' completo para poder evaluar su estado actual
  const handleEvaluar = async (revision) => {
    try {
      // Si está pendiente (1), iniciamos la revisión en el backend
      if (revision.estado_id === 1) {
        const response = await casosService.revisarCaso(revision.revision_id); 
        console.log("Revisión iniciada con éxito:", response);
        RecargaCasosPendientes(); // Recargamos la lista para actualizar el estado de la revisión
        navigate(`/expedientes/${response.expediente_id || revision.expediente_id}`);
      } else {
        // Si ya está en revisión (4), solo lo redirigimos al expediente sin hacer PATCH
        navigate(`/expedientes/${revision.expediente_id}`);
      }
    } catch (error) {
      console.error("Error al iniciar la revisión:", error);
      alert("Hubo un problema al intentar abrir la revisión. Por favor intenta nuevamente.");
    }
  };

  // --- LÓGICA DE FILTRADO PARA PESTAÑAS ---
  // Extraemos el array (asegurándonos de que no sea undefined)
  const listaCompleta = casos_pendientes?.pendientes || [];

  // Filtramos dependiendo de la pestaña
  
  const revisionesFiltradas = listaCompleta.filter(rev => {
    // NOTA: Cambia "estado_id" por el nombre exacto de la propiedad en tu base de datos si es distinto
    if (pestañaActiva === 'pendientes') return rev.estado_id === 1;
    if (pestañaActiva === 'en_revision') return rev.estado_id === 4;
    return true;
  });

  if (cargando) return <div className="p-20 text-center animate-pulse text-gray-500">Cargando bandeja de revisiones...</div>;

  return (
    <main className="p-8 max-w-7xl mx-auto">

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#080E21] mb-2">Bandeja de Revisiones</h1>
        <p className="text-gray-600">Gestiona y evalúa las solicitudes de revisión enviadas por tu equipo.</p>
      </div>

      {/* Contenedor de la Bandeja */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

        {/* --- PESTAÑAS (TABS) --- */}
        <div className="border-b border-gray-200 flex gap-8 px-6 pt-6 bg-gray-50/50">
          <button 
            onClick={() => setPestañaActiva('pendientes')} 
            className={`pb-4 px-2 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${pestañaActiva === 'pendientes' ? 'border-[#080E21] text-[#080E21]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Pendientes de Revisión
            <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
              {listaCompleta.filter(r => r.estado_id === 1).length}
            </span>
          </button>
          
          <button 
            onClick={() => setPestañaActiva('en_revision')} 
            className={`pb-4 px-2 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${pestañaActiva === 'en_revision' ? 'border-[#080E21] text-[#080E21]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            En Revisión (Progreso)
            <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
              {listaCompleta.filter(r => r.estado_id === 4).length}
            </span>
          </button>
        </div>

        {revisionesFiltradas.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl mb-4 grayscale opacity-50 block">📭</span>
            <h3 className="text-xl font-bold text-[#080E21] mb-2">Bandeja Limpia</h3>
            <p className="text-gray-500">
              {pestañaActiva === 'pendientes' 
                ? 'No tienes ninguna solicitud de revisión pendiente en este momento.' 
                : 'Actualmente no tienes ningún caso marcado "En Revisión".'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Caso / Expediente</th>
                  <th className="p-4 font-semibold">Solicitado Por</th>
                  <th className="p-4 font-semibold">Fecha de Solicitud</th>
                  <th className="p-4 font-semibold text-center">Prioridad</th>
                  <th className="p-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* AHORA ITERAMOS SOBRE 'revisionesFiltradas' */}
                {revisionesFiltradas.map((revision, index) => (
                  <tr key={index} className="hover:bg-blue-50/50 transition-colors group">

                    <td className="p-4">
                      <p className="text-sm font-bold text-[#080E21]">{revision.descripcion_corta || 'Título del Caso'}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{revision.expediente_id || 'EXP-000'}</p>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{revision.solicitado_por || 'Abogado Junior'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-gray-600">
                      {formatearFecha(revision.fecha_envio)}
                    </td>

                    <td className="p-4 text-center">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                        Alta
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      {/* PASAMOS EL OBJETO COMPLETO PARA VALIDAR SU ESTADO */}
                      <button                      
                        onClick={() => handleEvaluar(revision)}
                        className={`${
                          pestañaActiva === 'pendientes' 
                            ? 'bg-[#212A3E] hover:bg-slate-800' 
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        } text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm transition-colors`}
                      >
                        {pestañaActiva === 'pendientes' ? 'Evaluar' : 'Continuar Revisión'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
};

export default BandejaRevisiones;