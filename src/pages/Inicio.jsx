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
  const { casosPendientes, catalogos, datosUsuario: usuarioPerfil } = useOutletContext();

  // ESTADOS DEL CALENDARIO
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  // ESTADOS DEL MODAL NUEVO EVENTO
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [usuariosArea, setUsuariosArea] = useState([]);
  const [formData, setFormData] = useState({
    titulo: '',
    fecha_hora: '',
    tipo_evento_id: '',
    descripcion: '',
    participantes_ids: []
  });

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

  const getColorEvento = (tipoEventoNombre) => {
    const tipo = catalogos?.catalogos?.tipos_evento?.find(t => t.nombre === tipoEventoNombre);
    const c = tipo?.color || '#9ca3af';
    return { dotBg: c, textColor: c, borderColor: c, bgColor: c + '1A' };
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

  // --- FUNCIONES DEL MODAL NUEVO EVENTO ---
  const abrirModal = async () => {
    setFormData({
      titulo: '',
      fecha_hora: '',
      tipo_evento_id: '',
      descripcion: '',
      participantes_ids: []
    });
    setIsModalOpen(true);
    try {
      const data = await userService.obtenerUsuariosPorArea();
      setUsuariosArea(data || []);
    } catch {
      setUsuariosArea([]);
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setUsuariosArea([]);
  };

  const toggleParticipante = (id) => {
    setFormData(prev => ({
      ...prev,
      participantes_ids: prev.participantes_ids.includes(id)
        ? prev.participantes_ids.filter(pid => pid !== id)
        : [...prev.participantes_ids, id]
    }));
  };

  const seleccionarTodos = () => {
    const ids = usuariosArea
      .filter(u => +u.id !== +usuarioPerfil?.id)
      .map(u => u.id);
    setFormData(prev => ({
      ...prev,
      participantes_ids: prev.participantes_ids.length === ids.length ? [] : ids
    }));
  };

  const toggleAreaUsuarios = (areaId) => {
    const idsArea = usuariosArea
      .filter(u => +u.id !== +usuarioPerfil?.id)
      .filter(u => u.areas_legales?.some(a => a.id === areaId))
      .map(u => u.id);
    const todosSeleccionados = idsArea.every(id => formData.participantes_ids.includes(id));
    setFormData(prev => ({
      ...prev,
      participantes_ids: todosSeleccionados
        ? prev.participantes_ids.filter(id => !idsArea.includes(id))
        : [...new Set([...prev.participantes_ids, ...idsArea])]
    }));
  };

  const getAreasAgrupadas = () => {
    const mapa = {};
    usuariosArea.forEach(user => {
      if (+user.id === +usuarioPerfil?.id) return;
      user.areas_legales?.forEach(area => {
        if (!mapa[area.id]) mapa[area.id] = { ...area, usuarios: 0 };
        mapa[area.id].usuarios++;
      });
    });
    return Object.values(mapa);
  };

  const handleCrearEvento = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.fecha_hora || !formData.tipo_evento_id) {
      alert("Completa los campos obligatorios: Título, Fecha/Hora y Tipo de Evento.");
      return;
    }
    try {
      setGuardando(true);
      await calendarioService.crearEventoUsuario(formData);
      cerrarModal();
      await cargarDatosDelDashboard();
    } catch (error) {
      alert("Error al crear el evento: " + (error.message || "Error de conexión"));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#152844]">
        <h2 className="text-white text-2xl animate-pulse">Cargando Panel de Control...</h2>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 md:px-8 md:py-8">
      {/* TARJETAS DE RESUMEN — barra unificada */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div onClick={() => navigate('/expedientes')} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition">
            <img src={iconCasos} alt="Casos" className="h-9 w-9 flex-shrink-0" />
            <div>
              <p className="text-2xl font-black text-gray-800 leading-none">{datosUsuario?.casos?.resumen?.casosActivos || 0}</p>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mt-1">Casos Activos</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4">
            <img src={iconAudiencias} alt="Eventos" className="h-9 w-9 flex-shrink-0" />
            <div>
              <p className="text-2xl font-black text-gray-800 leading-none">{datosUsuario?.casos?.resumen?.eventosActivos || 0}</p>
              <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mt-1">Fechas de Cierre</p>
            </div>
          </div>

          <div onClick={() => navigate('/revisiones')} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition">
            <img src={iconRevisar} alt="Revisar" className="h-9 w-9 flex-shrink-0" />
            <div>
              <p className="text-2xl font-black text-gray-800 leading-none">{casosPendientes?.casos_pendientes || 0}</p>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mt-1">Pendientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DEL CALENDARIO */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h3 className="text-xl font-bold text-[#152844]">Agenda y Fechas de Cierre</h3>
          <button
            onClick={abrirModal}
            className="bg-[#1E3A5F] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition flex items-center gap-2"
          >
            <span className="text-lg">+</span> Nuevo Evento
          </button>
        </div>

        <div className={`grid gap-6 ${diaSeleccionado ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Calendario Grid */}
          <div className={`${diaSeleccionado ? 'md:col-span-2' : ''}`}>
            <div className="grid grid-cols-7 gap-px mb-px bg-gray-100 rounded-t-lg border-t border-x">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
                <div key={dia} className="p-2 text-center text-[10px] font-semibold text-gray-500 uppercase">{dia}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-b-lg overflow-hidden">
              {Array.from({ length: 28 }).map((_, index) => {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - 9 + index);
                const esHoy = index === 9;
                const eventosDia = obtenerEventosDelDia(fecha);
                const eventosVisibles = eventosDia.slice(0, 4);
                const extras = eventosDia.length - 4;

                return (
                  <div
                    key={index}
                    className={`bg-white p-1.5 min-h-[100px] transition-all cursor-pointer hover:bg-gray-50 ${esHoy ? 'bg-blue-50' : ''} ${diaSeleccionado?.fecha.getTime() === fecha.getTime() ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                    onClick={() => setDiaSeleccionado({ fecha, eventos: eventosDia })}
                  >
                    <div className="flex mb-1">
                      {esHoy ? (
                        <div className="h-5 w-5 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                          {fecha.getDate()}
                        </div>
                      ) : (
                        <span className={`text-sm font-bold ${fecha.getMonth() === new Date().getMonth() ? 'text-gray-800' : 'text-gray-400'}`}>
                          {fecha.getDate()}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {eventosVisibles.map((ev, i) => {
                        const col = getColorEvento(ev.tipo_evento);
                        return (
                        <div key={i} className="flex items-center gap-1 text-[10px] leading-tight">
                          <span style={{ backgroundColor: col.dotBg }} className="w-1 h-1 rounded-full flex-shrink-0"></span>
                          <span className="font-semibold text-gray-500">{formatearHora(ev.fecha_hora)}</span>
                          <span style={{ color: col.textColor }} className="truncate">{ev.titulo}</span>
                        </div>
                        );
                      })}
                      {extras > 0 && (
                        <div className="text-[10px] text-gray-400 font-semibold pl-2">+{extras} más</div>
                      )}
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
                  <h4 className="text-xl font-black text-[#152844] capitalize">{diaSeleccionado.fecha.toLocaleDateString('es-ES', { weekday: 'long' })}</h4>
                  <p className="text-gray-600">{diaSeleccionado.fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                </div>
                <button onClick={() => setDiaSeleccionado(null)} className="text-gray-400 hover:text-gray-700 bg-white h-8 w-8 rounded-full shadow flex items-center justify-center">×</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {diaSeleccionado.eventos.length > 0 ? (
                  diaSeleccionado.eventos.map((ev, i) => {
                    const col = getColorEvento(ev.tipo_evento);
                    return (
                    <div key={i} style={{ borderLeftColor: col.borderColor }} className="bg-white p-4 rounded-lg shadow border-l-4">
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ backgroundColor: col.bgColor, color: col.textColor }} className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {ev.tipo_evento}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{formatearHora(ev.fecha_hora)}</span>
                      </div>
                      <h6 className="text-sm font-semibold text-gray-900 mb-1">{ev.titulo}</h6>
                      <p className="text-xs text-gray-600 line-clamp-3">{ev.descripcion}</p>
                      <p className="text-[10px] text-blue-600 mt-2 font-mono uppercase">{ev.expediente_id}</p>
                    </div>
                    );
                  })
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

      {/* ==================================================== */}
      {/* MODAL: CREAR EVENTO DE USUARIO                        */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="bg-[#152844] p-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg">Nuevo Evento Personal</h2>
              <button onClick={cerrarModal} className="text-white text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleCrearEvento} className="p-6 max-h-[80vh] overflow-y-auto">
              <p className="text-xs text-gray-500 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
                Crea un evento personal. Si no seleccionas participantes, será un evento privado
                visible solo para ti.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Título del Evento *</label>
                <input
                  required
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej. Reunión con equipo de litigios"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha y Hora *</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.fecha_hora}
                  onChange={(e) => setFormData({ ...formData, fecha_hora: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Evento *</label>
                <select
                  required
                  value={formData.tipo_evento_id}
                  onChange={(e) => setFormData({ ...formData, tipo_evento_id: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un tipo...</option>
                  {catalogos?.catalogos?.tipos_evento?.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full p-3 border rounded-lg text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalles adicionales del evento..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Participantes <span className="text-gray-400 font-normal">(opcional — si no seleccionas nadie, será privado)</span>
                </label>

                {/* Selección rápida */}
                {usuariosArea.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <button
                      type="button"
                      onClick={seleccionarTodos}
                      className={`text-[11px] px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                        formData.participantes_ids.length === usuariosArea.filter(u => +u.id !== +usuarioPerfil?.id).length
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {formData.participantes_ids.length === usuariosArea.filter(u => +u.id !== +usuarioPerfil?.id).length
                        ? '✓ Todos seleccionados'
                        : 'Seleccionar todos'}
                    </button>

                    {getAreasAgrupadas().length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-gray-400 font-semibold self-center mr-1">Áreas:</span>
                        {getAreasAgrupadas().map(area => {
                          const idsArea = usuariosArea
                            .filter(u => +u.id !== +usuarioPerfil?.id)
                            .filter(u => u.areas_legales?.some(a => a.id === area.id))
                            .map(u => u.id);
                          const todos = idsArea.every(id => formData.participantes_ids.includes(id));
                          return (
                            <button
                              type="button"
                              key={area.id}
                              onClick={() => toggleAreaUsuarios(area.id)}
                              className={`text-[11px] px-2 py-1 rounded-full font-semibold border transition-colors ${
                                todos
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                              }`}
                            >
                              {area.nombre} ({area.usuarios})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="border rounded-lg max-h-48 overflow-y-auto bg-gray-50/50 p-2 space-y-1">
                  {usuariosArea.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">Cargando usuarios...</p>
                  ) : (
                    usuariosArea.map(user => {
                      const isCurrentUser = +user.id === +usuarioPerfil?.id;
                      return (
                        <label
                          key={user.id}
                          className={`flex items-start gap-3 p-2 rounded border transition-colors ${
                            isCurrentUser
                              ? 'opacity-60 cursor-not-allowed bg-gray-100'
                              : 'cursor-pointer hover:bg-white hover:border-gray-200 border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isCurrentUser}
                            checked={formData.participantes_ids.includes(user.id)}
                            onChange={() => toggleParticipante(user.id)}
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:bg-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800">
                              {user.nombre_completo}
                              {isCurrentUser && <span className="text-[10px] text-gray-500 ml-1">(tú)</span>}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">{user.rol}</span>
                              {user.areas_legales?.map(area => (
                                <span key={area.id} className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{area.nombre}</span>
                              ))}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-[#152844] hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition disabled:opacity-50"
                >
                  {guardando ? 'Creando...' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Inicio;