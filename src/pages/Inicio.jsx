import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';

// Importamos el servicio
import authService from '../services/authService';
import userService from '../services/userService';

// 1. Importación de imágenes 
import iconCasos from '../image/IconCasos.png';
import iconAudiencias from '../image/IconAdiencias.png';
import iconDocs from '../image/IconDocPendientes.png';
import iconRevisar from '../image/IconRevisar.png';

// --- DATOS SIMULADOS DE EVENTOS ---
// En el futuro, esto vendrá de userService.obtenerEventos()
const EVENTOS_SIMULADOS = [
  { fecha: new Date(new Date().setDate(new Date().getDate() + 1)), hora: '09:00', tipo: 'audiencia', titulo: 'Audiencia de Pruebas - Caso 2024-001', descripcion: 'Presentación de testigos clave en el juzgado de familia.' },
  { fecha: new Date(), hora: '11:30', tipo: 'reunion', titulo: 'Reunión con Cliente PYME S.A.', descripcion: 'Revisión de cláusulas del contrato de fusión.' },
  { fecha: new Date(), hora: '16:00', tipo: 'plazo', titulo: 'Vencimiento Plazo Memorial', descripcion: 'Enviar memorial de apelación al tribunal administrativo.' },
  { fecha: new Date(), hora: '16:00', tipo: 'plazo', titulo: 'Vencimiento Plazo Memorial', descripcion: 'Enviar memorial de apelación al tribunal administrativo.' },
  { fecha: new Date(), hora: '16:00', tipo: 'plazo', titulo: 'Vencimiento Plazo Memorial', descripcion: 'Enviar memorial de apelación al tribunal administrativo.' },
  { fecha: new Date(), hora: '16:00', tipo: 'plazo', titulo: 'Vencimiento Plazo Memorial', descripcion: 'Enviar memorial de apelación al tribunal administrativo.' },
  { fecha: new Date(), hora: '11:30', tipo: 'reunion', titulo: 'Reunión con Cliente PYME S.A.', descripcion: 'Revisión de cláusulas del contrato de fusión.' },
  { fecha: new Date(), hora: '16:00', tipo: 'plazo', titulo: 'Vencimiento Plazo Memorial', descripcion: 'Enviar memorial de apelación al tribunal administrativo.' },
  { fecha: new Date(new Date().setDate(new Date().getDate() + 6)), hora: '10:00', tipo: 'doc', titulo: 'Lectura de Expediente - Cliente García', descripcion: 'Análisis de la nueva documentación recibida.' },
  { fecha: new Date(new Date().setDate(new Date().getDate() - 3)), hora: '14:30', tipo: 'audiencia', titulo: 'Audiencia Conciliación (Pasada)', descripcion: 'Audiencia de conciliación en el Centro de Arbitraje.' },
];



