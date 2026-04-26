// src/pages/DetalleExpediente.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import casosService from '../services/casosService';
import authService from '../services/authService';
import docsService from '../services/docsService';

// Importamos los componentes limpios
import { Badge, Modal, Label, Input } from '../components/ui/ComponentesGenerales';
import TabGeneral from '../components/expedientes/TabGeneral';
import TabDocumentos from '../components/expedientes/TabDocumentos';
import TabActividades from '../components/expedientes/TabActividades';
import TabEquipo from '../components/expedientes/TabEquipo';
import TabHistorial from '../components/expedientes/TabHistorial';


const DetalleExpediente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { catalogos, datosUsuario } = useOutletContext() || {};

  // Estados Centrales (Solo lo que afecta a toda la página o al Header)
  const [detalleCaso, setDetalleCaso] = useState({});
  const [historialCaso, setHistorialCaso] = useState({ total_eventos: 0, historial: [] });
  const [idForm, setIdForm] = useState(null);
  
  const [pestañaActiva, setPestañaActiva] = useState('general');
  const [cargando, setCargando] = useState(true);

  // Estados de Modales Globales (Header)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAccionesOpen, setIsAccionesOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isEvaluarModalOpen, setIsEvaluarModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({});
  const [revisionData, setRevisionData] = useState({ revisor_id: '', comentarios_solicitud: '', documentos_ids: [] });
  const [evaluacionData, setEvaluacionData] = useState({ estado_revision_id: '', comentarios_revisor: '' });

