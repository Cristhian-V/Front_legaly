import React, { useState, useEffect, useRef } from 'react';
import docsService from '../../services/docsService';
import { EmptyState, Modal, Label } from '../ui/ComponentesGenerales';
import wopiDocServices from '../../services/wopiDocService';

const TabDocumentos = ({ casoId, datosUsuario, estaCerrado, recargarDocumentos }) => {
  const [documentos, setDocumentos] = useState({ documentacion: [] });
  const [cargando, setCargando] = useState(true);

  // Estados de Modales y Formularios
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const fileInputRef = useRef(null);

  // Estados para Nueva Versión
  const [isModificarModalOpen, setIsModificarModalOpen] = useState(false);
  const [docAModificar, setDocAModificar] = useState(null);
  const [archivoVersion, setArchivoVersion] = useState(null);
  const [comentariosVersion, setComentariosVersion] = useState('');
  const fileVersionInputRef = useRef(null);

  // Estados para Documento en Blanco (Online)
  const [isCrearDocOpen, setIsCrearDocOpen] = useState(false);
  const [nuevoDocData, setNuevoDocData] = useState({ nombreArchivo: '', tipoPlantilla: 'word', tipoDocumento: '' });

  const cargarDocumentos = async () => {
    try {
      setCargando(true);
      const resDocs = await docsService.obtenerDocumentosCaso(casoId);
      setDocumentos(resDocs || { documentacion: [] });
    } catch (error) {
      console.error("Error al cargar documentos", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (casoId) cargarDocumentos();
  }, [casoId]);

  // --- LÓGICA DE SUBIDA Y DESCARGA ---
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!archivoSeleccionado) return alert("Completa todos los campos");
    try {
      const data = new FormData();
      data.append('archivo', archivoSeleccionado);
      data.append('expediente_id', casoId);
      data.append('usuario_id', datosUsuario?.id);
      data.append('pesoMB', (archivoSeleccionado.size / (1024 * 1024)).toFixed(2));
      await docsService.subirDocumentoCaso(data);
      setIsUploadModalOpen(false);
      setArchivoSeleccionado(null);
      await cargarDocumentos();
      await recargarDocumentos()
    } catch (error) { alert(error || "Error al subir archivo"); }
  };

  const handleDescargarDocumento = async (ruta) => {
    if (!ruta) return alert("Ruta no válida");
    try {
      const fileBlob = await docsService.descargarDocumento(ruta);
      const fileURL = URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = ruta.replace(/\\/g, '/').split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (error) { alert("Error al intentar descargar el archivo: " + error); }
  };
  /* --------------- SE QUITO POR SOLICITUD DEL CLIENTTE ---------------
    const handleEliminarDocumento = async (docId) => {
      if (!window.confirm("¿Eliminar este documento?")) return;
      await docsService.eliminarDocumentoCaso(docId);
      await cargarDocumentos();
    };
  */
  // --- LÓGICA DE NUEVA VERSIÓN ---
  const abrirModalModificar = (doc) => {
    setDocAModificar(doc);
    setArchivoVersion(null);
    setComentariosVersion('');
    setIsModificarModalOpen(true);
  };

  const handleVersionSubmit = async (e) => {
    e.preventDefault();
    if (!archivoVersion) return alert("Por favor selecciona el nuevo archivo.");
    try {
      const data = new FormData();
      data.append('archivo', archivoVersion);
      data.append('comentarios', comentariosVersion);
      await docsService.subirNuevaVersion(docAModificar.id, data);
      setIsModificarModalOpen(false);
      alert("Nueva versión subida correctamente.");
      await cargarDocumentos();
    } catch (error) { alert("Error al subir la nueva versión: " + error); }
  };

  // --- LÓGICA ONLINE (WOPI) ---
  const esEditableOnline = (extension) => {
    const ext = extension?.toLowerCase().replace('.', '') || '';
    return ['doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx'].includes(ext);
  };

  const handleAbrirOnline = (docId) => {

    const wopiUrl = wopiDocServices.wopiURL(docId);
    window.open(wopiUrl, '_blank');
  };

  const handleCrearDocBlanco = async (e) => {
    e.preventDefault();
    if (!nuevoDocData.nombreArchivo) return alert("Completa los campos.");
    try {
      const res = await docsService.crearDocumentoBlanco(casoId, nuevoDocData);
      setIsCrearDocOpen(false);
      setNuevoDocData({ nombreArchivo: '', tipoPlantilla: 'word', tipoDocumento: '' });
      await cargarDocumentos();
      await recargarDocumentos()
      if (window.confirm("Documento creado. ¿Abrir el editor ahora?")) {
        handleAbrirOnline(res.documentacion?.id || res.id);
      }
    } catch (error) { alert("Error al crear el documento: " + error); }
  };

  // --- HELPERS ---
  const getFileIcon = (extension) => {
    const ext = extension?.toLowerCase().replace('.', '') || '';
    const iconos = { pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗', xlsm: '📗', ppt: '📙', pptx: '📙', txt: '📝', jpg: '🖼️', png: '🖼️', zip: '🗂️' };
    return iconos[ext] || '📄';
  };

  if (cargando) return <div className="py-10 text-center text-gray-500 animate-pulse">Cargando documentos...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Documentos del Expediente</h3>
        {!estaCerrado && (
          <div className="flex gap-3">
            <button onClick={() => setIsCrearDocOpen(true)} className="bg-white border-2 border-[#0F172A] text-[#0F172A] hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition">+ Doc en Blanco</button>
            <button onClick={() => setIsUploadModalOpen(true)} className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition">+ Subir Documento</button>
          </div>
        )}
      </div>

      {!documentos.documentacion?.length ? (
        <EmptyState icon="📄" title="Sin documentos" description="Sube la carátula como primer archivo." onAction={() => setIsUploadModalOpen(true)} />
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-4">Nombre</th>
                <th className="p-4">Ultima modificacion</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documentos.documentacion.map((doc) => (
                <tr
                  key={doc.id}
                  className={`group transition-colors border-l-4 ${doc.solicitud_revision
                      ? 'bg-orange-50 hover:bg-orange-100 border-orange-400'
                      : 'hover:bg-blue-50/30 border-transparent'
                    }`}
                >
                  <td className="p-4 flex items-center gap-3">
                    <span className="text-xl">{getFileIcon(doc.extension)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${doc.solicitud_revision ? 'text-orange-900' : 'text-gray-800'}`}>
                          {doc.nombre}
                        </p>
                        {/* Etiqueta visual si está en revisión */}
                        {doc.solicitud_revision && (
                          <span className="bg-orange-200 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                            En Revisión
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{doc.pesomb} MB</p>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {doc.fecha_modificacion}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDescargarDocumento(doc.url_archivo)} className="text-blue-600 hover:text-blue-800 font-bold text-xs mr-4">
                      Descargar
                    </button>
                    {!estaCerrado && (
                      <>
                        {esEditableOnline(doc.extension) && (
                          <button onClick={() => handleAbrirOnline(doc.id)} className="text-green-600 hover:text-green-800 font-bold text-xs mr-4 transition inline-flex items-center gap-1">
                            <span>📝</span> Abrir Editor
                          </button>
                        )}

                        <button onClick={() => abrirModalModificar(doc)} className="text-yellow-600 hover:text-yellow-800 font-bold text-xs mr-4 transition-colors">
                          Modificar
                        </button>
                        {/*<button onClick={() => handleEliminarDocumento(doc.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs">Eliminar</button>*/}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODALES --- */}
      {/* 1. Modal Subir Documento */}
      {isUploadModalOpen && (
        <Modal title="Subir Documentación" onClose={() => setIsUploadModalOpen(false)}>
          <form onSubmit={handleUploadSubmit}>
            <div onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current.click()} className="border-2 border-dashed p-10 text-center rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="file" ref={fileInputRef} onChange={e => setArchivoSeleccionado(e.target.files?.[0])} className="hidden" />
              <p className="text-sm text-gray-500">{archivoSeleccionado ? archivoSeleccionado.name : "Arrastra o haz clic para subir un archivo"}</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 font-bold">Cancelar</button>
              <button type="submit" disabled={!archivoSeleccionado} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold disabled:bg-gray-300">Subir</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Modal Crear Documento Online */}
      {isCrearDocOpen && (
        <Modal title="Crear Nuevo Documento (Online)" onClose={() => setIsCrearDocOpen(false)}>
          <form onSubmit={handleCrearDocBlanco}>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-blue-800">
              Se generará un archivo en blanco en el servidor. Luego podrás abrirlo directamente en el <strong>Editor en la Nube</strong>.
            </div>
            <div className="mb-4">
              <Label text="Nombre del Archivo *" />
              <input required type="text" value={nuevoDocData.nombreArchivo} onChange={(e) => setNuevoDocData({ ...nuevoDocData, nombreArchivo: e.target.value })} className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <Label text="Formato (Plantilla) *" />
              <select value={nuevoDocData.tipoPlantilla} onChange={(e) => setNuevoDocData({ ...nuevoDocData, tipoPlantilla: e.target.value })} className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="word">Word (.docx)</option>
                <option value="excel">Excel (.xlsx)</option>
                <option value="powerpoint">PowerPoint (.pptx)</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsCrearDocOpen(false)} className="px-5 py-2 text-gray-600 font-bold rounded hover:bg-gray-100">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-md">Crear y Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Modal Modificar Versión */}
      {isModificarModalOpen && (
        <Modal title="Actualizar Versión de Documento" onClose={() => setIsModificarModalOpen(false)}>
          <form onSubmit={handleVersionSubmit}>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-800 font-semibold mb-1">Reemplazando archivo actual:</p>
              <p className="text-sm font-bold text-blue-900">{docAModificar?.nombre}</p>
            </div>
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) setArchivoVersion(e.dataTransfer.files[0]); }} onClick={() => fileVersionInputRef.current.click()} className={`border-2 border-dashed p-10 text-center rounded-xl cursor-pointer transition-colors mb-4 ${archivoVersion ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-gray-50 border-gray-300'}`}>
              <input type="file" ref={fileVersionInputRef} onChange={e => setArchivoVersion(e.target.files?.[0])} className="hidden" />
              <p className="text-sm text-gray-600 font-medium">{archivoVersion ? `📄 ${archivoVersion.name}` : "Arrastra o haz clic para subir la NUEVA VERSIÓN"}</p>
            </div>
            <div className="mb-4">
              <Label text="Comentarios sobre esta modificación (Opcional)" />
              <textarea value={comentariosVersion} onChange={(e) => setComentariosVersion(e.target.value)} className="w-full p-2 border rounded text-sm resize-none h-20 outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Ej: Se corrigió la cláusula 4..." />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setIsModificarModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded">Cancelar</button>
              <button type="submit" disabled={!archivoVersion} className="bg-yellow-600 text-white px-6 py-2 rounded text-sm font-bold disabled:bg-gray-300 hover:bg-yellow-700 shadow-md">Subir Nueva Versión</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TabDocumentos;