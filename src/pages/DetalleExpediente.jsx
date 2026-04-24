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

  // --- ESTADOS PARA ACCIONES Y REVISIONES ---
  const [isAccionesOpen, setIsAccionesOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionData, setRevisionData] = useState({
    revisor_id: '',
    comentarios_solicitud: '',
    documentos_ids: [] // Array para guardar los IDs de los documentos seleccionados
  });

  // ---  ESTADOS PARA CREAR DOCUMENTO ONLINE ---
  const [isCrearDocOpen, setIsCrearDocOpen] = useState(false);
  const [nuevoDocData, setNuevoDocData] = useState({
    nombreArchivo: '',
    tipoPlantilla: 'word', // Por defecto word
    tipoDocumento: ''
  });

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

  // --- ESTADOS PARA ATENDER REVISIÓN (JEFE) ---
  const [isEvaluarModalOpen, setIsEvaluarModalOpen] = useState(false);
  const [evaluacionData, setEvaluacionData] = useState({
    estado_revision_id: '', // 2 = Aprobado, 3 = Con Observaciones
    comentarios_revisor: ''
  });

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
        casosService.obtenerHistorialCaso(id),
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

  // --- 5.1 LOGICA PARA DATOS GENRALES DEL CASO (BADGES, FECHAS, ETC) ---

  // --- FILTRADO DE REVISIONES PARA EL CUADRO LATERAL ---
  // Buscamos eventos de tipo revisión en todo el historial
  const revisionesRecientes = historialCaso.historial
    .flatMap(grupo => grupo.eventos) // Unificamos todos los eventos en un solo array
    .filter(evento =>
      evento.tipo === 'solicitud_revision' ||
      evento.tipo === 'revision_completada' ||
      evento.tipo === 'levantar_observaciones' // Añade aquí los tipos que uses en el back
    )
    .slice(0, 4); // Mostramos solo las 4 más recientes para que el cuadro no sea gigante

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

