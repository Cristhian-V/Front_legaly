import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import casosService from '../services/casosService';
import authService from '../services/authService';
import docsService from '../services/docsService';


/**
 * COMPONENTE: DetalleExpediente
 * Descripción: Gestiona la vista detallada, edición, documentos y equipo de un caso legal.
 */
const DetalleExpediente = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Contexto global (Catálogos y datos del abogado logueado)
  const { catalogos, datosUsuario } = useOutletContext() || {};

  // --- 1. ESTADOS DE DATOS (Backend) ---
  const [detalleCaso, setDetalleCaso] = useState({});
  const [documentos, setDocumentos] = useState({ documentacion: [] });
  const [equipoCaso, setEquipoCaso] = useState({ equipo: [] });
  const [idForm, setIdForm] = useState(null); // Datos crudos para el formulario de edición
  const [historialCaso, setHistorialCaso] = useState({ total_eventos: 0, historial: [] });

  // --- 2. ESTADOS DE UI (Modales y Pestañas) ---
  const [pestañaActiva, setPestañaActiva] = useState('general');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false);
  const [cargando, setCargando] = useState(true);

  // --- 3. ESTADOS DE FORMULARIOS ---
  const [formData, setFormData] = useState({
    cliente: '', titulo: '', descripcion: '', areaLegal: '', responsable: '', contraparte: ''
  });
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [nuevoMiembro, setNuevoMiembro] = useState({ abogado_id: '', rol_en_caso: 'Abogado Asociado' });

  const fileInputRef = useRef(null);

  // --- ESTADOS PARA MODIFICAR VERSIÓN DE DOCUMENTO ---
  const [isModificarModalOpen, setIsModificarModalOpen] = useState(false);
  const [docAModificar, setDocAModificar] = useState(null); // Guardará el objeto del documento viejo
  const [archivoVersion, setArchivoVersion] = useState(null);
  const [comentariosVersion, setComentariosVersion] = useState('');

  const fileVersionInputRef = useRef(null); // Nueva referencia para el Drag&Drop de versión

  // --- 4. CARGA INICIAL DE DATOS (Optimizado) ---
  const inicializarPagina = useCallback(async () => {
    const esAuth = await authService.isAuthenticated();
    if (!esAuth) return navigate('/login');

    try {
      setCargando(true);
      // Ejecutamos todas las peticiones en paralelo para evitar "cascading renders"
      const [resDetalle, resIdForm, resEquipo, resDocs, resHistorial] = await Promise.all([
        casosService.obtenerDetalleCaso(id),
        casosService.obtenerIdForm(id),
        casosService.obtenerEquipoCaso(id),
        docsService.obtenerDocumentosCaso(id),
        casosService.obtenerHistorialCaso(id)
      ]);

      setDetalleCaso(resDetalle);
      setIdForm(resIdForm);
      setEquipoCaso(resEquipo || { equipo: [] });
      setDocumentos(resDocs || { documentacion: [] });
      setHistorialCaso(resHistorial || { total_eventos: 0, historial: [] });
    } catch (error) {
      console.error("Error al inicializar la página:", error);
    } finally {
      setCargando(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    inicializarPagina();
  }, [inicializarPagina]);

  // --- 5. LÓGICA DE EDICIÓN DEL CASO ---
  const abrirModalEdicion = () => {
    if (!idForm) return;
    setFormData({
      cliente: idForm.caso?.cliente_id || '',
      titulo: detalleCaso.caso?.titulo || '',
      descripcion: detalleCaso.caso?.descripcion || '',
      areaLegal: idForm.caso?.area_legal_id || '',
      responsable: idForm.caso?.responsable_id || '',
      contraparte: detalleCaso.caso?.contraparte || ''
    });
    setIsEditModalOpen(true);
  };
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {

      await casosService.modificarCaso(id, formData);

      setIsEditModalOpen(false);
      inicializarPagina(); // Recargamos todo
    } catch (error) {
      alert("Error al actualizar el caso: " + (error.response?.data?.error || error.message));
    }
  };

  // --- 6. LÓGICA DE DOCUMENTOS ---
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setArchivoSeleccionado(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!archivoSeleccionado || !tipoDocumento) return alert("Completa todos los campos");

    try {
      const data = new FormData();
      data.append('archivo', archivoSeleccionado);
      data.append('tipoDocumento', tipoDocumento);
      data.append('expediente_id', id);
      data.append('usuario_id', datosUsuario?.id);
      data.append('pesoMB', (archivoSeleccionado.size / (1024 * 1024)).toFixed(2));

      await docsService.subirDocumentoCaso(data);
      setIsUploadModalOpen(false);
      setArchivoSeleccionado(null);
      // Recargamos solo documentos para ser más eficientes
      const resDocs = await docsService.obtenerDocumentosCaso(id);
      console.log(resDocs);
      setDocumentos(resDocs);
    } catch (error) {
      alert(error || "Error al subir archivo");
    }
  };

  const handleVerDocumento = (ruta) => {
    if (!ruta) return alert("Ruta no válida");
    window.open(`http://localhost:3000/api/docs/ver?ruta=${encodeURIComponent(ruta)}`, '_blank');
  };

  const handleEliminarDocumento = async (docId) => {
    if (!window.confirm("¿Eliminar este documento?")) return;
    await docsService.eliminarDocumentoCaso(docId);
    const resDocs = await docsService.obtenerDocumentosCaso(id);
    setDocumentos(resDocs);
  };

  // Abrir modal de modificar versión
  const abrirModalModificar = (doc) => {
    setDocAModificar(doc); // Guardamos qué documento vamos a actualizar
    setArchivoVersion(null);
    setComentariosVersion('');
    setIsModificarModalOpen(true);
  };

  // Manejar el cambio de archivo para la nueva versión
  const handleFileVersionChange = (e) => {
    if (e.target.files?.[0]) setArchivoVersion(e.target.files[0]);
  };

  // Enviar la nueva versión al backend
  const handleVersionSubmit = async (e) => {
    e.preventDefault();
    if (!archivoVersion) return alert("Por favor selecciona el nuevo archivo.");

    try {
      const data = new FormData();
      data.append('archivo', archivoVersion); // Debe llamarse 'archivo' como en upload.single('archivo')
      data.append('comentarios', comentariosVersion); // Comentarios para el historial

      // Asegúrate de crear esta función en tu docsService.js:
      // subirNuevaVersion: (docId, formData) => axios.post(`/api/documentos/${docId}/nueva_version`, formData, ...)
      await docsService.subirNuevaVersion(docAModificar.id, data);

      setIsModificarModalOpen(false);
      setDocAModificar(null);
      setArchivoVersion(null);

      alert("Nueva versión subida correctamente.");
      
      // Recargamos los documentos para ver el archivo actualizado en la tabla
      const resDocs = await docsService.obtenerDocumentosCaso(id);
      setDocumentos(resDocs);
    } catch (error) {
      alert(error.response?.data?.error || "Error al subir la nueva versión");
    }
  };

  // --- 7. LÓGICA DE EQUIPO LEGAL ---
  const handleAddMiembro = async (e) => {
    e.preventDefault();
    try {
      const expediente_id = id
      const abogado_id = nuevoMiembro.abogado_id
      await casosService.addMiembroEquipo(expediente_id, abogado_id);
      const resEquipo = await casosService.obtenerEquipoCaso(id);
      setEquipoCaso(resEquipo);
      setIsEquipoModalOpen(false);
    } catch (error) {
      alert("Error al añadir miembro: " + (error.response?.data?.error || error.message));
    }
  };

  const handleEliminarMiembro = async (miembroId, nombre) => {
    if (window.confirm(`¿Quitar a ${nombre} del caso?`)) {
      const expediente_id = id;
      const abogado_id = miembroId;
      await casosService.eliminarMiembroEquipo(expediente_id, abogado_id);
      const resEquipo = await casosService.obtenerEquipoCaso(id);
      setEquipoCaso(resEquipo);
    }
  };

