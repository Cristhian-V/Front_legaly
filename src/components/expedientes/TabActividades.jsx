import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import eventosService from '../../services/eventoServise';

const TabActividades = ({ casoId, estaCerrado }) => {
  const { catalogos } = useOutletContext() || {};
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Formulario Lateral
  const [modoEdicion, setModoEdicion] = useState(false);
  const [eventoActivoId, setEventoActivoId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_hora: '',
    tipo_evento_id: ''
  });

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
    setFormData({ titulo: '', descripcion: '', fecha_hora: '', tipo_evento_id: '' });
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
      tipo_evento_id: evento.tipo_evento_id || ''
    });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, caso_id: casoId }; // Siempre enviamos el caso_id

      if (modoEdicion) {
        await eventosService.modificarEvento(eventoActivoId, payload);
      } else {
        await eventosService.crearEvento(payload);
      }

      await cargarEventos();
      limpiarFormulario();
    } catch (error) {
      alert("Error al guardar la actividad: " + error);
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
        <h3 className="text-xl font-black text-[#080E21] mb-4">Cronograma del Caso</h3>

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
            <h3 className="text-lg font-bold text-[#080E21] mb-1">
              {modoEdicion ? '✏️ Editar Actividad' : '➕ Nueva Actividad'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">Registra un evento, vencimiento o audiencia para el calendario.</p>

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
                <label className="text-xs font-bold text-gray-700 block mb-1">Tipo de Evento *</label>
                <select
                  required name="tipo_evento_id" value={formData.tipo_evento_id} onChange={handleChange}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {/* Asegúrate de que este arreglo coincida con tu estructura de catálogos */}
                  {catalogos?.catalogos?.tipos_evento?.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
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
                <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition">
                  {modoEdicion ? 'Guardar Cambios' : 'Registrar Evento'}
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