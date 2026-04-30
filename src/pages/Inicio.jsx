import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

// Importamos los servicios
import authService from '../services/authService';
import userService from '../services/userService';
import calendarioService from '../services/calendarioService';

// Importación de imágenes 
import iconCasos from '../image/IconCasos.png';
import iconAudiencias from '../image/IconAdiencias.png';
import iconRevisar from '../image/IconRevisar.png';

const Inicio = () => {
  const navigate = useNavigate();

  // Estados para manejar la información del usuario
  const [datosUsuario, setDatosUsuario] = useState({});
  const [eventos, setEventos] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const { casosPendientes } = useOutletContext();

  // ESTADOS DEL CALENDARIO
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  const autenticado = async () => {
    const esAuth = await authService.isAuthenticated();
    if (!esAuth) navigate('/login');
  };

  const cargarDatosDelDashboard = async () => {
    try {
      // Ejecutamos las peticiones al backend
      const [respuestaPerfil, respuestaCasos, respuestaEventos] = await Promise.all([
        userService.obtenerPerfil(),
        userService.obtenerCasos(),
        calendarioService.obtenerEventos() 
      ]);

      setDatosUsuario({
        user: respuestaPerfil.dataUsuario,
        casos: respuestaCasos
      });

      // Guardamos los eventos reales
      setEventos(respuestaEventos);

    } catch (error) {
      console.error("Error al cargar los datos del panel:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosDelDashboard();
    autenticado();
  }, []);

  const MAPPING_COLORES_EVENTO = {
    audiencia: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-l-4 border-red-500' },
    plazo: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-l-4 border-yellow-500' },
    reunion: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-l-4 border-green-500' },
    doc: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-l-4 border-blue-500' },
  };

  // --- FUNCIONES AUXILIARES PARA EL CALENDARIO ---

  // Extrae la hora en formato HH:mm de un string ISO
  const formatearHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Filtra los eventos del estado 'eventos' por la fecha proporcionada
  const obtenerEventosDelDia = (fechaCalendario) => {
    return eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha_hora);
      return (
        fechaEvento.getDate() === fechaCalendario.getDate() &&
        fechaEvento.getMonth() === fechaCalendario.getMonth() &&
        fechaEvento.getFullYear() === fechaCalendario.getFullYear()
      );
    }).sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
  };

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080E21]">
        <h2 className="text-white text-2xl animate-pulse">Cargando Panel de Control...</h2>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div onClick={() => navigate('/expedientes')} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-600 hover:shadow-2xl transition-all cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-bold uppercase">Casos Activos</h3>
              <p className="text-4xl font-black text-gray-800 mt-2">{datosUsuario?.casos?.resumen?.casosActivos || 0}</p>
            </div>
            <img src={iconCasos} alt="Casos" width="70" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 hover:shadow-2xl transition-all cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-bold uppercase">Audiencias / Plazos</h3>
              <p className="text-4xl font-black text-gray-800 mt-2">{datosUsuario?.casos?.resumen?.eventosActivos || 0}</p>
            </div>
            <img src={iconAudiencias} alt="Eventos" width="70" />
          </div>
        </div>

        <div onClick={() => navigate('/revisiones')} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#A52019] hover:shadow-2xl transition-all cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-bold uppercase">Revisiones Pendientes</h3>
              <p className="text-4xl font-black text-gray-800 mt-2">{casosPendientes?.casos_pendientes || 0}</p>
            </div>
            <img src={iconRevisar} alt="Revisar" width="70" />
          </div>
        </div>
      </div>

      {/* SECCIÓN DEL CALENDARIO */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-[#080E21] mb-6">Agenda y Vencimientos</h3>

        <div className={`grid gap-6 ${diaSeleccionado ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Calendario Grid */}
          <div className={`${diaSeleccionado ? 'md:col-span-2' : ''}`}>
            <div className="grid grid-cols-7 gap-px mb-px bg-gray-100 rounded-t-lg border-t border-x">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
                <div key={dia} className="p-3 text-center text-xs font-semibold text-gray-500 uppercase">{dia}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-b-lg overflow-hidden">
              {Array.from({ length: 28 }).map((_, index) => {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - 9 + index);
                const esHoy = index === 9;
                const eventosDia = obtenerEventosDelDia(fecha);

                return (
                  <div
                    key={index}
                    className={`bg-white p-2 min-h-[180px] transition-all cursor-pointer hover:bg-gray-50 ${esHoy ? 'bg-blue-50' : ''} ${diaSeleccionado?.fecha.getTime() === fecha.getTime() ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                    onClick={() => setDiaSeleccionado({ fecha, eventos: eventosDia })}
                  >
                    <div className="flex mb-2">
                      {esHoy ? (
                        <div className="h-7 w-7 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                          {fecha.getDate()}
                        </div>
                      ) : (
                        <span className={`text-sm font-bold ${fecha.getMonth() === new Date().getMonth() ? 'text-gray-800' : 'text-gray-400'}`}>
                          {fecha.getDate()}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[120px]">
                      {eventosDia.map((ev, i) => (
                        <div key={i} className={`${MAPPING_COLORES_EVENTO[ev.tipo_evento]?.bg} ${MAPPING_COLORES_EVENTO[ev.tipo_evento]?.text} ${MAPPING_COLORES_EVENTO[ev.tipo_evento]?.border} p-1 rounded text-[10px] truncate shadow-sm`}>
                          <span className="font-bold">{formatearHora(ev.fecha_hora)}</span> {ev.titulo}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel Detallado */}
          {diaSeleccionado && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col h-full animate-fade-in-right">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="text-right">
                  <h4 className="text-xl font-black text-[#080E21] capitalize">{diaSeleccionado.fecha.toLocaleDateString('es-ES', { weekday: 'long' })}</h4>
                  <p className="text-gray-600">{diaSeleccionado.fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                </div>
                <button onClick={() => setDiaSeleccionado(null)} className="text-gray-400 hover:text-gray-700 bg-white h-8 w-8 rounded-full shadow flex items-center justify-center">×</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {diaSeleccionado.eventos.length > 0 ? (
                  diaSeleccionado.eventos.map((ev, i) => (
                    <div key={i} className={`bg-white p-4 rounded-lg shadow border-l-4 ${MAPPING_COLORES_EVENTO[ev.tipo_evento]?.border.split(' ')[2]}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`${MAPPING_COLORES_EVENTO[ev.tipo_evento]?.bg} ${MAPPING_COLORES_EVENTO[ev.tipo_evento]?.text} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>
                          {ev.tipo_evento}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{formatearHora(ev.fecha_hora)}</span>
                      </div>
                      <h6 className="text-sm font-semibold text-gray-900 mb-1">{ev.titulo}</h6>
                      <p className="text-xs text-gray-600 line-clamp-3">{ev.descripcion}</p>
                      <p className="text-[10px] text-blue-600 mt-2 font-mono uppercase">{ev.expediente_id}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
                    <span className="text-4xl block mb-2">😌</span>
                    <p className="text-sm text-gray-500 font-medium">Día sin compromisos</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Inicio;