// Función para obtener el emoji según la extensión del archivo
const getFileIcon = (extension) => {
  // Limpiamos la extensión: la pasamos a minúsculas y le quitamos el punto si lo tiene
  const ext = extension?.toLowerCase().replace('.', '') || '';

  const iconos = {
    // Documentos PDF
    pdf: '📕',
    
    // Microsoft Word
    doc: '📘', 
    docx: '📘',
    
    // Microsoft Excel / Datos
    xls: '📗', 
    xlsx: '📗', 
    csv: '📗',
    
    // Microsoft PowerPoint
    ppt: '📙', 
    pptx: '📙',
    
    // Texto plano
    txt: '📝', 
    rtf: '📝',
    
    // Imágenes
    jpg: '🖼️', 
    jpeg: '🖼️', 
    png: '🖼️', 
    gif: '🖼️', 
    svg: '🖼️',
    
    // Comprimidos
    zip: '🗂️', 
    rar: '🗂️', 
    '7z': '🗂️',
    
    // Multimedia (Opcional)
    mp4: '🎞️', 
    mp3: '🎵'
  };

  // Retorna el icono encontrado, o un icono por defecto ('📄') si la extensión no está en la lista
  return iconos[ext] || '📄';
};

  // --- ESTILOS DINÁMICOS ---
  const tabStyle = (tab) =>
    `pb-4 px-2 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${pestañaActiva === tab ? 'border-[#080E21] text-[#080E21]' : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  if (cargando) return <div className="p-20 text-center animate-pulse text-gray-500">Cargando detalles del expediente...</div>;

  return (
    <main className="p-8 max-w-7xl mx-auto relative">

      {/* NAVEGACIÓN SUPERIOR */}
      <button onClick={() => navigate('/expedientes')} className="flex items-center text-gray-500 hover:text-[#080E21] mb-6 transition-colors">
        <span className="mr-2">←</span> Volver a Casos
      </button>

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
            <button className="px-4 py-2 bg-[#212A3E] text-white rounded-lg hover:bg-slate-800 font-semibold shadow-sm">Acciones</button>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="border-b border-gray-200 mb-8 flex gap-8">
        {['general', 'documentos', 'equipo', 'historial'].map(t => (
          <button key={t} onClick={() => setPestañaActiva(t)} className={tabStyle(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1).replace('documentos', 'Documentación').replace('equipo', 'Equipo Legal')}
          </button>
        ))}
      </div>

      {/* --- CONTENIDO DE PESTAÑAS --- */}

      {/* PESTAÑA: GENERAL */}
      {pestañaActiva === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#080E21] mb-4">Descripción del Caso</h3>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">{detalleCaso.caso?.descripcion}</p>
            <hr className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InfoBox label="Cliente" value={detalleCaso.caso?.nombre_cliente} />
              <InfoBox label="Contraparte" value={detalleCaso.caso?.contraparte || 'No especificada'} />
              <InfoBox label="Fecha Inicio" value={detalleCaso.caso?.fecha_inicio} />
              <InfoBox label="Vencimiento" value="Próximamente" color="text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm h-fit">
            <h3 className="text-lg font-bold mb-6">Estado Actual</h3>
            <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
              <span className="text-xl">🕒</span>
              <div>
                <p className="font-bold text-sm">{detalleCaso.caso?.estado}</p>
                <p className="text-xs text-gray-500">Última actualización: Hoy</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA: DOCUMENTOS */}
      {pestañaActiva === 'documentos' && (
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Documentos del Expediente</h3>
            <button onClick={() => setIsUploadModalOpen(true)} className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">+ Subir Documento</button>
          </div>

          {!documentos.documentacion?.length ? (
            <EmptyState icon="📄" title="Sin documentos" description="Sube la carátula como primer archivo." onAction={() => setIsUploadModalOpen(true)} />
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Subido por</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {documentos.documentacion.map((doc) => (
                    <tr key={doc.id} className="hover:bg-blue-50/30 group transition-colors">
                      <td className="p-4 flex items-center gap-3">                        
                        <span className="text-xl">{getFileIcon(doc.extension)}</span>
                        <div>
                          <p className="text-sm font-bold">{doc.nombre}</p>
                          <p className="text-xs text-gray-400">{doc.pesomb} MB</p>
                        </div>
                      </td>
                      <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{doc.tipo_documento}</span></td>
                      <td className="p-4 text-sm text-gray-500">{doc.responsable}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleVerDocumento(doc.url_archivo)} className="text-blue-600 font-bold text-xs mr-4">Ver</button>
                        <button onClick={() => abrirModalModificar(doc)} className="text-yellow-600 hover:text-yellow-800 font-bold text-xs mr-4 transition-colors">
                          Modificar
                        </button>
                        <button onClick={() => handleEliminarDocumento(doc.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* PESTAÑA: EQUIPO LEGAL */}
      {pestañaActiva === 'equipo' && (
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold">Abogados del Caso</h3>
            <button onClick={() => setIsEquipoModalOpen(true)} className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-sm font-bold">+ Añadir Colega</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {equipoCaso.equipo?.map((miembro) => (
              <div key={miembro.id} className="border rounded-xl p-6 text-center hover:shadow-md transition-shadow relative group">
                <button onClick={() => handleEliminarMiembro(miembro.id, miembro.nombre_completo)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-xs">❌</button>
                <img src={miembro.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} className="w-16 h-16 rounded-full mx-auto mb-4 border" alt="avatar" />
                <h4 className="font-bold text-sm">{miembro.nombre_completo}</h4>
                <p className="text-xs text-blue-600 font-bold mb-2">{miembro.descripcion_titulo}</p>
                <div className="text-[10px] text-gray-400 border-t pt-2">{miembro.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA: HISTORIAL Y ACTIVIDAD */}
      {pestañaActiva === 'historial' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h3 className="text-lg font-bold text-[#080E21]">Línea de Tiempo del Caso</h3>
              <p className="text-sm text-gray-500">Trazabilidad completa de estados y acciones en este expediente</p>
            </div>
            <div className="text-sm font-semibold text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border">
              Total de eventos: <span className="text-[#080E21]">{historialCaso.total_eventos}</span>
            </div>
          </div>

          {(!historialCaso.historial || historialCaso.historial.length === 0) ? (
            <EmptyState icon="⏳" title="Sin historial" description="Aún no se han registrado eventos en este expediente." />
          ) : (
            
            /* CONTENEDOR PRINCIPAL DEL TIMELINE */
            <div className="relative pt-4 pb-12">
              
              {/* 1. LÍNEA VERTICAL CENTRAL CONTINUA */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2 z-0"></div>

              {/* 2. ITERAMOS SOBRE LOS GRUPOS DE FECHAS */}
              {historialCaso.historial.map((grupoFecha, grupoIndex) => (
                <div key={grupoIndex} className="mb-12">
                  
                  {/* Etiqueta de la Fecha Centrada */}
                  <div className="flex justify-center mb-8 relative z-10">
                    <span className="bg-[#080E21] text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-md">
                      {grupoFecha.fecha_etiqueta}
                    </span>
                  </div>

                  {/* 3. ITERAMOS SOBRE LOS EVENTOS DE ESA FECHA */}
                  <div className="space-y-8">
                    {grupoFecha.eventos.map((evento, index) => {
                      // Alternamos izquierda/derecha basados en el índice
                      const esIzquierda = index % 2 === 0;

                      // 1. DICCIONARIO DE ESTILOS PARA EVENTOS
                      // Evaluamos por 'titulo' o por 'tipo' para que sea a prueba de fallos
                      const estilosEventos = {
                        // Documentos
                        'Carga de Documento': { bg: 'bg-blue-100', text: 'text-blue-600', emoji: '📁' },
                        'carga_doc': { bg: 'bg-blue-100', text: 'text-blue-600', emoji: '📁' },
                        
                        'Modificación de Documento': { bg: 'bg-yellow-100', text: 'text-yellow-600', emoji: '✏️' },
                        'modificacion_doc': { bg: 'bg-yellow-100', text: 'text-yellow-600', emoji: '✏️' },
                        
                        'Eliminación de Documento': { bg: 'bg-red-100', text: 'text-red-500', emoji: '🗑️' },
                        'eliminacion_doc': { bg: 'bg-red-100', text: 'text-red-500', emoji: '🗑️' },
                        
                        // Revisiones
                        'Solicitud de Revisión': { bg: 'bg-orange-100', text: 'text-orange-600', emoji: '👀' },
                        'solicitud_revision': { bg: 'bg-orange-100', text: 'text-orange-600', emoji: '👀' },
                        
                        'Revisión Completada': { bg: 'bg-green-100', text: 'text-green-600', emoji: '✅' },
                        'revision_completada': { bg: 'bg-green-100', text: 'text-green-600', emoji: '✅' },
                        
                        // Gestión del Caso
                        'Apertura de Expediente': { bg: 'bg-purple-100', text: 'text-purple-600', emoji: '🏛️' },
                        'creacion': { bg: 'bg-purple-100', text: 'text-purple-600', emoji: '🏛️' },
                        
                        'Generación de Carátula': { bg: 'bg-slate-100', text: 'text-slate-600', emoji: '📄' },
                        'caratula': { bg: 'bg-slate-100', text: 'text-slate-600', emoji: '📄' },
                        
                        'Cambio de Estado del Caso': { bg: 'bg-indigo-100', text: 'text-indigo-600', emoji: '🔄' },
                        'cambio_estado': { bg: 'bg-indigo-100', text: 'text-indigo-600', emoji: '🔄' },
                        
                        'Modificación de Equipo Legal': { bg: 'bg-teal-100', text: 'text-teal-600', emoji: '👥' },
                        'modificacion_equipo': { bg: 'bg-teal-100', text: 'text-teal-600', emoji: '👥' }
                      };

                      // 2. BUSCAMOS EL ESTILO (Si no existe, usamos uno por defecto gris)
                      // Priorizamos buscar por 'titulo', si no existe, por 'tipo'
                      const estiloActual = estilosEventos[evento.titulo] || estilosEventos[evento.tipo] || { bg: 'bg-gray-100', text: 'text-gray-600', emoji: '📌' };

                      // 3. ASIGNAMOS LAS VARIABLES
                      const iconBg = estiloActual.bg;
                      const iconText = estiloActual.text;
                      const iconEmoji = estiloActual.emoji;

                      return (
                        <div key={evento.id} className="relative flex items-center justify-center w-full">
                          
                          {/* Icono del Evento (Centro) */}
                          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-sm border-2 border-white ${iconBg} ${iconText}`}>
                            <span className="text-lg">{iconEmoji}</span>
                          </div>

                          {/* Tarjeta del Evento */}
                          <div className={`w-full flex ${esIzquierda ? 'justify-start' : 'justify-end'}`}>
                            <div className={`w-[calc(50%-2.5rem)] ${esIzquierda ? 'pr-2' : 'pl-2'}`}>
                              
                              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm transition hover:shadow-md hover:border-gray-300 relative group">
                                
                                {/* Hora (Esquina superior) */}
                                <p className="absolute top-5 right-5 text-xs text-gray-400 font-bold">
                                  {evento.hora}
                                </p>
                                
                                {/* Título */}
                                <h4 className="text-sm font-bold text-[#080E21] mb-1.5 pr-16">
                                  {evento.titulo}
                                </h4>
                                
                                {/* Descripción (Manejo de comillas de tu JSON) */}
                                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                  {evento.descripcion}
                                </p>

                                {/* Footer de la tarjeta: Autor */}
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                    <img 
                                      src={evento.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                                      alt="avatar" 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-500 truncate">
                                    {evento.autor}
                                  </span>
                                </div>

                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODALES --- */}

      {/* Modal: Edición de Caso */}
      {isEditModalOpen && (
        <Modal title="Editar Expediente" onClose={() => setIsEditModalOpen(false)}>
          <form onSubmit={handleGuardarEdicion} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label text="Título del Caso" />
              <Input name="titulo" value={formData.titulo} onChange={handleInputChange} />
            </div>
            <div>
              <Label text="Cliente" />
              <select name="cliente" value={formData.cliente} onChange={handleInputChange} className="w-full p-2 border rounded text-sm">
                {catalogos?.clientes?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <Label text="Contraparte" />
              <Input name="contraparte" value={formData.contraparte} onChange={handleInputChange} />
            </div>
            <div className="md:col-span-2">
              <Label text="Descripción" />
              <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} className="w-full p-2 border rounded h-32 text-sm resize-none" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold">Guardar Cambios</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Subir Documento */}
      {isUploadModalOpen && (
        <Modal title="Subir Documentación" onClose={() => setIsUploadModalOpen(false)}>
          <form onSubmit={handleUploadSubmit}>
            <div className="mb-4">
              <Label text="Tipo de Documento" />
              <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} className="w-full p-2 border rounded text-sm">
                <option value="">Seleccione...</option>
                {catalogos.catalogos?.tipos_documento?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current.click()} className="border-2 border-dashed p-10 text-center rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <p className="text-sm text-gray-500">{archivoSeleccionado ? archivoSeleccionado.name : "Arrastra o haz clic para subir un archivo"}</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm">Cerrar</button>
              <button type="submit" disabled={!archivoSeleccionado} className="bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold disabled:bg-gray-300">Subir</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Equipo */}
      {isEquipoModalOpen && (
        <Modal title="Añadir al Equipo" onClose={() => setIsEquipoModalOpen(false)}>
          <form onSubmit={handleAddMiembro}>
            <div className="mb-4">
              <Label text="Abogado" />
              <select value={nuevoMiembro.abogado_id} onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, abogado_id: e.target.value })} className="w-full p-2 border rounded text-sm">
                <option value="">Seleccionar...</option>
                {catalogos?.usuarios?.map(a => <option key={a.id} value={a.id}>{a.nombre_completo}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setIsEquipoModalOpen(false)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold">Añadir</button>
            </div>
          </form>
        </Modal>
      )}
      {/* Modal: Modificar Documento (Nueva Versión) */}
      {isModificarModalOpen && (
        <Modal title="Actualizar Versión de Documento" onClose={() => setIsModificarModalOpen(false)}>
          <form onSubmit={handleVersionSubmit}>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-800 font-semibold mb-1">Reemplazando archivo actual:</p>
              <p className="text-sm font-bold text-blue-900">{docAModificar?.nombre}</p>
            </div>

            {/* ZONA DE DRAG & DROP PARA LA VERSIÓN */}
            <div 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) setArchivoVersion(e.dataTransfer.files[0]);
              }} 
              onClick={() => fileVersionInputRef.current.click()} 
              className={`border-2 border-dashed p-10 text-center rounded-xl cursor-pointer transition-colors mb-4 ${archivoVersion ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-gray-50 border-gray-300'}`}
            >
              <input type="file" ref={fileVersionInputRef} onChange={handleFileVersionChange} className="hidden" />
              <p className="text-sm text-gray-600 font-medium">
                {archivoVersion ? `📄 ${archivoVersion.name}` : "Arrastra o haz clic para subir la NUEVA VERSIÓN"}
              </p>
            </div>

            {/* Comentarios del Cambio */}
            <div className="mb-4">
              <Label text="Comentarios sobre esta modificación (Opcional)" />
              <textarea 
                value={comentariosVersion} 
                onChange={(e) => setComentariosVersion(e.target.value)} 
                className="w-full p-2 border rounded text-sm resize-none h-20" 
                placeholder="Ej: Se corrigió la cláusula 4 a petición del cliente..."
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setIsModificarModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded">Cancelar</button>
              <button type="submit" disabled={!archivoVersion} className="bg-yellow-600 text-white px-6 py-2 rounded text-sm font-bold disabled:bg-gray-300 hover:bg-yellow-700 shadow-md">
                Subir Nueva Versión
              </button>
            </div>
          </form>
        </Modal>
      )}

    </main>
  );
};



/** --- COMPONENTES ATÓMICOS (Sub-componentes internos) --- */

const Badge = ({ text, color = 'blue' }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-bold ${color === 'green' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
    {text}
  </span>
);

const InfoBox = ({ label, value, color = 'text-gray-600' }) => (
  <div>
    <h4 className="text-sm font-bold text-[#080E21] mb-1">{label}</h4>
    <p className={`text-sm ${color}`}>{value}</p>
  </div>
);

const EmptyState = ({ icon, title, description, onAction }) => (
  <div className="py-20 text-center border-2 border-dashed rounded-xl bg-gray-50/30">
    <div className="text-4xl mb-4">{icon}</div>
    <h4 className="font-bold mb-2">{title}</h4>
    <p className="text-sm text-gray-500 mb-6">{description}</p>
    <button onClick={onAction} className="border px-6 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors">Comenzar ahora</button>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
      <div className="bg-[#080E21] p-4 flex justify-between items-center">
        <h2 className="text-white font-bold">{title}</h2>
        <button onClick={onClose} className="text-white text-xl">&times;</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const Label = ({ text }) => <label className="block text-xs font-bold text-gray-700 mb-1">{text}</label>;
const Input = ({ ...props }) => <input {...props} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" />;

export default DetalleExpediente;