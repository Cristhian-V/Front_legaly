import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'; // Agregamos useOutletContext
import casosService from '../services/casosService';
import authService from '../services/authService';
import docsService from '../services/docsService';

const DetalleExpediente = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Obtenemos los catálogos desde el Layout para los selects de edición
  const { catalogos, datosUsuario } = useOutletContext() || {};

  // --- ESTADOS PESTAÑAS ---
  const [pestañaActiva, setPestañaActiva] = useState('general');
  const [detalleCaso, setDetalleCaso] = useState({});
  const [documentos, setDocumentos] = useState([]);

  // Referencia oculta para abrir el explorador de archivos al hacer clic en el cuadro
  const fileInputRef = useRef(null);

  // --- ESTADOS Y REF PARA SUBIR DOCUMENTOS ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  // --- ESTADOS PARA EL MODAL DE EDICIÓN ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [idForm, setIdForm] = useState(null); // Para almacenar el ID del caso a editar
  const [formData, setFormData] = useState({
    cliente: '',
    titulo: '',
    descripcion: '',
    areaLegal: '',
    responsable: '',
    contraparte: ''
  });

  const autenticado = async () => {
    const esAuth = await authService.isAuthenticated();
    if (!esAuth) {
      navigate('/login');
    }
  };

  const cargarDetalleCaso = async () => {
    try {
      const respuestaDetalleCaso = await casosService.obtenerDetalleCaso(id);
      setDetalleCaso(respuestaDetalleCaso);
    } catch (error) {
      console.error("Error al cargar los datos del caso:", error);
    }
  };

  const cargarDocumentos = async () => {
    try {
      const respuestaDocumentos = await docsService.obtenerDocumentosCaso(id);
      console.log("Documentos obtenidos del backend:", respuestaDocumentos); // <-- LOG PARA VER QUÉ LLEGA
      setDocumentos(respuestaDocumentos);
    } catch (error) {
      console.error("Error al cargar los documentos del caso:", error);
    }
  };

  const cargarIdForm = async () => {
    try {
      const respuestaIdForm = await casosService.obtenerIdForm(id);
      setIdForm(respuestaIdForm);
    } catch (error) {
      console.error("Error al cargar el ID del formulario:", error);
    }
  };

  useEffect(() => {
    autenticado();
    cargarDetalleCaso();
    cargarIdForm();
    cargarDocumentos();
  }, [id]); // Agregamos 'id' a las dependencias por buena práctica

  // Clases para las pestañas
  const tabStyle = "pb-4 px-2 font-semibold text-sm transition-colors cursor-pointer border-b-2 ";
  const activeTabStyle = tabStyle + "border-[#080E21] text-[#080E21]";
  const inactiveTabStyle = tabStyle + "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300";

  // --- FUNCIONES DEL MODAL DE EDICIÓN ---

  // 1. Abrir modal y pre-cargar los datos actuales
  const abrirModalEdicion = () => {
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

  // 2. Manejar cambios en los inputs
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 3. Guardar cambios
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {

      await casosService.modificarCaso(id, formData);

      // Cerramos el modal
      setIsEditModalOpen(false);

      // Recargamos los datos para que se vea el cambio reflejado inmediatamente
      cargarDetalleCaso();
    } catch (error) {
      console.error("Error al actualizar el caso:", error);
    }
  };

  // --- FUNCIONES PARA DRAG & DROP ---
  const handleDragOver = (e) => {
    e.preventDefault(); // Evita que el navegador intente abrir el PDF por su cuenta
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setArchivoSeleccionado(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivoSeleccionado(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!archivoSeleccionado) {
      alert("Por favor selecciona un archivo primero.");
      return;
    }
    if (!tipoDocumento) {
      alert("Por favor selecciona el tipo de documento.");
      return;
    } try {
      // 1. Creamos el FormData (Es como un sobre de correo para archivos pesados)
      const formData = new FormData();

      // 'archivo' debe llamarse exactamente igual que en upload.single('archivo') del backend
      formData.append('archivo', archivoSeleccionado);

      // También podemos enviar datos de texto extra en el mismo "sobre"

      formData.append('tipoDocumento', tipoDocumento);
      formData.append('expediente_id', id); // El ID de la URL
      formData.append('usuario_id', datosUsuario?.id);
      formData.append('pesoMB', archivoSeleccionado.size / (1024 * 1024));
      // 2. Enviamos el formulario al backend con la función que creamos en docsService
      await docsService.subirDocumentoCaso(formData);

      // 3. Limpiamos y cerramos
      setArchivoSeleccionado(null);
      setTipoDocumento('');
      setIsUploadModalOpen(false);

      // OPCIONAL: Volver a cargar el detalle del caso para que el archivo aparezca en la tabla
      cargarDocumentos();

    } catch (error) {
      // AQUÍ ATRAPAMOS EL MENSAJE ESPECÍFICO DEL BACKEND
      if (error.response && error.response.data && error.response.data.error) {
        // Mostrará: "El archivo que quiere subir ya está en el sistema."
        alert(error.response.data.error);
      } else {
        alert("Hubo un error al intentar conectar con el servidor.");
      }
    }
  };

  const handleVerDocumento = (rutaArchivo) => {
    // Si url_archivo viene vacío o nulo de la base de datos
    if (!rutaArchivo) {
      alert("Este documento no tiene una ruta de archivo válida asociada.");
      return;
    }

    // Usamos encodeURIComponent para proteger los espacios y barras de la ruta
    const urlDelArchivo = `http://localhost:3000/api/docs/ver?ruta=${encodeURIComponent(rutaArchivo)}`;

    window.open(urlDelArchivo, '_blank');
  };

  const handleEliminarDocumento = async (docId) => {
    // Si url_archivo viene vacío o nulo de la base de datos
    
    await docsService.eliminarDocumentoCaso(docId)
    cargarDocumentos();
  };

  return (
    <main className="p-8 max-w-7xl mx-auto relative">

      {/* Botón Volver */}
      <button
        onClick={() => navigate('/expedientes')}
        className="flex items-center text-gray-500 hover:text-[#080E21] font-medium text-sm mb-6 transition-colors"
      >
        <span className="mr-2">←</span> Volver a Casos
      </button>

      {/* Encabezado del Caso */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-600">
            {detalleCaso.caso?.categoria_cliente}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-600">
            {detalleCaso.caso?.expediente_id}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
            {detalleCaso.caso?.estado}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-[#080E21]">{detalleCaso.caso?.titulo} - {detalleCaso.caso?.nombre_cliente}</h1>
          <div className="flex gap-3">
            {/* BOTÓN EDITAR CONECTADO AL MODAL */}
            <button
              onClick={abrirModalEdicion}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              Editar
            </button>
            <button className="px-4 py-2 bg-[#212A3E] text-white font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm">
              Acciones
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div className="border-b border-gray-200 mb-8 flex gap-8">
        <button onClick={() => setPestañaActiva('general')} className={pestañaActiva === 'general' ? activeTabStyle : inactiveTabStyle}>Información General</button>
        <button onClick={() => setPestañaActiva('documentos')} className={pestañaActiva === 'documentos' ? activeTabStyle : inactiveTabStyle}>Documentos</button>
        <button onClick={() => setPestañaActiva('equipo')} className={pestañaActiva === 'equipo' ? activeTabStyle : inactiveTabStyle}>Equipo Legal</button>
        <button onClick={() => setPestañaActiva('historial')} className={pestañaActiva === 'historial' ? activeTabStyle : inactiveTabStyle}>Historial y Actividad</button>
      </div>

      {/* Contenido de la Pestaña: Información General */}
      {pestañaActiva === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#080E21] mb-4">Descripción del Caso</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {detalleCaso.caso?.descripcion}
              </p>
            </div>
            <hr className="border-gray-100 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-4">
              <div>
                <h4 className="text-sm font-bold text-[#080E21] mb-1">Cliente</h4>
                <p className="text-gray-600">{detalleCaso.caso?.nombre_cliente}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#080E21] mb-1">Contraparte</h4>
                <p className="text-gray-600">{detalleCaso.caso?.contraparte || 'No especificada'}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#080E21] mb-1">Fecha de Inicio</h4>
                <p className="text-gray-600">{detalleCaso.caso?.fecha_inicio}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#080E21] mb-1">Vencimiento</h4>
                <p className="text-red-500 font-semibold">Esperando fecha VEN</p>
              </div>
            </div>
          </div>

          {/* Tarjeta Derecha (Estado) */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-8 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-[#080E21] mb-6">Estado Actual</h3>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-start gap-3 mb-8">
              <span className="text-gray-400 text-xl mt-0.5">🕒</span>
              <div>
                <h4 className="font-bold text-[#080E21] text-sm">{detalleCaso.caso?.estado}</h4>
                <p className="text-gray-500 text-xs mt-1">Esperando historial...</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Contenido de la Pestaña: Documentos */}
      {pestañaActiva === 'documentos' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">

          {/* Cabecera de la sección */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#080E21]">Documentos del Expediente</h3>
              <p className="text-sm text-gray-500">Gestiona los archivos y pruebas de este caso</p>
            </div>
            {/* Botón principal para subir documentos (Siempre visible) */}
            <button
              onClick={() => setIsUploadModalOpen(true)} // <-- AÑADIR ESTO
              className="bg-[#0F172A] hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition flex items-center gap-2 text-sm"
            >
              <span>+</span> Subir Documento
            </button>
          </div>

          {/* Renderizado Condicional: ¿Hay documentos en el backend? */}
          {(!documentos.documentacion || documentos.documentacion.length === 0) ? (

            /* --- VISTA 1: NO HAY DOCUMENTOS (Empty State) --- */
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center justify-center bg-gray-50/50">
              <span className="text-5xl mb-4 grayscale opacity-60">📄</span>
              <h4 className="text-xl font-bold text-[#080E21] mb-2">Aún no hay archivos</h4>
              <p className="text-gray-500 mb-6 max-w-md">
                No se encontró ningún documento relacionado a este caso. Te sugerimos <strong className="text-gray-700">subir la carátula del caso como primer documento</strong> para comenzar a armar el expediente.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)} // <-- AÑADIR ESTO
                className="bg-white border border-gray-300 hover:bg-gray-50 text-[#080E21] font-bold py-2.5 px-6 rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <span>📁</span> Subir Carátula
              </button>
            </div>

          ) : (

            /* --- VISTA 2: SÍ HAY DOCUMENTOS (Filas/Tabla) --- */
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 font-semibold">Nombre del Archivo</th>
                    <th className="p-4 font-semibold">Tipo Documento</th>
                    <th className="p-4 font-semibold">Fecha de Subida</th>
                    <th className="p-4 font-semibold">Subido Por</th>
                    <th className="p-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Iteramos sobre los documentos que vengan de la BD */}
                  {documentos.documentacion.map((doc, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 flex items-center gap-3">
                        {/* Icono de PDF o Word */}
                        <span className="text-2xl">{doc.extension === '.pdf' ? '📕' : '📘'}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{doc.nombre}</p>
                          <p className="text-xs text-gray-500">{doc.pesomb} MB</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                          {doc.tipo_documento || 'General'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{doc.fecha_subida}</td>
                      <td className="p-4 text-sm text-gray-600">{doc.responsable}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleVerDocumento(doc.url_archivo)}
                          className="text-blue-600 hover:text-blue-900 font-semibold text-sm px-3 py-1.5 rounded hover:bg-blue-100 transition mr-2"
                        >
                          Ver
                        </button>
                        <button 
                        onClick={() => handleEliminarDocumento(doc.id)}
                        className="text-gray-500 hover:text-red-600 font-semibold text-sm px-3 py-1.5 rounded hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {pestañaActiva === 'equipo' && <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">Sección de Equipo en construcción...</div>}
      {pestañaActiva === 'historial' && <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">Sección de Historial en construcción...</div>}

      {/* --- MODAL DE EDICIÓN CON GLASSMORPHISM --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md">
          {/* Contenedor del Formulario */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">

            <div className="bg-[#080E21] px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Crear Nuevo Expediente</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-300 hover:text-white text-2xl font-light">×</button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Título */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Título / Descripción Corta *</label>
                  <input type="text" name="titulo" required value={formData.titulo} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Demanda Laboral Juan Pérez" />
                </div>

                {/* Cliente (Catálogo) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente *</label>
                  <select name="cliente" required value={formData.cliente} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Seleccione un cliente...</option>
                    {/* Asegúrate de que 'clientes' exista en tus catálogos de Layout.jsx */}
                    {catalogos?.clientes?.map((cli, i) => (
                      <option key={i} value={cli.id}>{cli.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Contraparte */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Contraparte</label>
                  <input type="text" name="contraparte" value={formData.contraparte} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre de la contraparte" />
                </div>

                {/* Área Legal (Catálogo) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Área Legal *</label>
                  <select name="areaLegal" required value={formData.areaLegal} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Seleccione el área...</option>
                    {catalogos?.catalogos?.area_legal?.map((area, i) => (
                      <option key={i} value={area.id}>{area.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Abogado Responsable (Catálogo) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Abogado Responsable *</label>
                  <select name="responsable" required value={formData.responsable} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Asignar a...</option>
                    {catalogos?.usuarios?.map((abogado, i) => (
                      <option key={i} value={abogado.id}>{abogado.nombre_completo}</option>
                    ))}
                  </select>
                </div>

                {/* Descripción Completa */}
                <div className="md:col-span-2 mt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción del Caso</label>
                  <textarea name="descripcion" rows="4" value={formData.descripcion} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Detalle los antecedentes y objetivos del caso..."></textarea>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-gray-600 font-semibold rounded hover:bg-gray-100 transition">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded shadow transition">
                  Guardar Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- MODAL PARA SUBIR DOCUMENTOS (Glassmorphism) --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">

            <div className="bg-[#080E21] px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Subir Nuevo Documento</h2>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setArchivoSeleccionado(null);
                  setTipoDocumento('');
                }}
                className="text-gray-300 hover:text-white text-2xl font-light"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6">

              {/* Campo Usuario (Fijo/Bloqueado) */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Usuario que sube el archivo</label>
                <div className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded text-gray-500 cursor-not-allowed flex items-center gap-2">
                  <span>👤</span> {datosUsuario?.nombre_completo || 'Usuario Desconocido'}
                </div>
              </div>

              {/* Categoría / Tipo de Documento */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Documento *</label>
                <select
                  required
                  value={catalogos.catalogos?.tipos_documento?.find(tipo => tipo.id === tipoDocumento)?.id || tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Seleccione una categoría...</option>
                  {catalogos.catalogos?.tipos_documento?.map((tipo, i) => (
                    <option key={i} value={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              {/* ZONA DE DRAG & DROP */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${archivoSeleccionado ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
              >
                {/* Input file oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />

                {archivoSeleccionado ? (
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2 text-blue-600">📄</span>
                    <p className="font-semibold text-gray-800 text-sm truncate w-full px-4">
                      {archivoSeleccionado.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(archivoSeleccionado.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que se abra el explorador al hacer clic en eliminar
                        setArchivoSeleccionado(null);
                      }}
                      className="mt-3 text-red-500 hover:text-red-700 text-xs font-bold underline"
                    >
                      Quitar archivo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-70">
                    <span className="text-4xl mb-3">📂</span>
                    <p className="font-bold text-gray-700 text-sm mb-1">Haz clic para buscar o arrastra un archivo aquí</p>
                    <p className="text-xs text-gray-500">PDF, Word o Imágenes (Max 10MB)</p>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setArchivoSeleccionado(null);
                    setTipoDocumento('');
                  }}
                  className="px-5 py-2 text-gray-600 font-semibold rounded hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!archivoSeleccionado}
                  className={`px-5 py-2 text-white font-semibold rounded shadow transition ${archivoSeleccionado ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                  Subir y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default DetalleExpediente;