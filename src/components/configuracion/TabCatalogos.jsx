import React, { useState, useEffect } from 'react';
import catalogosAdminService from '../../services/catalogosAdminService';
import { Modal, Label, Input } from '../ui/ComponentesGenerales';

const LISTA_CATALOGOS = [
  { id: 'area-legal', nombre: 'Áreas Legales', icono: '⚖️' },
  { id: 'roles', nombre: 'Roles de Sistema', icono: '🛡️' },
  { id: 'grados', nombre: 'Grados Académicos', icono: '🎓' },
  { id: 'categorias-cliente', nombre: 'Categorías de Cliente', icono: '🏢' },
  { id: 'tipos-evento', nombre: 'Tipos de Evento', icono: '📅' }
];

const TabCatalogos = ({datosUsuario}) => {
  const [catalogoActivo, setCatalogoActivo] = useState(LISTA_CATALOGOS[0]);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  
  // Eliminamos 'descripcion' y añadimos 'titulo' al estado base
  const [formData, setFormData] = useState({ id: null, nombre: '', codigo: '', titulo: '' });

  // Variables auxiliares para saber qué campos extra mostrar según la pestaña
  const usaCodigo = catalogoActivo.id === 'area-legal';
  const usaTitulo = catalogoActivo.id === 'grados';
  const mostrarColumnaExtra = usaCodigo || usaTitulo;

  useEffect(() => {
    cargarDatosCatalogo(catalogoActivo.id);
  }, [catalogoActivo]);

  const cargarDatosCatalogo = async (catalogoId) => {
    try {
      setCargando(true);
      const data = await catalogosAdminService.obtenerCatalogo(catalogoId);
      setRegistros(data);
    } catch (error) {
      console.error("Error al cargar catálogo:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirModalCrear = () => {
    setModalMode('crear');
    setFormData({ id: null, nombre: '', codigo: '', titulo: '' });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (registro) => {
    setModalMode('editar');
    setFormData({ 
      id: registro.id, 
      nombre: registro.nombre || '', 
      codigo: registro.codigo || '', 
      titulo: registro.titulo || '' 
    });
    setIsModalOpen(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      // Preparamos el payload solo con lo que existe para esa tabla
      const payload = { nombre: formData.nombre };
      if (usaCodigo) payload.codigo = formData.codigo;
      if (usaTitulo) payload.titulo = formData.titulo;

      if (modalMode === 'crear') {
        await catalogosAdminService.crearRegistro(catalogoActivo.id, payload);
      } else {
        await catalogosAdminService.actualizarRegistro(catalogoActivo.id, formData.id, payload);
      }
      
      await cargarDatosCatalogo(catalogoActivo.id);
      setIsModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.error || "Error al guardar el registro.");
    }
  };

  const handleDesactivar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas desactivar "${nombre}"?`)) return;
    try {
      await catalogosAdminService.desactivarRegistro(catalogoActivo.id, id);
      await cargarDatosCatalogo(catalogoActivo.id); 
    } catch (error) { alert("Error al desactivar: " + error); }
  };

  const handleActivar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas reactivar "${nombre}"?`)) return;
    try {
      await catalogosAdminService.activarRegistro(catalogoActivo.id, id);
      await cargarDatosCatalogo(catalogoActivo.id); 
    } catch (error) { alert("Error al activar: " + error); }
  };

  if (datosUsuario?.rol !== 'Abogado Socio') {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* MENÚ LATERAL DE CATÁLOGOS */}
      <div className="w-full md:w-64 flex-shrink-0">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Tablas Maestras</h3>
        <div className="flex flex-col gap-1">
          {LISTA_CATALOGOS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCatalogoActivo(cat)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                catalogoActivo.id === cat.id 
                  ? 'bg-[#080E21] text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{cat.icono}</span>
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DE CONTENIDO (TABLA) */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-[#080E21]">{catalogoActivo.nombre}</h2>
            <p className="text-xs text-gray-500 mt-1">Gestiona las opciones disponibles para el sistema.</p>
          </div>
          <button 
            onClick={abrirModalCrear}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow transition flex items-center gap-2"
          >
            <span>+</span> Nuevo Registro
          </button>
        </div>

        {cargando ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 p-6">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-xs font-bold text-gray-500 uppercase rounded-t-lg">
                <tr>
                  <th className="p-4 rounded-tl-lg">ID</th>
                  <th className="p-4">Nombre Completo</th>
                  
                  {/* COLUMNA DINÁMICA: Solo se dibuja si el catálogo tiene Código o Título */}
                  {mostrarColumnaExtra && (
                    <th className="p-4">
                      {usaCodigo ? 'Código' : 'Abreviatura'}
                    </th>
                  )}

                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right rounded-tr-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan={mostrarColumnaExtra ? 5 : 4} className="py-12 text-center text-gray-400">
                      No hay registros en este catálogo.
                    </td>
                  </tr>
                ) : (
                  registros.map((reg) => (
                    <tr key={reg.id} className="hover:bg-blue-50/30 transition group">
                      <td className="p-4 font-mono text-xs text-gray-400">{reg.id}</td>
                      <td className="p-4 font-bold text-gray-800">{reg.nombre}</td>
                      
                      {/* CELDA DINÁMICA */}
                      {mostrarColumnaExtra && (
                        <td className="p-4 text-sm text-gray-600">
                          <span className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs font-bold text-gray-700">
                            {usaCodigo ? reg.codigo : reg.titulo}
                          </span>
                        </td>
                      )}

                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${reg.activo !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {reg.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => abrirModalEditar(reg)} className="text-blue-600 font-bold text-xs hover:underline mr-4">
                          Editar
                        </button>
                        {reg.activo !== false ? (
                          <button 
                            onClick={() => handleDesactivar(reg.id, reg.nombre)} 
                            className="text-red-500 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleActivar(reg.id, reg.nombre)} 
                            className="text-green-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                          >
                            Habilitar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL CREAR / EDITAR --- */}
      {isModalOpen && (
        <Modal 
          title={`${modalMode === 'crear' ? 'Nuevo Registro en' : 'Editar Registro de'} ${catalogoActivo.nombre}`} 
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleGuardar} className="space-y-4">
            
            <div>
              <Label text="Nombre Completo *" />
              <Input required name="nombre" value={formData.nombre} onChange={handleChange} placeholder={usaTitulo ? "Ej. Abogado/a, Doctor/a..." : "Nombre del registro"} />
            </div>

            {/* CAMPO CONDICIONAL: Código (Área Legal) */}
            {usaCodigo && (
              <div>
                <Label text="Código del Área *" />
                <Input required name="codigo" value={formData.codigo} onChange={handleChange} placeholder="Ej. PEN, CIV, LAB..." maxLength={5} />
                <p className="text-[10px] text-gray-400 mt-1">Este código se usa para generar los números de Expediente.</p>
              </div>
            )}

            {/* CAMPO CONDICIONAL: Título (Grados Académicos) */}
            {usaTitulo && (
              <div>
                <Label text="Abreviatura del Título *" />
                <Input required name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ej. Abg., Dra., Lic..." maxLength={20} />
                <p className="text-[10px] text-gray-400 mt-1">Abreviación que aparecerá antes del nombre del usuario.</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition">
                Guardar Registro
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
}

export default TabCatalogos;