import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import authService from '../services/authService';
import casosService from '../services/casosService';
import clienteService from '../services/clienteService'; 

const Expedientes = () => {
  const [busqueda, setBusqueda] = useState('');
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false); // Estado para bloquear el botón mientras guarda
  const [tabActiva, setTabActiva] = useState('activos'); 
  const { catalogos } = useOutletContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    cliente: '', titulo: '', descripcion: '', areaLegal: '', responsable: '', contraparte: ''
  });

  // --- NUEVOS ESTADOS PARA SELECCIÓN MÚLTIPLE ---
  const [contactosCliente, setContactosCliente] = useState([]); // Lista que viene del backend
  const [contactosSeleccionados, setContactosSeleccionados] = useState([]); // IDs marcados
  const [equipoSeleccionado, setEquipoSeleccionado] = useState([]); // IDs de abogados marcados

  const navigate = useNavigate();

  const autenticado = async () => {
    const esAuth = await authService.isAuthenticated();
    if (!esAuth) navigate('/login');
  };

  const cargarDataCasos = useCallback(async () => {
    try {
      setCargando(true);
      const respuestaCasos = await casosService.obtenerCasos(tabActiva);
      setCasos(respuestaCasos.casos || []);
    } catch (error) {
      console.error("Error al cargar los datos del panel:", error);
    } finally {
      setCargando(false);
    }
  }, [tabActiva]);

  useEffect(() => {
    autenticado();
    cargarDataCasos();
  }, [cargarDataCasos]);

  // --- MANEJO DE SELECCIÓN DE CLIENTE (Carga dinámica de contactos) ---
  const handleClienteChange = async (e) => {
    const clienteId = e.target.value;
    setFormData({ ...formData, cliente: clienteId });
    setContactosSeleccionados([]); // Limpiamos selección anterior
    
    if (clienteId) {
      try {
        // AJUSTA ESTO: usa casosService o clientesService según donde pusiste la función
        const contactos = await clienteService.obtenerContactos(clienteId);
        setContactosCliente(contactos || []);
      } catch (error) {
        console.error("Error al cargar contactos del cliente: " + error);
        setContactosCliente([]);
      }
    } else {
      setContactosCliente([]);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- MANEJADORES DE CHECKBOXES ---
  const toggleContacto = (id) => {
    setContactosSeleccionados(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
  };

  const toggleAbogado = (id) => {
    setEquipoSeleccionado(prev => prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]);
  };

  // --- FLUJO SECUENCIAL DE GUARDADO ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validaciones manuales estrictas (Arrays vacíos)
    if (contactosSeleccionados.length === 0) {
      return alert("Debe seleccionar al menos un contacto del cliente para este caso.");
    }
    if (equipoSeleccionado.length === 0) {
      return alert("Debe asignar al menos un abogado al equipo del caso.");
    }

    try {
      setGuardando(true); // Bloqueamos el formulario

      // PASO 1: CREAR EL CASO
      const respuestaCaso = await casosService.crearCaso(formData);
      
      // IMPORTANTE: Asegúrate de que tu backend devuelve el ID del caso insertado
      // Si tu backend lo devuelve como `respuestaCaso.caso.id` o `respuestaCaso.insertId`, ajusta esta línea:
      const nuevoCasoId = respuestaCaso.caso.expediente_id; 

      if (!nuevoCasoId) throw new Error("No se pudo obtener el ID del nuevo caso desde el servidor.");

      // PASO 2: ASIGNAR CONTACTOS
      await casosService.asignarContactos(nuevoCasoId, contactosSeleccionados);

      // PASO 3: ASIGNAR EQUIPO DE ABOGADOS
      // Si tu backend no tiene un endpoint masivo, hacemos un bucle de promesas:
      const promesasEquipo = equipoSeleccionado.map(abogadoId => 
        casosService.addMiembroEquipo(nuevoCasoId, abogadoId)
      );
      await Promise.all(promesasEquipo); // Ejecuta todas las asignaciones en paralelo

      // FIN: Recargar tabla y limpiar
      await cargarDataCasos();
      cerrarModal();

    } catch (error) {
      console.error("Error en la secuencia de guardado:", error);
      alert("Ocurrió un error al intentar crear el expediente completo.");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setFormData({ cliente: '', titulo: '', descripcion: '', areaLegal: '', responsable: '', contraparte: '' });
    setContactosSeleccionados([]);
    setEquipoSeleccionado([]);
    setContactosCliente([]);
  };

  const casosFiltrados = casos.filter(caso =>
    caso.descripcion_corta?.toLowerCase().includes(busqueda.toLowerCase()) ||
    caso.expediente_id?.toLowerCase().includes(busqueda.toLowerCase()) ||
    caso.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Aprobado': return 'bg-green-100 text-green-800 border-green-300';
      case 'Con Observaciones': return 'bg-red-100 text-red-800 border-red-300';
      case 'En Revisión': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Revisado': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'En elaboración': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Activo': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cerrado': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">

      {/* Barra de Herramientas y Tabs (Se mantiene igual que tu código anterior) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">🔍</span>
          <input type="text" placeholder="Buscar por ID, título o cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"/>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-[#0F172A] hover:bg-slate-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">
          <span>+</span> Nuevo Expediente
        </button>
      </div>

      <div className="flex gap-4 mb-4 border-b border-gray-200">
        <button onClick={() => setTabActiva('activos')} className={`pb-2 px-4 text-sm font-bold transition-all ${tabActiva === 'activos' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          CASOS ACTIVOS
        </button>
        <button onClick={() => setTabActiva('historial')} className={`pb-2 px-4 text-sm font-bold transition-all ${tabActiva === 'historial' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          CASOS CERRADOS
        </button>
      </div>

      {/* TABLA DE EXPEDIENTES (Se mantiene intacta) */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[400px]">
        {cargando ? (
           <div className="flex items-center justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">ID Expediente</th>
                  <th className="p-4 font-semibold">Título del Caso</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Area Legal</th>
                  <th className="p-4 font-semibold">Fecha Inicio</th>
                  <th className="p-4 font-semibold">Responsable</th>
                  <th className="p-4 font-semibold text-center">Estado</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {casosFiltrados.length > 0 ? (
                  casosFiltrados.map((caso, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono text-sm text-blue-600 font-semibold">{caso.expediente_id}</td>
                      <td className="p-4 text-gray-800 font-medium">{caso.descripcion_corta}</td>
                      <td className="p-4 text-gray-600">{caso.cliente_nombre}</td>
                      <td className="p-4 text-gray-600">{caso.area_legal}</td>
                      <td className="p-4 text-gray-500 text-sm">{caso.fecha_apertura}</td>
                      <td className="p-4 text-gray-600">{caso.responsable_nombre}</td>
                      <td className="p-4 text-center"><span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold border text-center leading-tight shadow-sm ${getEstadoBadge(caso.estado_nombre)}`}>{caso.estado_nombre}</span></td>
                      <td className="p-4 text-center">
                        <button onClick={() => navigate(`/expedientes/${caso.expediente_id}`)} className="text-blue-600 hover:text-blue-900 font-medium text-sm px-3 py-1 rounded hover:bg-blue-50 transition">Ver Detalle</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="p-8 text-center text-gray-500">No se encontraron expedientes.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- VENTANA MODAL PARA NUEVO EXPEDIENTE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">

            <div className="bg-[#080E21] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Crear Nuevo Expediente Completo</h2>
              <button type="button" onClick={cerrarModal} className="text-gray-300 hover:text-white text-2xl font-light">×</button>
            </div>

            {/* Agregado overflow-y-auto para permitir scroll interno si la pantalla es pequeña */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* COLUMNA IZQUIERDA: DATOS GENERALES */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-blue-800 border-b pb-2 uppercase tracking-wide">1. Datos Generales</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Título / Descripción Corta *</label>
                    <input type="text" name="titulo" required value={formData.titulo} onChange={handleInputChange} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ej. Demanda Laboral Juan Pérez" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cliente *</label>
                    {/* MODIFICADO: Usa handleClienteChange en lugar de handleInputChange */}
                    <select name="cliente" required value={formData.cliente} onChange={handleClienteChange} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                      <option value="">Seleccione un cliente...</option>
                      {catalogos?.clientes?.map((cli, i) => (
                        <option key={i} value={cli.id}>{cli.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contraparte *</label>
                    <input type="text" name="contraparte" required value={formData.contraparte} onChange={handleInputChange} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Nombre de la contraparte" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Área Legal *</label>
                      <select name="areaLegal" required value={formData.areaLegal} onChange={handleInputChange} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                        <option value="">Seleccione...</option>
                        {catalogos?.catalogos?.area_legal?.map((area, i) => (
                          <option key={i} value={area.id}>{area.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Abogado Responsable *</label>
                      <select name="responsable" required value={formData.responsable} onChange={handleInputChange} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                        <option value="">Asignar a...</option>
                        {catalogos?.usuarios?.map((abogado, i) => (
                          <option key={i} value={abogado.id}>{abogado.nombre_completo}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Descripción del Caso *</label>
                    <textarea name="descripcion" required rows="3" value={formData.descripcion} onChange={handleInputChange} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" placeholder="Detalle los antecedentes y objetivos del caso..."></textarea>
                  </div>
                </div>

                {/* COLUMNA DERECHA: ASIGNACIONES MÚLTIPLES */}
                <div className="space-y-6">
                  
                  {/* CUADRO 1: CONTACTOS DEL CLIENTE */}
                  <div>
                    <h3 className="text-sm font-bold text-blue-800 border-b pb-2 mb-3 uppercase tracking-wide">2. Contactos del Cliente *</h3>
                    <p className="text-[11px] text-gray-500 mb-2">Seleccione quiénes recibirán notificaciones de este caso.</p>
                    <div className="border rounded-lg h-32 overflow-y-auto bg-gray-50 p-2 space-y-1 shadow-inner">
                      {!formData.cliente ? (
                        <p className="text-xs text-gray-400 text-center py-8">Seleccione un cliente primero.</p>
                      ) : contactosCliente.length === 0 ? (
                        <p className="text-xs text-red-500 text-center py-8 font-semibold">El cliente no tiene contactos registrados.</p>
                      ) : (
                        contactosCliente.map(contacto => (
                          <label key={contacto.id} className="flex items-start gap-2 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                            <input 
                              type="checkbox" 
                              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              checked={contactosSeleccionados.includes(contacto.id)}
                              onChange={() => toggleContacto(contacto.id)}
                            />
                            <div>
                              <p className="text-xs font-bold text-gray-800 leading-none">{contacto.nombre_contacto}</p>
                              <p className="text-[10px] text-gray-500">{contacto.cargo || 'Sin cargo'}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* CUADRO 2: EQUIPO LEGAL */}
                  <div>
                    <h3 className="text-sm font-bold text-blue-800 border-b pb-2 mb-3 uppercase tracking-wide">3. Equipo Legal *</h3>
                    <p className="text-[11px] text-gray-500 mb-2">Seleccione los abogados que conformarán el equipo (además del responsable).</p>
                    <div className="border rounded-lg h-36 overflow-y-auto bg-gray-50 p-2 space-y-1 shadow-inner">
                      {catalogos?.usuarios?.map((abogado) => (
                         // Opcional: Desactivamos el checkbox del abogado si ya es el responsable para evitar duplicidad
                        <label key={abogado.id} className={`flex items-start gap-2 p-2 rounded cursor-pointer border border-transparent transition-colors ${formData.responsable == abogado.id ? 'opacity-50 bg-gray-100' : 'hover:bg-white hover:border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            disabled={formData.responsable == abogado.id}
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:bg-gray-300"
                            checked={equipoSeleccionado.includes(abogado.id) || formData.responsable == abogado.id}
                            onChange={() => toggleAbogado(abogado.id)}
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-800 leading-none">
                              {abogado.nombre_completo} {formData.responsable == abogado.id && '(Responsable)'}
                            </p>
                            <p className="text-[10px] text-gray-500">{abogado.descripcion_titulo || 'Abogado'}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* PIE DEL MODAL: BOTONES */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 flex-shrink-0">
                <button type="button" onClick={cerrarModal} disabled={guardando} className="px-5 py-2.5 text-sm text-gray-600 font-bold rounded hover:bg-gray-100 transition disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="px-6 py-2.5 text-sm bg-[#080E21] hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition disabled:bg-gray-400 flex items-center gap-2">
                  {guardando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : 'Crear Expediente Completo'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      
    </main>
  );
};

export default Expedientes;