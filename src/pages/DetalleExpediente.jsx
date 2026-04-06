import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'; // Agregamos useOutletContext
import casosService from '../services/casosService';
import authService from '../services/authService';

const DetalleExpediente = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  // Obtenemos los catálogos desde el Layout para los selects de edición
  const { catalogos } = useOutletContext() || {}; 

  const [pestañaActiva, setPestañaActiva] = useState('general');
  const [detalleCaso, setDetalleCaso] = useState({});

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
    console.log("Datos editados a enviar:", formData);
    
    try {
      // Aquí llamarías a tu servicio: await casosService.actualizarCaso(id, formData);
      
      // Cerramos el modal
      setIsEditModalOpen(false);
      
      // Recargamos los datos para que se vea el cambio reflejado inmediatamente
      cargarDetalleCaso();
    } catch (error) {
      console.error("Error al actualizar el caso:", error);
    }
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

      {pestañaActiva === 'documentos' && <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">Sección de Documentos en construcción...</div>}
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
                  <input type="text" name="titulo" required value={formData.titulo} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Demanda Laboral Juan Pérez"/>
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
                  <input type="text" name="contraparte" value={formData.contraparte} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre de la contraparte"/>
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

    </main>
  );
};

export default DetalleExpediente;