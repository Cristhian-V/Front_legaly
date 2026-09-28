import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import eventosService from '../../services/eventoServise';
import catalogosAdminService from '../../services/catalogosAdminService';
import ParticipantesEvento from '../ParticipantesEvento';

const TabActividades = ({ casoId, estaCerrado }) => {
  const { catalogos, datosUsuario, recargarCatalogos } = useOutletContext() || {};
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Formulario Lateral
  const [modoEdicion, setModoEdicion] = useState(false);
  const [eventoActivoId, setEventoActivoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_hora: '',
    tipo_evento_id: '',
    modalidad: ''
  });

  // Creación rápida de tipos de evento desde el formulario de actividad
  const [nuevoTipo, setNuevoTipo] = useState({ abierto: false, nombre: '', color: '#3b82f6' });

  const cargarEventos = async () => {
    if (!casoId) return;
    try {
      setCargando(true);
      const data = await eventosService.obtenerEventosPorCaso(casoId);
      setEventos(data || []);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, [casoId]);

  // Manejadores del Formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const limpiarFormulario = () => {
    setModoEdicion(false);
    setEventoActivoId(null);
    setFormData({ titulo: '', descripcion: '', fecha_hora: '', tipo_evento_id: '', modalidad: '' });
  };

  const handleEditar = (evento) => {
    setModoEdicion(true);
    setEventoActivoId(evento.evento_id);

    // Formatear fecha para el input datetime-local (YYYY-MM-DDTHH:mm)
    const fechaFormateada = evento.fecha_hora ? new Date(evento.fecha_hora).toISOString().slice(0, 16) : '';

    setFormData({
      titulo: evento.titulo || '',
      descripcion: evento.descripcion || '',
      fecha_hora: fechaFormateada,
      tipo_evento_id: evento.tipo_evento_id || '',
      modalidad: evento.modalidad || ''
    });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      const payload = { ...formData, caso_id: casoId };

      if (modoEdicion) {
        await eventosService.modificarEvento(eventoActivoId, payload);
      } else {
        await eventosService.crearEvento(payload);
      }

      await cargarEventos();
      limpiarFormulario();
    } catch (error) {
      alert("Error al guardar la actividad: " + error);
    } finally {
      setGuardando(false);
    }
  };

  const tiposPropios = (catalogos?.catalogos?.tipos_evento || []).filter(
    (tipo) => tipo.creado_por_id && +tipo.creado_por_id === +datosUsuario?.id
  );

  const handleCrearTipo = async () => {
    if (!nuevoTipo.nombre.trim()) return;
    try {
      const res = await catalogosAdminService.crearTipoEvento({
        nombre: nuevoTipo.nombre.trim(),
        color: nuevoTipo.color,
        activo: true,
      });
      const nuevoId = res?.data?.id;
      await recargarCatalogos();
      if (nuevoId) setFormData((prev) => ({ ...prev, tipo_evento_id: nuevoId }));
      setNuevoTipo({ abierto: false, nombre: '', color: '#3b82f6' });
    } catch (error) {
      alert(error.response?.data?.error || 'No se pudo crear el tipo de evento.');
    }
  };

  const handleEliminarTipo = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el tipo "${nombre}"?`)) return;
    try {
      await catalogosAdminService.eliminarTipoEvento(id);
      await recargarCatalogos();
      if (+formData.tipo_evento_id === +id) {
        setFormData((prev) => ({ ...prev, tipo_evento_id: '' }));
      }
    } catch (error) {
      alert(error.response?.data?.error || 'No se pudo eliminar el tipo de evento.');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta actividad?")) return;
    try {
      await eventosService.eliminarEvento(id);
      await cargarEventos();
      if (modoEdicion && eventoActivoId === id) limpiarFormulario();
    } catch (error) {
      alert("Error al eliminar la actividad: " + error);
    }
  };

  // Formateo visual de fecha
  const formatearFechaVisual = (fechaISO) => {
    if (!fechaISO) return 'Fecha no definida';
    return new Date(fechaISO).toLocaleString('es-ES', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (cargando) return <div className="py-20 text-center animate-pulse text-gray-500">Cargando actividades...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* COLUMNA IZQUIERDA: LISTADO DE EVENTOS (Más ancha) */}
      <div className="col-span-1 lg:col-span-2 space-y-4">
        <h3 className="text-xl font-black text-[#152844] mb-4">Cronograma del Caso</h3>

        {eventos.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <span className="text-4xl block mb-2">🗓️</span>
            <p className="text-gray-500 font-medium">No hay actividades registradas en este expediente.</p>
          </div>
        ) : (
          <div className="space-y-4 relative">
            {/* Línea vertical de la línea de tiempo */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-blue-100"></div>

            {eventos.map((evento) => (
              <div key={evento.id} className="relative pl-14 group">
                {/* Punto en la línea de tiempo */}
                <div className="absolute left-3 top-4 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-sm z-10"></div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{evento.titulo}</h4>
                      <p className="text-sm font-bold text-blue-600 flex items-center gap-1 mt-1">
                        ⏱️ {formatearFechaVisual(evento.fecha_hora)}
                      </p>
                    </div>

                    {/* Botones de acción rápidos */}
                     {!estaCerrado && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">                     
                      <button onClick={() => handleEditar(evento)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Editar">✏️</button>
                      <button onClick={() => handleEliminar(evento.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Eliminar">🗑️</button>                  
                    </div>
                    )}
                  </div>

                  {evento.descripcion && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                      {evento.descripcion}
                    </p>
                  )}

                  {/* Etiqueta del tipo de evento (opcional, si el backend te devuelve el nombre o haces join) */}
                  {evento.tipo_evento && (
                    <span className="inline-block mt-3 px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
                      Tipo Evento :  {evento.tipo_evento}
                    </span>
                  )}
                  {evento.modalidad && (
                    <span className="inline-block mt-3 ml-2 px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded">
                      Modalidad :  {evento.modalidad}
                    </span>
                  )}

                  <ParticipantesEvento
                    tipoEvento="caso"
                    eventoId={evento.evento_id}
                    usuarioActualId={datosUsuario?.id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: FORMULARIO (Más angosta) */}
      {!estaCerrado && (
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-[#152844] mb-1">
              {modoEdicion ? '✏️ Editar Actividad' : '➕ Nueva Actividad'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">Registra un evento, fecha de cierre o audiencia para el calendario.</p>

            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Título del Evento *</label>
                <input
                  required name="titulo" value={formData.titulo} onChange={handleChange}
                  placeholder="Ej. Audiencia Cautelar"
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Fecha y Hora *</label>
                <input
                  required type="datetime-local" name="fecha_hora" value={formData.fecha_hora} onChange={handleChange}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Tipo de Evento *</label>
                  <button
                    type="button"
                    onClick={() => setNuevoTipo((prev) => ({ ...prev, abierto: !prev.abierto }))}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    {nuevoTipo.abierto ? 'Cancelar' : '+ Crear tipo'}
                  </button>
                </div>
                <select
                  required name="tipo_evento_id" value={formData.tipo_evento_id} onChange={handleChange}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {catalogos?.catalogos?.tipos_evento?.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
                {nuevoTipo.abierto && (
                  <div className="mt-2 flex items-center gap-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                    <input
                      type="text"
                      value={nuevoTipo.nombre}
                      onChange={(e) => setNuevoTipo((prev) => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre del nuevo tipo"
                      className="flex-1 p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="color"
                      value={nuevoTipo.color}
                      onChange={(e) => setNuevoTipo((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <button
                      type="button"
                      onClick={handleCrearTipo}
                      className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700"
                    >
                      Agregar
                    </button>
                  </div>
                )}
                {tiposPropios.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] text-gray-400 font-semibold self-center mr-1">Mis tipos:</span>
                    {tiposPropios.map((tipo) => (
                      <span key={tipo.id} className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tipo.nombre}
                        <button
                          type="button"
                          onClick={() => handleEliminarTipo(tipo.id, tipo.nombre)}
                          className="text-red-400 hover:text-red-600 font-bold"
                          title="Eliminar tipo"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Modalidad *</label>
                <select
                  required name="modalidad" value={formData.modalidad} onChange={handleChange}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  <option value="virtual">Virtual</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Descripción</label>
                <textarea
                  name="descripcion" value={formData.descripcion} onChange={handleChange}
                  placeholder="Notas adicionales..."
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" disabled={guardando} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : modoEdicion ? 'Guardar Cambios' : 'Registrar Evento'}
                </button>

                {modoEdicion && (
                  <button type="button" onClick={limpiarFormulario} className="w-full py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition">
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default TabActividades;