const Inicio = () => {
  const navigate = useNavigate();


  // 9. Estados para manejar la información del usuario
  const [datosUsuario, setDatosUsuario] = useState({});
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const {  casosPendientes } = useOutletContext();


  // --- ESTADOS DEL CALENDARIO ---
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // Día expandido

  const autenticado = async () => {
    const esAuth = await authService.isAuthenticated();
    if (!esAuth) {
      console.log("Usuario no autenticado, redirigiendo al login...");
      navigate('/login');
    }
  };

  const cargarDatosDelDashboard = async () => {
    try {
      // Promise.all ejecuta ambas peticiones al mismo tiempo y espera a que LAS DOS terminen
      const [respuestaPerfil, respuestaCasos, respuestaEventos] = await Promise.all([
        userService.obtenerPerfil(),
        userService.obtenerCasos(),
        userService.obtenerEventos()
      ]);

      // Guardamos todo de golpe en el estado
      setDatosUsuario({
        user: respuestaPerfil.dataUsuario,
        casos: respuestaCasos
      });

      setEventos(respuestaEventos);

    } catch (error) {
      console.error("Error al cargar los datos del panel:", error);
    } finally {
      // Solo quitamos la pantalla de carga cuando ya tenemos TANTO el perfil COMO los casos
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

  // Función auxiliar para filtrar eventos por fecha
  const obtenerEventosDelDia = (fecha) => {
    return EVENTOS_SIMULADOS.filter(evento =>
      evento.fecha.getDate() === fecha.getDate() &&
      evento.fecha.getMonth() === fecha.getMonth() &&
      evento.fecha.getFullYear() === fecha.getFullYear()
    ).sort((a, b) => a.hora.localeCompare(b.hora)); // Ordenamos por hora
  };

  // 5. Mostrar una pantalla de carga mientras llegan los datos
  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080E21]">
        <h2 className="text-white text-2xl animate-pulse">Cargando Panel de Control...</h2>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

        {/* 6. Tarjeta: Casos Activos */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-bold uppercase">Casos Activos</h3>
              <p className="text-4xl font-black text-gray-800 mt-2">{datosUsuario?.casos.resumen.casosActivos}</p>
            </div>
            <img src={iconCasos} alt="Icono Casos" width="70" height="70"/>
          </div>
        </div>

        {/* 7. Tarjeta: Audiencias / Plazos */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-bold uppercase">Audiencias / Plazos</h3>
              <p className="text-4xl font-black text-gray-800 mt-2">{datosUsuario?.casos.resumen.eventosActivos}</p>
            </div>
            <img src={iconAudiencias} alt="Icono Audiencias" width="70" height="70"/>
          </div>
        </div>

        {/* 8. Tarjeta: Doc Recibidos */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#9333EA] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-bold uppercase">Doc Recibidos</h3>
              <p className="text-4xl font-black text-gray-800 mt-2">esperando</p>
            </div>
            <div>
              <img src={iconDocs} alt="Icono Documentos" width="70" height="70"/>
            </div>
          </div>
        </div>

                {/* 8. Tarjeta: Revisiones pendientes por el usuario */}
        <div onClick={() => navigate('/revisiones')}
        className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#A52019] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-bold uppercase">Casos Pendientes de Revisar </h3>
              {console.log("Casos Pendientes en el render:", casosPendientes)}
              <p className="text-4xl font-black text-gray-800 mt-2">{casosPendientes?.casos_pendientes}</p>
            </div>
            <div>
              <img src={iconRevisar} alt="Icono Revisar" width="70" height="70" />
            </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DEL CALENDARIO INTERACTIVO --- */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#080E21]">Agenda y Vencimientos</h3>
        </div>

        {/* El grid principal del calendario y el panel de detalles */}
        <div className={`grid gap-6 ${diaSeleccionado ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>

          {/* Contenedor del Calendario Grid (Izquierda) */}
          <div className={`${diaSeleccionado ? 'md:col-span-2' : ''}`}>

            {/* Cabecera de días (Fija Lunes a Domingo) */}
            <div className="grid grid-cols-7 gap-px mb-px bg-gray-100 rounded-t-lg border-t border-x border-gray-100">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => (
                <div key={dia} className="p-3 text-center text-xs font-semibold text-gray-500 uppercase">
                  {dia}
                </div>
              ))}
            </div>

            {/* Cuadrícula del Calendario (Estilo image_3.png con bordes finos) */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-b-lg overflow-hidden">
              {Array.from({ length: 28 }).map((_, index) => {
                // Lógica de ventana deslizante de 28 días, Hoy índice 9
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - 9 + index);
                const esHoy = index === 9;
                const esMesActual = fecha.getMonth() === new Date().getMonth();

                const eventosDia = obtenerEventosDelDia(fecha);

                return (
                  <div
                    key={index}
                    className={`bg-white p-2 min-h-[200px] relative transition-all duration-300 cursor-pointer group ${esHoy ? 'bg-blue-50' : ''
                      } hover:bg-gray-50 ${diaSeleccionado && diaSeleccionado.fecha.getTime() === fecha.getTime() ? 'ring-2 ring-blue-500 ring-inset shadow-xl' : ''
                      }`}
                    onClick={() => setDiaSeleccionado({ fecha, eventos: eventosDia })}
                  >
                    {/* Número del día */}
                    <div className="flex justify-start items-start mb-2">
                      {esHoy ? (
                        <div className="h-8 w-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-lg shadow-md">
                          {fecha.getDate()}
                        </div>
                      ) : (
                        <span className={`text-lg font-bold ${esMesActual ? 'text-gray-800' : 'text-gray-400'}`}>
                          {fecha.getDate()}
                        </span>
                      )}
                    </div>

                    {/* Lista de eventos del día */}
                    <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
                      {eventosDia.map((evento, evtIdx) => {
                        const estilos = MAPPING_COLORES_EVENTO[evento.tipo];
                        return (
                          <div
                            key={evtIdx}
                            className={`${estilos.bg} ${estilos.text} ${estilos.border} p-1.5 rounded text-xs flex items-center gap-1.5 shadow-sm transition group-hover:shadow-md`}
                          >
                            <span className="font-semibold">{evento.hora}</span>
                            <span className="truncate">{evento.titulo}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contenedor del Panel Detallado (Derecha - Condicional) */}
          {diaSeleccionado && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-inner flex flex-col h-full animate-fade-in-right">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="text-right">
                  <h4 className="text-2xl font-black text-[#080E21]">
                    {diaSeleccionado.fecha.toLocaleDateString('es-ES', { weekday: 'long' })}
                  </h4>
                  <p className="text-gray-600 font-medium">
                    {diaSeleccionado.fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <button
                  onClick={() => setDiaSeleccionado(null)}
                  className="text-gray-400 hover:text-gray-700 bg-white h-10 w-10 rounded-full flex items-center justify-center transition shadow hover:shadow-md"
                >
                  <span className="text-2xl font-light">×</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {diaSeleccionado.eventos.length > 0 ? (
                  <div className="space-y-5">
                    <h5 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Eventos del día</h5>
                    {diaSeleccionado.eventos.map((evento, index) => {
                      const estilos = MAPPING_COLORES_EVENTO[evento.tipo];
                      return (
                        <div key={index} className={`bg-white p-5 rounded-lg shadow border-l-4 ${estilos.border.split(' ')[2]} flex flex-col`}>
                          <div className="flex justify-between items-center mb-3">
                            <span className={`${estilos.bg} ${estilos.text} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
                              {evento.tipo}
                              22:34:44</span>
                            <span className="text-lg font-bold text-gray-800">{evento.hora}</span>
                          </div>
                          <h6 className="text-base font-semibold text-gray-800 mb-2">{evento.titulo}</h6>
                          <p className="text-sm text-gray-600 font-light">{evento.descripcion}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col h-full items-center justify-center text-center py-12 bg-white rounded-lg border border-gray-100">
                    <span className="text-6xl mb-4">😌</span>
                    <h5 className="text-lg font-bold text-gray-800">Día tranquilo</h5>
                    <p className="text-sm text-gray-500 max-w-xs mt-1">No hay audiencias, plazos ni reuniones programadas para este día.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Leyenda del calendario */}
        <div className="mt-8 flex space-x-5 text-xs text-gray-500 justify-center border-t pt-6">
          <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></div> Audiencia</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5"></div> Plazo Vence</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></div> Reunión</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></div> Lectura/Doc</div>
        </div>
      </div>
    </main>
  );
};

export default Inicio;