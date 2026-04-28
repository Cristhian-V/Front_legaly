import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import carpetasService from '../services/carpetasService';

const DetalleCarpeta = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { catalogos } = useOutletContext() || {}; // Usamos los catálogos para Usuarios y Tipos de Doc

  const [carpeta, setCarpeta] = useState({});
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS PARA MODALES ---
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const fileInputRef = useRef(null);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [docAccionActivo, setDocAccionActivo] = useState(null); // Guarda el ID del doc que estamos compartiendo/vinculando
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);

  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkData, setLinkData] = useState({ caso_id: '', tipo_documento_id: '' });

  // --- ESTADOS PARA CREAR DOCUMENTO ONLINE ---
  const [isCrearDocOpen, setIsCrearDocOpen] = useState(false);
  const [nuevoDocData, setNuevoDocData] = useState({
    nombreArchivo: '',
    tipoPlantilla: 'word',
    tipoDocumento: '' // Úsalo si tu tabla de docs_sueltos también requiere clasificarlo
  });

  // (Opcional) Necesitarás traer la lista de casos activos del usuario para el select del Modal Vincular
  // const [casosUsuario, setCasosUsuario] = useState([]); 

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const data = await carpetasService.obtenerDetalleCarpeta(id);
      setCarpeta(data.nombre_carpeta);
      setDocumentos(data.documentos || []);
    } catch (error) {
      console.error("Error al cargar la carpeta:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  // --- A. SUBIR DOCUMENTO ---
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!archivoSeleccionado) return alert("Selecciona un archivo.");

    try {
      const formData = new FormData();
      formData.append('archivo', archivoSeleccionado);

      await carpetasService.subirDocumento(id, formData);
      setIsUploadOpen(false);
      setArchivoSeleccionado(null);
      await cargarDatos();
    } catch (error) {
      alert("Error al subir el archivo: " + error);
    }
  };

  // --- B. COMPARTIR DOCUMENTO ---
  const abrirModalCompartir = (doc) => {
    setDocAccionActivo(doc.documento_id);
    setUsuariosSeleccionados([]);
    setIsShareOpen(true);
  };

  const handleCompartirSubmit = async (e) => {
    e.preventDefault();
    if (usuariosSeleccionados.length === 0) return alert("Selecciona al menos un usuario.");
    try {
      await carpetasService.compartirDocumento(docAccionActivo, usuariosSeleccionados);
      alert("Documento compartido exitosamente.");
      setIsShareOpen(false);
    } catch (error) {
      alert("Error al compartir el documento: " + error);
    }
  };

  const toggleUsuario = (userId) => {
    setUsuariosSeleccionados(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // --- C. VINCULAR A CASO ---
  const abrirModalVincular = (doc) => {
    setDocAccionActivo(doc.documento_id);
    setLinkData({ caso_id: '', tipo_documento_id: '' });
    setIsLinkOpen(true);
  };

  const handleVincularSubmit = async (e) => {
    e.preventDefault();
    if (!linkData.caso_id || !linkData.tipo_documento_id) return alert("Completa todos los campos.");
    try {
      await carpetasService.vincularACaso(docAccionActivo, linkData.caso_id, linkData.tipo_documento_id);
      alert("Documento copiado al expediente exitosamente.");
      setIsLinkOpen(false);
    } catch (error) {
      alert("Error al vincular el documento: " + error);
    }
  };
  
  /* -------------- SE QUITO POR SOLICITUD DEL CLIENTE --------------
  // --- D. ELIMINAR DOCUMENTO ---
  const handleEliminar = async (docId) => {
    if (!window.confirm("¿Eliminar este documento de la carpeta?")) return;
    try {
      await carpetasService.eliminarDocumento(docId);
      await cargarDatos();
    } catch (error) {
      alert("Error al eliminar: " + error);
    }
  };
*/

const handleDescargarDocumento = async (ruta) => {
    if (!ruta) return alert("Ruta no válida");
    
    try {
      // 1. Obtenemos el archivo puro (Blob)
      const fileBlob = await carpetasService.descargarDocumento(ruta);
      
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

  // --- LÓGICA DE EDICIÓN ONLINE (WOPI / COLLABORA) ---
  // Extraemos la extensión directamente del nombre (ej. "informe.xlsx" -> "xlsx")
  const esEditableOnline = (nombreArchivo) => {
    if (!nombreArchivo) return false;
    const partes = nombreArchivo.split('.');
    if (partes.length === 1) return false;
    const ext = partes.pop().toLowerCase();
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  };

    // Función para abrir la pestaña del editor de Collabora
  const handleAbrirOnline = (docId) => {
    // IMPORTANTE: Asegúrate de que esta URL apunte al endpoint WOPI de documentos sueltos 
    // que creamos en el backend (api/docs-sueltos/documentos/.../wopi)
    const wopiUrl = `https://office.cumbre.com.bo/browser/dist/cool.html?WOPISrc=https://api.cumbre.com.bo/api/docsueltos/files/${docId}`;
    window.open(wopiUrl, '_blank');
  };

  const handleCrearDocBlanco = async (e) => {
    e.preventDefault();
    if (!nuevoDocData.nombreArchivo) return alert("Completa el nombre del documento.");

    try {
      setCargando(true);
      const res = await carpetasService.crearDocumentoBlanco(id, nuevoDocData);

      setIsCrearDocOpen(false);
      setNuevoDocData({ nombreArchivo: '', tipoPlantilla: 'word', tipoDocumento: '' });

      await cargarDatos(); // Recarga la tabla de la carpeta actual

      if (window.confirm("Documento creado exitosamente. ¿Deseas abrir el editor ahora?")) {
        // Ajusta "res.documentacion.id" según la respuesta exacta de tu backend
        const docId = res.documentacion?.id || res.documento?.id || res.id;
        if (docId) handleAbrirOnline(docId);
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

  if (cargando) return <div className="p-20 text-center animate-pulse text-gray-500">Abriendo carpeta...</div>;

  return (
    <main className="p-8 max-w-7xl mx-auto">
      {/* HEADER NAVEGACIÓN */}
      <button onClick={() => navigate('/carpetas')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 font-bold text-sm transition">
        <span className="mr-2">←</span> Volver a Carpetas
      </button>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-[#080E21] flex items-center gap-3">
          <span className="text-4xl">📂</span> {carpeta}
        </h1>
        <div className="flex gap-3">
          <button onClick={() => setIsCrearDocOpen(true)} className="bg-white border-2 border-[#0F172A] text-[#0F172A] hover:bg-gray-50 px-4 py-2.5 rounded-lg font-bold shadow-sm transition flex items-center gap-2">
            + Doc en Blanco
          </button>
          <button onClick={() => setIsUploadOpen(true)} className="bg-[#0F172A] text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-slate-800 transition flex items-center gap-2">
            + Subir Archivo
          </button>
        </div>
      </div>

      {/* TABLA DE DOCUMENTOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {documentos.length === 0 ? (
          <div className="text-center py-16 bg-gray-50">
            <span className="text-4xl block mb-2">📄</span>
            <p className="text-gray-500 font-medium">Esta carpeta está vacía.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="p-4">Nombre del Archivo</th>
                <th className="p-4">Ultima Modificacion</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/30 transition group">
                  <td className="p-4 flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(doc.nombre)}</span>
                    <span className="font-bold text-gray-800">{doc.nombre}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{new Date(doc.fecha_modificacion).toLocaleDateString()}</td>

                  <td className="p-4 text-right space-x-4">
                    {/* NUEVO BOTÓN: EDITOR ONLINE */}
                    {esEditableOnline(doc.nombre) && (
                      <button
                        onClick={() => handleAbrirOnline(doc.id)}
                        className="text-emerald-600 font-bold text-xs hover:underline flex items-center inline-flex gap-1"
                      >
                        <span>📝</span> Abrir
                      </button>
                    )}
                    
                    {/* Botón Descargar */}
                    <button onClick={() => handleDescargarDocumento(doc.ruta_archivo)} className="text-blue-600 font-bold text-xs hover:underline">
                      Descargar
                    </button>

                    {/* Botón Compartir */}
                    <button onClick={() => abrirModalCompartir(doc)} className="text-green-600 font-bold text-xs hover:underline">
                      Compartir
                    </button>

                    {/* Botón Vincular */}
                    <button onClick={() => abrirModalVincular(doc)} className="text-purple-600 font-bold text-xs hover:underline">
                      Vincular a Caso
                    </button>

                    {/* --- SE QUITO BOTON PARA ELIMINACION POR SOLICTUD DEL CLIENTE-----
                    <button onClick={() => handleEliminar(doc.documento_id)} className="text-red-500 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                      Eliminar
                    </button>*/}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: SUBIR ARCHIVO (POST) */}
      {/* ==================================================== */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#080E21] p-4 flex justify-between"><h2 className="text-white font-bold">Subir Documento</h2><button onClick={() => setIsUploadOpen(false)} className="text-white">&times;</button></div>
            <form onSubmit={handleUploadSubmit} className="p-6">

              <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl hover:bg-gray-50 cursor-pointer transition">
                <input type="file" ref={fileInputRef} onChange={e => setArchivoSeleccionado(e.target.files[0])} className="hidden" />
                <span className="text-4xl mb-2 block">📥</span>
                <p className="text-sm font-bold text-gray-700">{archivoSeleccionado ? archivoSeleccionado.name : "Haz clic aquí para seleccionar un archivo"}</p>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                <button type="submit" disabled={!archivoSeleccionado} className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow disabled:bg-gray-300">Subir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: COMPARTIR (POST usuarios_ids) */}
      {/* ==================================================== */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#080E21] p-4 flex justify-between"><h2 className="text-white font-bold">Compartir Documento</h2><button onClick={() => setIsShareOpen(false)} className="text-white">&times;</button></div>

            <form onSubmit={handleCompartirSubmit} className="p-6">
              <p className="text-xs text-gray-500 mb-4">Selecciona los colegas con los que deseas compartir este documento.</p>

              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1 bg-gray-50">
                {catalogos?.usuarios?.map(user => (
                  <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-gray-200">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      checked={usuariosSeleccionados.includes(user.id)}
                      onChange={() => toggleUsuario(user.id)}
                    />
                    <span className="text-sm font-bold text-gray-700">{user.nombre_completo}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsShareOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow">Compartir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: VINCULAR A CASO (POST caso_id, tipo_doc) */}
      {/* ==================================================== */}
      {isLinkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#080E21] p-4 flex justify-between"><h2 className="text-white font-bold">Copiar a Expediente</h2><button onClick={() => setIsLinkOpen(false)} className="text-white">&times;</button></div>
            <form onSubmit={handleVincularSubmit} className="p-6">
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-4">Una copia de este documento se guardará en la pestaña "Documentos" del caso seleccionado.</p>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-700 block mb-1">ID Numérico del Caso *</label>
                <input
                  required
                  type="number"
                  placeholder="Ej. 14"
                  value={linkData.caso_id}
                  onChange={e => setLinkData({ ...linkData, caso_id: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
                {/* Nota: Si prefieres un 'select' con los casos del usuario, reemplaza este input por un <select> que mapee tus casos activos */}
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-700 block mb-1">Clasificación del Documento *</label>
                <select
                  required
                  value={linkData.tipo_documento_id}
                  onChange={e => setLinkData({ ...linkData, tipo_documento_id: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seleccione el tipo...</option>
                  {catalogos?.catalogos?.tipos_documento?.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsLinkOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-bold rounded shadow">Vincular</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: CREAR DOCUMENTO EN BLANCO (WOPI) */}
      {/* ==================================================== */}
      {isCrearDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#080E21] p-4 flex justify-between"><h2 className="text-white font-bold">Crear Documento Online</h2><button onClick={() => setIsCrearDocOpen(false)} className="text-white">&times;</button></div>
            <form onSubmit={handleCrearDocBlanco} className="p-6">
              
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                <p className="text-sm text-blue-800">
                  Se generará un archivo en blanco en esta carpeta. Luego podrás editarlo con <strong>Office Online</strong>.
                </p>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-700 block mb-1">Nombre del Archivo *</label>
                <input 
                  required
                  type="text"
                  placeholder="Ej. Borrador Contrato"
                  value={nuevoDocData.nombreArchivo}
                  onChange={(e) => setNuevoDocData({...nuevoDocData, nombreArchivo: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-700 block mb-1">Formato de Plantilla *</label>
                <select 
                  value={nuevoDocData.tipoPlantilla}
                  onChange={(e) => setNuevoDocData({...nuevoDocData, tipoPlantilla: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="word">Documento de Word (.docx)</option>
                  <option value="excel">Hoja de Cálculo (.xlsx)</option>
                  <option value="powerpoint">Presentacion PowerPoint (.pptx)</option>
                </select>
              </div>

              {/* Si ocupas tipo_documento_id (como en expediente), descomenta esto:
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-700 block mb-1">Clasificación *</label>
                <select 
                  required
                  value={nuevoDocData.tipoDocumento}
                  onChange={(e) => setNuevoDocData({...nuevoDocData, tipoDocumento: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {catalogos?.catalogos?.tipos_documento?.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              */}

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsCrearDocOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700">Crear y Editar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default DetalleCarpeta;