const [listaDocumentos, setListaDocumentos] = useState([]);

  const inicializarPagina = useCallback(async () => {
    const esAuth = await authService.isAuthenticated();
    if (!esAuth) return navigate('/login');

    try {
      setCargando(true);
      // Solo cargamos lo necesario para el header. Las pestañas cargarán lo suyo.
      const [resDetalle, resIdForm, resHistorial,resDocs] = await Promise.all([
        casosService.obtenerDetalleCaso(id),
        casosService.obtenerIdForm(id),
        casosService.obtenerHistorialCaso(id), // Necesario para saber si el usuario solicitó la revisión actual
        docsService.obtenerDocumentosCaso(id)
      ]);

      setDetalleCaso(resDetalle || {});
      setIdForm(resIdForm);
      setHistorialCaso(resHistorial || { total_eventos: 0, historial: [] });
      setListaDocumentos(resDocs.documentacion || []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    inicializarPagina();
  }, [inicializarPagina]);

  // --- LOGICA DE EDICIÓN GENERAL ---
  const abrirModalEdicion = () => {
    if (!idForm) return;
    setFormData({
      cliente: idForm.caso?.cliente_id || '', titulo: detalleCaso.caso?.titulo || '',
      descripcion: detalleCaso.caso?.descripcion || '', areaLegal: idForm.caso?.area_legal_id || '',
      responsable: idForm.caso?.responsable_id || '', contraparte: detalleCaso.caso?.contraparte || ''
    });
    setIsEditModalOpen(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {
      await casosService.modificarCaso(id, formData);
      setIsEditModalOpen(false);
      inicializarPagina();
    } catch (error) { alert("Error al actualizar el caso"); }
  };

  // --- REVISIONES GLOBALES ---
  const handleSolicitarRevision = async (e) => {
    e.preventDefault();
    try {
      if (+datosUsuario.id === +revisionData.revisor_id){
      alert("El Solicitante y el Revisor no puede ser la misma persona");  
      }else{
      await casosService.solicitarRevision(id, revisionData.revisor_id, revisionData.comentarios_solicitud, revisionData.documentos_ids);
      alert("Solicitud enviada");
      setIsRevisionModalOpen(false);
      inicializarPagina();
      }
    } catch (error) { alert("Error al solicitar revisión"); }
  };

// Función para manejar los checkboxes (dentro de revisiones)
const handleDocCheckboxChange = (docId) => {
  setRevisionData(prev => {
    const yaSeleccionado = prev.documentos_ids.includes(docId);
    return {
      ...prev,
      documentos_ids: yaSeleccionado
        ? prev.documentos_ids.filter(id => id !== docId) // Quitar si ya está
        : [...prev.documentos_ids, docId] // Añadir si no está
    };
  });
};

// --- MANEJADORES DE MODALES DE REVISIÓN ---
  const abrirModalRevision = () => {
    setRevisionData({ revisor_id: '', comentarios_solicitud: '', documentos_ids: [] });
    setIsRevisionModalOpen(true);
    setIsAccionesOpen(false); // Cerramos el menú desplegable
  };

  const abrirModalEvaluar = () => {
    setEvaluacionData({ estado_revision_id: '', comentarios_revisor: '' });
    setIsEvaluarModalOpen(true);
    setIsAccionesOpen(false); // Cierra el dropdown
  };

  // --- ENVIAR EVALUACIÓN DEL JEFE ---
  const handleEvaluarSubmit = async (e) => {
    e.preventDefault();
    if (!evaluacionData.estado_revision_id) return alert("Por favor, selecciona una decisión.");

    try {
      const idRevision = await casosService.obtenerRevisionActiva(id);
      if (!idRevision?.id_activo) return alert("Error: No se encontró la revisión en curso.");

      await casosService.aprobarObservarCaso(idRevision.id_activo, evaluacionData);
      alert("La revisión ha sido completada.");
      setIsEvaluarModalOpen(false);
      
      // Puedes usar navigate('/revisiones') si quieres sacarlo de ahí, o solo recargar la página:
      inicializarPagina(); 
    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar tu respuesta.");
    }
  };

  // --- CANCELAR SOLICITUD DE REVISIÓN (DUEÑO DEL CASO) ---
  const handleCancelarRevision = async () => {
    // 1. Pedimos confirmación al usuario
    if (!window.confirm("¿Estás seguro de que deseas cancelar tu solicitud de revisión? El caso volverá a estado 'En elaboración'.")) return;

    try {
      // 2. Buscamos el ID de la revisión que está activa actualmente
      const idRevision = await casosService.obtenerRevisionActiva(id);
      
      if (!idRevision?.id_activo) {
        return alert("Error: No se encontró la revisión en curso.");
      }

      // 3. Enviamos la petición PATCH al backend
      await casosService.cancelarRevision(idRevision.id_activo);

      // 4. Éxito: Cerramos menú, avisamos y recargamos la vista
      alert("Solicitud de revisión cancelada exitosamente.");
      setIsAccionesOpen(false); 
      inicializarPagina(); 

    } catch (error) {
      console.error("Error al cancelar la revisión:", error);
      alert(error.response?.data?.error || "Hubo un problema al intentar cancelar la solicitud.");
    }
  };

  // --- ESTILOS ---
  const tabStyle = (tab) => `pb-4 px-2 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${pestañaActiva === tab ? 'border-[#080E21] text-[#080E21]' : 'border-transparent text-gray-500 hover:text-gray-800'}`;

  // Filtro auxiliar para el dropdown del header
  const revisionesRecientes = historialCaso.historial.flatMap(g => g.eventos).filter(e => ['solicitud_revision', 'revision_completada'].includes(e.tipo)).slice(0, 4);

  if (cargando) return <div className="p-20 text-center animate-pulse text-gray-500">Cargando expediente...</div>;

  return (
    <main className="p-8 max-w-7xl mx-auto relative">
      <button onClick={() => navigate('/expedientes')} className="flex items-center text-gray-500 hover:text-[#080E21] mb-6 transition-colors">← Volver a Casos</button>

       {/* HEADER DEL CASO */}
      <div className="mb-8">
        <div className="flex gap-3 mb-3">
          <Badge text={detalleCaso.caso?.categoria_cliente} />
          <Badge text={detalleCaso.caso?.expediente_id} />
          <Badge text={detalleCaso.caso?.estado} color="green" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-black text-[#080E21]">{detalleCaso.caso?.titulo} - {detalleCaso.caso?.nombre_cliente}</h1>
          <div className="flex gap-3">
            <button onClick={abrirModalEdicion} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold shadow-sm">Editar</button>
            {/* BOTÓN DESPLEGABLE DE ACCIONES */}
            <div className="relative">
              <button
                onClick={() => setIsAccionesOpen(!isAccionesOpen)}
                className="px-4 py-2 bg-[#212A3E] text-white rounded-lg hover:bg-slate-800 font-semibold shadow-sm flex items-center gap-2 transition-colors">
                Acciones <span className="text-xs">▼</span>
              </button>
              {/* Menú Desplegable */}
              {isAccionesOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-fade-in-up">
                  <div className="py-2">
                    {/* Variable auxiliar para limpiar el código (Si es null, asumimos "En elaboración" = 6) */}
                    {(() => {
                      const estadoRev = detalleCaso.caso?.estado_revision || "En elaboración";
                      return (
                        <>
                          {/* ESCENARIO 1: EN ELABORACIÓN (6) */}
                          {estadoRev === "En elaboración" && (
                            <button
                              onClick={abrirModalRevision}
                              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors">
                              <span className="text-lg">👀</span> Solicitar Revisión
                            </button>
                          )}
                          {/* ESCENARIO 2: PENDIENTE (1) para dueño el caso */}
                          {(estadoRev === "Pendiente" && revisionesRecientes[0].autor_id === datosUsuario.id) && (
                            <button 
                              onClick={handleCancelarRevision} // <--- AÑADIR ESTA LÍNEA
                              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                            >
                              <span className="text-lg">🚫</span> Cancelar Solicitud
                            </button>
                          )}
                          {/* ESCENARIO 3: CON OBSERVACIONES (3) */}
                          {(estadoRev === "Con Observaciones") && (
                            <button
                              onClick={abrirModalRevision}
                              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 transition-colors">
                              <span className="text-lg">📝</span> Levantar Observaciones
                            </button>
                          )}
                          {/* ESCENARIO 4: EN REVISIÓN (4) para el que envio la solicitud */}
                          {(estadoRev === "En Revisión" && revisionesRecientes[0].autor_id === datosUsuario.id) && (
                            <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-3 transition-colors">
                              <span className="text-lg">🚫</span> El caso ya se encuentra en Revision
                            </button>
                          )}
                          {/* ESCENARIO 4: EN REVISIÓN (4) */}
                          {/* Nota: En la vida real, aquí pondrías una validación extra para que ESTE botón solo lo vea el JEFE asignado, ej: && datosUsuario.id === detalleCaso.caso.revisor_id */}
                          {(estadoRev === "En Revisión" && revisionesRecientes[0].autor_id !== datosUsuario.id) && (
                            <button
                              onClick={abrirModalEvaluar}
                              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-3 transition-colors">
                              <span className="text-lg">⚖️</span> Atender Revisión
                            </button>
                          )}
                          {/* ESCENARIO 5: APROBADO (2) O REVISADO (5) */}
                          {(estadoRev === "Aprobado" || estadoRev === "Revisado") && (
                            <div className="px-4 py-2.5 text-sm font-semibold text-green-600 flex items-center gap-3 bg-green-50/50">
                              <span className="text-lg">✅</span> Revisión Completada
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* TABS SELECTOR */}
      <div className="border-b border-gray-200 mb-8 flex gap-8">
        {['general', 'documentos', 'actividades', 'equipo', 'historial'].map(t => (
          <button key={t} onClick={() => setPestañaActiva(t)} className={tabStyle(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ENRUTADOR INTERNO DE PESTAÑAS (La magia sucede aquí) */}
      <div className="mt-8">
        {pestañaActiva === 'general' && <TabGeneral casoId={id} detalleCaso={detalleCaso} />}
        {pestañaActiva === 'documentos' && <TabDocumentos casoId={id} catalogos={catalogos} datosUsuario={datosUsuario} />}
        {pestañaActiva === 'actividades' && <TabActividades casoId={detalleCaso.caso?.expediente_id} />}
        {pestañaActiva === 'equipo' && <TabEquipo casoId={id} catalogos={catalogos} />}
        {pestañaActiva === 'historial' && <TabHistorial historial={historialCaso} />}
      </div>

        {/* ========================================== */}
      {/* MODALES GLOBALES (HEADER)         */}
      {/* ========================================== */}

      {/* 1. Modal: Edición de Caso */}
      {isEditModalOpen && (
        <Modal title="Editar Expediente" onClose={() => setIsEditModalOpen(false)}>
          <form onSubmit={handleGuardarEdicion} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label text="Título del Caso" />
              <Input name="titulo" value={formData.titulo || ''} onChange={(e) => setFormData({...formData, titulo: e.target.value})} />
            </div>
            <div>
              <Label text="Cliente" />
              <select name="cliente" value={formData.cliente || ''} onChange={(e) => setFormData({...formData, cliente: e.target.value})} className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccione...</option>
                {catalogos?.clientes?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <Label text="Contraparte" />
              <Input name="contraparte" value={formData.contraparte || ''} onChange={(e) => setFormData({...formData, contraparte: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <Label text="Descripción" />
              <textarea name="descripcion" value={formData.descripcion || ''} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} className="w-full p-2 border rounded h-32 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition">Guardar Cambios</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Modal: Solicitar Revisión */}
      {isRevisionModalOpen && (
  <Modal title="Solicitar Revisión de Documentos" onClose={() => setIsRevisionModalOpen(false)}>
    <form onSubmit={handleSolicitarRevision}>
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-blue-800">
        Selecciona los documentos específicos que requieren revisión. Si no seleccionas ninguno, se realizará una revisión general.
      </div>

      <div className="mb-5">
        <Label text="Seleccionar Revisor *" />
        <select 
          required 
          value={revisionData.revisor_id} 
          onChange={(e) => setRevisionData({ ...revisionData, revisor_id: e.target.value })} 
          className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">¿Quién revisará este caso?</option>
          {catalogos?.usuarios?.map(user => (
            <option key={user.id} value={user.id}>{user.nombre_completo}</option>
          ))}
        </select>
      </div>

      {/* LISTA DE SELECCIÓN DE DOCUMENTOS */}
      <div className="mb-6">
        <Label text="Documentos para Revisión" />
        <div className="border rounded-lg max-h-48 overflow-y-auto bg-gray-50/30 p-2 mt-1">
          {listaDocumentos.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No hay documentos cargados en este caso.</p>
          ) : (
            listaDocumentos.map(doc => (
              <label key={doc.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={revisionData.documentos_ids.includes(doc.id)}
                  onChange={() => handleDocCheckboxChange(doc.id)}
                />
                <span className="text-sm font-bold text-gray-700 truncate">{doc.nombre}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="mb-6">
        <Label text="Instrucciones adicionales" />
        <textarea 
          value={revisionData.comentarios_solicitud} 
          onChange={(e) => setRevisionData({ ...revisionData, comentarios_solicitud: e.target.value })} 
          className="w-full p-3 border rounded-lg text-sm resize-none h-24 focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="Ej: Revisar especialmente la cláusula de rescisión..." 
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={() => setIsRevisionModalOpen(false)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Cancelar</button>
        <button type="submit" className="px-6 py-2 bg-[#080E21] hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition">Enviar Solicitud</button>
      </div>
    </form>
  </Modal>
)}

      {/* 3. Modal: Atender Revisión (Jefe/Revisor) */}
      {isEvaluarModalOpen && (
        <Modal title="Atender Revisión de Expediente" onClose={() => setIsEvaluarModalOpen(false)}>
          <form onSubmit={handleEvaluarSubmit}>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona el resultado de tu revisión. Esta acción cambiará el estado del caso y notificará al abogado responsable.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* APROBADO */}
              <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${evaluacionData.estado_revision_id === 2 ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'}`}>
                <input type="radio" name="decision" className="hidden" onChange={() => setEvaluacionData({ ...evaluacionData, estado_revision_id: 2 })} />
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${evaluacionData.estado_revision_id === 2 ? 'border-green-500' : 'border-gray-300'}`}>
                    {evaluacionData.estado_revision_id === 2 && <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>}
                  </div>
                  <span className="text-green-700 font-bold">Aprobar Caso</span>
                </div>
                <p className="text-xs text-gray-500 ml-8">Todo está correcto. El caso puede continuar su curso normal.</p>
              </label>

              {/* CON OBSERVACIONES */}
              <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${evaluacionData.estado_revision_id === 3 ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'}`}>
                <input type="radio" name="decision" className="hidden" onChange={() => setEvaluacionData({ ...evaluacionData, estado_revision_id: 3 })} />
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${evaluacionData.estado_revision_id === 3 ? 'border-orange-500' : 'border-gray-300'}`}>
                    {evaluacionData.estado_revision_id === 3 && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>}
                  </div>
                  <span className="text-orange-700 font-bold">Devolver (Observar)</span>
                </div>
                <p className="text-xs text-gray-500 ml-8">Existen errores o documentos faltantes que deben corregirse.</p>
              </label>
            </div>

            <div className="mb-6">
              <Label text={`Comentarios y Feedback ${evaluacionData.estado_revision_id === 3 ? '(Obligatorio)' : '(Opcional)'}`} />
              <textarea required={evaluacionData.estado_revision_id === 3} value={evaluacionData.comentarios_revisor} onChange={(e) => setEvaluacionData({ ...evaluacionData, comentarios_revisor: e.target.value })} className={`w-full p-3 border rounded-lg text-sm resize-none h-28 outline-none focus:ring-2 ${evaluacionData.estado_revision_id === 3 ? 'focus:ring-orange-500 border-orange-200' : 'focus:ring-green-500'}`} placeholder={evaluacionData.estado_revision_id === 3 ? "Describe los errores encontrados para que el abogado pueda subsanarlos..." : "Comentarios adicionales para el abogado..."} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsEvaluarModalOpen(false)} className="px-5 py-2 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition">Cancelar</button>
              <button type="submit" disabled={!evaluacionData.estado_revision_id} className={`px-6 py-2 text-white font-bold rounded-lg shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed ${evaluacionData.estado_revision_id === 3 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>Confirmar Evaluación</button>
            </div>
          </form>
        </Modal>
      )}

    </main>
  );
};

export default DetalleExpediente;