const handleDescargarDocumento = async (ruta) => {
    if (!ruta) return alert("Ruta no válida");
    
    try {
      // 1. Obtenemos el archivo puro (Blob)
      const fileBlob = await docsService.descargarDocumento(ruta);
      
      // 2. Le creamos una URL temporal
      const fileURL = URL.createObjectURL(fileBlob);
      
      // 3. ELIMINAMOS window.open(fileURL, '_blank'); <-- ¡Esta era la culpable!

      // 4. Descargamos el archivo directamente con su nombre original
      const link = document.createElement('a');
      link.href = fileURL;  
      
      // Extraemos el nombre del archivo de la ruta (Ej. "contrato.pdf")
      // Nota: Usamos replace(/\\/g, '/') para asegurar que funcione en Windows y Linux
      const nombreArchivo = ruta.replace(/\\/g, '/').split('/').pop(); 
      
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); // Limpiamos el DOM

      // 5. Limpiamos la memoria
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
      
    } catch (error) {
      alert("Error al intentar descargar el archivo: " + error);
    }
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

  // --- 8. LOGICA DE REVISIONES DE CASOS (ENVIO DE SOLICITUDES)
  // Manejador para abrir el modal
  const abrirModalRevision = () => {
    setRevisionData({ revisor_id: '', comentarios_solicitud: '', documentos_ids: [] });
    setIsRevisionModalOpen(true);
    setIsAccionesOpen(false); // Cerramos el menú desplegable
  };
  // Abrir modal de evaluación
  const abrirModalEvaluar = () => {
    setEvaluacionData({ estado_revision_id: '', comentarios_revisor: '' });
    setIsEvaluarModalOpen(true);
    setIsAccionesOpen(false); // Cierra el dropdown
  };


  // Manejador para los checkboxes de documentos
  const handleDocCheckboxChange = (docId) => {
    setRevisionData(prev => {
      const yaSeleccionado = prev.documentos_ids.includes(docId);
      if (yaSeleccionado) {
        // Si ya estaba, lo quitamos del array
        return { ...prev, documentos_ids: prev.documentos_ids.filter(id => id !== docId) };
      } else {
        // Si no estaba, lo añadimos
        return { ...prev, documentos_ids: [...prev.documentos_ids, docId] };
      }
    });
  };

  // Manejador para enviar la solicitud al backend
  const handleSolicitarRevision = async (e) => {
    e.preventDefault();
    if (!revisionData.revisor_id) return alert("Debes seleccionar un revisor.");

    try {
      // AQUÍ HACES EL POST A TU BACKEND
      console.log("Datos a enviar para solicitud de revisión:", id, revisionData);
      await casosService.solicitarRevision(id, revisionData.revisor_id, revisionData.comentarios_solicitud, revisionData.documentos_ids);

      console.log("Enviando al backend:", revisionData);
      alert("Solicitud de revisión enviada exitosamente.");

      setIsRevisionModalOpen(false);
      inicializarPagina(); // Recargamos todo para actualizar el estado visual del caso
      // Opcional: Recargar el historial para que aparezca el evento de solicitud
      // const resHistorial = await casosService.obtenerHistorialCaso(id);
      // setHistorialCaso(resHistorial);

    } catch (error) {
      console.error("Error al solicitar revisión:", error);
      alert("Hubo un error al enviar la solicitud.");
    }
  };


  // Enviar evaluación al backend
  const handleEvaluarSubmit = async (e) => {
    e.preventDefault();
    if (!evaluacionData.estado_revision_id) return alert("Por favor, selecciona una decisión.");

    try {
      // IMPORTANTE: Necesitas el ID de la revisión activa.
      // Asumo que tu backend manda esto en el detalle del caso, ej: detalleCaso.caso.revision_actual_id
      // Si se llama diferente, ajusta esta variable:

      const idRevision = await casosService.obtenerRevisionActiva(id); // Implementa esta función para obtener el ID de la revisión activa del caso
      console.log("ID de revisión activa:", idRevision);
      if (!idRevision.id_activo) {
        return alert("Error: No se encontró el ID de la revisión en curso.");
      }

      await casosService.aprobarObservarCaso(idRevision.id_activo, evaluacionData);

      alert("La revisión ha sido completada y notificada al equipo.");
      setIsEvaluarModalOpen(false);
      navigate('/revisiones'); // Redirige a la bandeja de revisiones para ver el cambio reflejado


    } catch (error) {
      console.error("Error al enviar la evaluación:", error);
      alert("Hubo un error al procesar tu respuesta.");
    }
  };

  // LOGICA DE CREACION DE ARCHIVO EN BLANCO DESDE LA PLATAFORMA (WORD EXCEL, ETC)
  // Función para evaluar si el archivo es ofimática (Word, Excel, PPT)
  const esEditableOnline = (extension) => {
    const ext = extension?.toLowerCase().replace('.', '') || '';
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  };

  // Función para abrir la pestaña del editor de Collabora
  const handleAbrirOnline = (docId) => {
    // Esta es la URL de tu frontend que embebe Collabora (Bloque 2)
    const wopiUrl = `https://office.cumbre.com.bo/browser/dist/cool.html?WOPISrc=https://api.cumbre.com.bo/wopi/files/${docId}`;
    window.open(wopiUrl, '_blank'); // Abrimos en nueva pestaña para tener pantalla completa
  };

  // Manejador para guardar el documento en blanco
  const handleCrearDocBlanco = async (e) => {
    e.preventDefault();
    if (!nuevoDocData.nombreArchivo || !nuevoDocData.tipoDocumento) {
      return alert("Completa el nombre y el tipo de documento.");
    }

    try {
      setCargando(true);
      // 1. Llamamos a tu Bloque 1 (Backend crea el archivo)
      const res = await docsService.crearDocumentoBlanco(id, nuevoDocData);

      // 2. Cerramos modal y recargamos tabla
      setIsCrearDocOpen(false);
      setNuevoDocData({ nombreArchivo: '', tipoPlantilla: 'word', tipoDocumento: '' });

      const resDocs = await docsService.obtenerDocumentosCaso(id);
      setDocumentos(resDocs);

      // 3. (Opcional UX) Preguntamos si quiere abrirlo de inmediato
      if (window.confirm("Documento creado exitosamente. ¿Deseas abrir el editor ahora?")) {
        // Asegúrate de extraer el ID correctamente según tu JSON ("documentacion.id")
        handleAbrirOnline(res.documentacion.id);
      }

    } catch (error) {
      console.error(error);
      alert("Error al crear el documento en blanco.");
    } finally {
      setCargando(false);
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
            {/* BOTÓN DESPLEGABLE DE ACCIONES */}
            <div className="relative">
              <button
                onClick={() => setIsAccionesOpen(!isAccionesOpen)}
                className="px-4 py-2 bg-[#212A3E] text-white rounded-lg hover:bg-slate-800 font-semibold shadow-sm flex items-center gap-2 transition-colors"
              >
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
                              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                            >
                              <span className="text-lg">👀</span> Solicitar Revisión
                            </button>
                          )}

                          {/* ESCENARIO 2: PENDIENTE (1) para dueño el caso */}
                          {(estadoRev === "Pendiente" && revisionesRecientes[0].autor_id === datosUsuario.id) && (
                            <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors">
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
                              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-3 transition-colors"
                            >
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
            <hr className="mb-6 border-gray-100" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InfoBox label="Cliente" value={detalleCaso.caso?.nombre_cliente} />
              <InfoBox label="Contraparte" value={detalleCaso.caso?.contraparte || 'No especificada'} />
              <InfoBox label="Fecha Inicio" value={detalleCaso.caso?.fecha_inicio} />
              <InfoBox label="Vencimiento" value="Próximamente" color="text-red-500" />
            </div>
          </div>

          {/* NUEVO CUADRO: MONITOR DE REVISIONES */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-fit">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#080E21]">Revisiones</h3>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${detalleCaso.caso?.estado_revision === 'Aprobado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                {detalleCaso.caso?.estado_revision}
              </span>
            </div>

            <div className="space-y-6 relative">
              {/* Línea vertical decorativa */}
              <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-100"></div>

              {revisionesRecientes.length > 0 ? (
                revisionesRecientes.map((rev, idx) => (
                  <div key={rev.id || idx} className="relative pl-8">
                    {/* Punto indicador */}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${rev.tipo === 'revision_completada' ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                      <span className="text-[10px] text-white">
                        {rev.tipo === 'revision_completada' ? '✓' : '👁'}
                      </span>
                    </div>

                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-gray-800">{rev.titulo}</p>
                      <span className="text-[10px] text-gray-400 font-medium">{rev.hora}</span>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed italic bg-gray-50 p-2 rounded border border-gray-100">
                      "{rev.descripcion}"
                    </p>

                    <div className="mt-2 flex items-center gap-1.5">
                      <img src={rev.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} className="w-4 h-4 rounded-full" alt="avatar" />
                      <span className="text-[10px] text-gray-400 font-semibold">{rev.autor}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400">No hay revisiones registradas aún.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setPestañaActiva('historial')}
              className="w-full mt-6 py-2 text-xs font-bold text-gray-400 hover:text-[#080E21] transition-colors border-t border-gray-100 pt-4"
            >
              Ver historial completo →
            </button>
          </div>

        </div>
      )}

      {/* PESTAÑA: DOCUMENTOS */}
      {pestañaActiva === 'documentos' && (
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Documentos del Expediente</h3>
            <div className="flex gap-3">
              <button onClick={() => setIsCrearDocOpen(true)} className="bg-white border-2 border-[#0F172A] text-[#0F172A] hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition">
                + Doc en Blanco
              </button>
              <button onClick={() => setIsUploadModalOpen(true)} className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition">
                + Subir Documento
              </button>
            </div>
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

                        {/* NUEVO BOTÓN: Solo se muestra si es doc/docx, xls/xlsx, ppt/pptx */}
                        {esEditableOnline(doc.extension) && (
                          <button
                            onClick={() => handleAbrirOnline(doc.id)}
                            className="text-green-600 hover:text-green-800 font-bold text-xs mr-4 transition flex items-center inline-flex gap-1"
                          >
                            <span>📝</span> Abrir Editor
                          </button>
                        )}

                        <button onClick={() => handleDescargarDocumento(doc.url_archivo)} className="text-blue-600 hover:text-blue-800 font-bold text-xs mr-4">Descargar</button>
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

      {/* Modal: Solicitar Revisión */}
      {isRevisionModalOpen && (
        <Modal title="Solicitar Revisión" onClose={() => setIsRevisionModalOpen(false)}>
          <form onSubmit={handleSolicitarRevision}>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
              <p className="text-sm text-blue-800">
                Al enviar esta solicitud, el revisor seleccionado recibirá una notificación. Si no seleccionas ningún documento en específico, se entenderá que solicitas una <strong>revisión general</strong> de todo el expediente.
              </p>
            </div>

            {/* Selector de Revisor */}
            <div className="mb-5">
              <Label text="Seleccionar Revisor *" />
              <select
                required
                value={revisionData.revisor_id}
                onChange={(e) => setRevisionData({ ...revisionData, revisor_id: e.target.value })}
                className="w-full p-2.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">¿Quién revisará este caso?</option>
                {/* Asumiendo que usas catalogos.usuarios para elegir al jefe o revisor */}
                {catalogos?.usuarios?.map(user => (
                  <option key={user.id} value={user.id}>{user.nombre_completo}</option>
                ))}
              </select>
            </div>

            {/* Comentarios */}
            <div className="mb-6">
              <Label text="Comentarios o instrucciones para el revisor" />
              <textarea
                value={revisionData.comentarios_solicitud}
                onChange={(e) => setRevisionData({ ...revisionData, comentarios_solicitud: e.target.value })}
                className="w-full p-3 border rounded text-sm resize-none h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej. Por favor revisa detenidamente la cláusula 3 de los contratos anexados..."
              />
            </div>

            {/* Selección de Documentos (Opcional) */}
            <div className="mb-6">
              <Label text="Documentos específicos a revisar (Opcional)" />

              <div className="border rounded-lg max-h-48 overflow-y-auto bg-gray-50/30 p-2">
                {(!documentos.documentacion || documentos.documentacion.length === 0) ? (
                  <p className="text-xs text-gray-500 text-center py-4">No hay documentos en este caso.</p>
                ) : (
                  documentos.documentacion.map(doc => (
                    <label key={doc.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={revisionData.documentos_ids.includes(doc.id)}
                        onChange={() => handleDocCheckboxChange(doc.id)}
                      />
                      <span className="text-xl">{getFileIcon(doc.extension)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{doc.nombre}</p>
                        <p className="text-xs text-gray-400">Subido el: {doc.fecha_subida}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="px-5 py-2 text-gray-600 font-bold rounded hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#080E21] hover:bg-slate-800 text-white font-bold rounded shadow-md transition"
              >
                Enviar Solicitud
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* Modal: Atender Revisión (Jefe/Revisor) */}
      {isEvaluarModalOpen && (
        <Modal title="Atender Revisión de Expediente" onClose={() => setIsEvaluarModalOpen(false)}>
          <form onSubmit={handleEvaluarSubmit}>

            <p className="text-sm text-gray-600 mb-4">
              Selecciona el resultado de tu revisión. Esta acción cambiará el estado del caso y notificará al abogado responsable.
            </p>

            {/* Tarjetas de Decisión (Radio Cards) */}
            <div className="grid grid-cols-2 gap-4 mb-6">

              {/* Opción: APROBADO (Estado 2) */}
              <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${evaluacionData.estado_revision_id === 2
                ? 'border-green-500 bg-green-50 shadow-md'
                : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                }`}>
                <input
                  type="radio"
                  name="decision"
                  className="hidden"
                  onChange={() => setEvaluacionData({ ...evaluacionData, estado_revision_id: 2 })}
                />
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${evaluacionData.estado_revision_id === 2 ? 'border-green-500' : 'border-gray-300'}`}>
                    {evaluacionData.estado_revision_id === 2 && <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>}
                  </div>
                  <span className="text-green-700 font-bold">Aprobar Caso</span>
                </div>
                <p className="text-xs text-gray-500 ml-8">Todo está correcto. El caso puede continuar su curso normal.</p>
              </label>

              {/* Opción: CON OBSERVACIONES (Estado 3) */}
              <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${evaluacionData.estado_revision_id === 3
                ? 'border-orange-500 bg-orange-50 shadow-md'
                : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                }`}>
                <input
                  type="radio"
                  name="decision"
                  className="hidden"
                  onChange={() => setEvaluacionData({ ...evaluacionData, estado_revision_id: 3 })}
                />
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${evaluacionData.estado_revision_id === 3 ? 'border-orange-500' : 'border-gray-300'}`}>
                    {evaluacionData.estado_revision_id === 3 && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>}
                  </div>
                  <span className="text-orange-700 font-bold">Devolver (Observar)</span>
                </div>
                <p className="text-xs text-gray-500 ml-8">Existen errores o documentos faltantes que deben corregirse.</p>
              </label>

            </div>

            {/* Comentarios del Revisor */}
            <div className="mb-6">
              <Label text={`Comentarios y Feedback ${evaluacionData.estado_revision_id === 3 ? '(Obligatorio)' : '(Opcional)'}`} />
              <textarea
                required={evaluacionData.estado_revision_id === 3} // Obligatorio si rechaza
                value={evaluacionData.comentarios_revisor}
                onChange={(e) => setEvaluacionData({ ...evaluacionData, comentarios_revisor: e.target.value })}
                className={`w-full p-3 border rounded text-sm resize-none h-28 outline-none focus:ring-2 ${evaluacionData.estado_revision_id === 3 ? 'focus:ring-orange-500 border-orange-200' : 'focus:ring-green-500'
                  }`}
                placeholder={evaluacionData.estado_revision_id === 3
                  ? "Describe los errores encontrados para que el abogado pueda subsanarlos..."
                  : "Comentarios adicionales para el abogado (opcional, pero recomendado para mejorar la comunicación)"}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEvaluarModalOpen(false)}
                className="px-5 py-2 text-gray-600 font-bold rounded hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!evaluacionData.estado_revision_id}
                className={`px-6 py-2 text-white font-bold rounded shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed ${evaluacionData.estado_revision_id === 3 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                Confirmar Evaluación
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* Modal: Crear Documento en Blanco */}
      {isCrearDocOpen && (
        <Modal title="Crear Nuevo Documento (Online)" onClose={() => setIsCrearDocOpen(false)}>
          <form onSubmit={handleCrearDocBlanco}>
            
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
              <p className="text-sm text-blue-800">
                Se generará un archivo en blanco en el servidor. Luego podrás abrirlo directamente en el <strong>Editor en la Nube</strong>.
              </p>
            </div>

            <div className="mb-4">
              <Label text="Nombre del Archivo *" />
              <input 
                required
                type="text"
                placeholder="Ej. Contrato de Prestación de Servicios"
                value={nuevoDocData.nombreArchivo}
                onChange={(e) => setNuevoDocData({...nuevoDocData, nombreArchivo: e.target.value})}
                className="w-full p-2.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label text="Formato (Plantilla) *" />
                <select 
                  value={nuevoDocData.tipoPlantilla}
                  onChange={(e) => setNuevoDocData({...nuevoDocData, tipoPlantilla: e.target.value})}
                  className="w-full p-2.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="word">Word (.docx)</option>
                  <option value="excel">Excel (.xlsx)</option>
                  {/* Opcional: <option value="ppt">PowerPoint (.pptx)</option> */}
                </select>
              </div>

              <div>
                <Label text="Categoría del Documento *" />
                <select 
                  required
                  value={nuevoDocData.tipoDocumento}
                  onChange={(e) => setNuevoDocData({...nuevoDocData, tipoDocumento: e.target.value})}
                  className="w-full p-2.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Seleccione...</option>
                  {/* Asumiendo que tu contexto se llama catalogos.catalogos.tipos_documento */}
                  {catalogos?.catalogos?.tipos_documento?.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setIsCrearDocOpen(false)} 
                className="px-5 py-2 text-gray-600 font-bold rounded hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-md transition"
              >
                Crear y Guardar
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