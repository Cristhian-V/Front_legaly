import React, { useState, useEffect, useRef } from 'react';
import docsService from '../../services/docsService';
import citesService from '../../services/citesService';
import { EmptyState, Modal, Label } from '../ui/ComponentesGenerales';
import wopiDocServices from '../../services/wopiDocService';

const TabDocumentos = ({ casoId, datosUsuario, estaCerrado, recargarDocumentos }) => {
  const [documentos, setDocumentos] = useState({ documentacion: [] });
  const [cargando, setCargando] = useState(true);

  // Estados de Modales y Formularios
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const fileInputRef = useRef(null);
  const [guardando, setGuardando] = useState(false);

  // Estados para Documento en Blanco (Online)
  const [isCrearDocOpen, setIsCrearDocOpen] = useState(false);
  const [nuevoDocData, setNuevoDocData] = useState({ nombreArchivo: '', tipoPlantilla: 'word', tipoDocumento: '' });

  // Estados para CITE
  const [isCrearCiteOpen, setIsCrearCiteOpen] = useState(false);
  const [citeData, setCiteData] = useState({ via: 'correo', ref: '', destinatario: '', cargo_institucion: '' });

  // Buscador por nombre
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), 250);
    return () => clearTimeout(t);
  }, [busqueda]);

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
      setGuardando(true);
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
    finally { setGuardando(false); }
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
      setGuardando(true);
      const res = await docsService.crearDocumentoBlanco(casoId, nuevoDocData);
      setIsCrearDocOpen(false);
      setNuevoDocData({ nombreArchivo: '', tipoPlantilla: 'word', tipoDocumento: '' });
      await cargarDocumentos();
      await recargarDocumentos()
      if (window.confirm("Documento creado. ¿Abrir el editor ahora?")) {
        handleAbrirOnline(res.documentacion?.id || res.id);
      }
    } catch (error) { alert("Error al crear el documento: " + error); }
    finally { setGuardando(false); }
  };

  const handleCrearCite = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      const res = await citesService.crearCiteExpediente(casoId, citeData);
      setIsCrearCiteOpen(false);
      setCiteData({ via: 'correo', ref: '', destinatario: '', cargo_institucion: '' });
      await cargarDocumentos();
      await recargarDocumentos();
      if (window.confirm(`CITE ${res.numero} creado. ¿Continuar con la edición ahora?`)) {
        handleAbrirOnline(res.documentoId);
      }
    } catch (error) { alert(error.response?.data?.error || "Error al crear el CITE."); }
    finally { setGuardando(false); }
  };

  // --- HELPERS ---
  const getFileIcon = (extension) => {
    const ext = extension?.toLowerCase().replace('.', '') || '';
    const iconos = { pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗', xlsm: '📗', ppt: '📙', pptx: '📙', txt: '📝', jpg: '🖼️', png: '🖼️', zip: '🗂️' };
    return iconos[ext] || '📄';
  };

  const normalizar = (texto) =>
    (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const documentosFiltrados = (documentos.documentacion || []).filter((doc) =>
    normalizar(doc.nombre).includes(normalizar(busquedaDebounced)),
  );

  if (cargando) return <div className="py-10 text-center text-gray-500 animate-pulse">Cargando documentos...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className="text-lg font-bold">Documentos del Expediente</h3>
        <div className="flex flex-wrap items-center gap-3">
          {documentos.documentacion?.length > 0 && (
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          )}
          {!estaCerrado && (
            <>
              <button onClick={() => setIsCrearDocOpen(true)} className="bg-white border-2 border-[#1E3A5F] text-[#1E3A5F] hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition">+ Doc en Blanco</button>
              <button onClick={() => setIsCrearCiteOpen(true)} className="bg-white border-2 border-[#1E3A5F] text-[#1E3A5F] hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition">+ CITE</button>
              <button onClick={() => setIsUploadModalOpen(true)} className="bg-[#1E3A5F] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition">+ Subir Documento</button>
            </>
          )}
        </div>
      </div>

      {!documentos.documentacion?.length ? (
        <EmptyState icon="📄" title="Sin documentos" description="Sube la carátula como primer archivo." onAction={() => setIsUploadModalOpen(true)} />
      ) : documentosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <span className="text-3xl block mb-2">🔍</span>
          <p className="text-gray-500 font-medium">No se encontraron documentos con “{busquedaDebounced}”.</p>
        </div>
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
              {documentosFiltrados.map((doc) => (
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
                            <span>📝</span> Editar
                          </button>
                        )}
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
              <button type="button" onClick={() => setIsUploadModalOpen(false)} disabled={guardando} className="px-4 py-2 text-sm text-gray-600 font-bold disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={!archivoSeleccionado || guardando} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold disabled:bg-gray-300">{guardando ? 'Subiendo...' : 'Subir'}</button>
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
              <button type="button" onClick={() => setIsCrearDocOpen(false)} disabled={guardando} className="px-5 py-2 text-gray-600 font-bold rounded hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={guardando} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-md disabled:opacity-50">{guardando ? 'Creando...' : 'Crear y Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Modal Crear CITE */}
      {isCrearCiteOpen && (
        <Modal title="Crear CITE" onClose={() => setIsCrearCiteOpen(false)}>
          <form onSubmit={handleCrearCite}>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-blue-800">
              Se generará la carta con la cabecera y el número correlativo. Si dejas el destinatario vacío, se usará el <strong>contacto principal del cliente</strong>.
            </div>
            <div className="mb-4">
              <Label text="VIA *" />
              <select required value={citeData.via} onChange={(e) => setCiteData({ ...citeData, via: e.target.value })} className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="correo">Correo</option>
                <option value="entrega física">Entrega física</option>
              </select>
            </div>
            <div className="mb-4">
              <Label text="REF. (asunto)" />
              <input type="text" value={citeData.ref} onChange={(e) => setCiteData({ ...citeData, ref: e.target.value })} placeholder="Asunto de la comunicación" className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <Label text="Destinatario" />
              <input type="text" value={citeData.destinatario} onChange={(e) => setCiteData({ ...citeData, destinatario: e.target.value })} placeholder="Contacto principal del cliente" className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <Label text="Cargo / Institución" />
              <input type="text" value={citeData.cargo_institucion} onChange={(e) => setCiteData({ ...citeData, cargo_institucion: e.target.value })} placeholder="[Cargo / Institución]" className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsCrearCiteOpen(false)} disabled={guardando} className="px-5 py-2 text-gray-600 font-bold rounded hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={guardando} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-md disabled:opacity-50">{guardando ? 'Creando...' : 'Crear CITE'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TabDocumentos;