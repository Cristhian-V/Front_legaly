// src/pages/Carpetas.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import carpetasService from '../services/carpetasService';

const Carpetas = () => {
  const navigate = useNavigate();
  const [carpetas, setCarpetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // --- ESTADOS DEL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('crear'); // 'crear' o 'editar'
  const [carpetaForm, setCarpetaForm] = useState({ id: null, nombre: '' });

  const cargarCarpetas = async () => {
    try {
      setCargando(true);
      const data = await carpetasService.obtenerCarpetas();
      // Asumiendo que el backend devuelve el array directamente o dentro de un objeto
      setCarpetas(data.carpetas || data || []);
    } catch (error) {
      console.error("Error al cargar carpetas:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCarpetas();
  }, []);

  // --- MANEJADORES DE ACCIONES ---
  const abrirModalCrear = () => {
    setModalMode('crear');
    setCarpetaForm({ id: null, nombre: '' });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (carpeta, e) => {
    e.stopPropagation(); // Evita que se dispare el click de "entrar a la carpeta"
    setModalMode('editar');
    setCarpetaForm({ id: carpeta.id, nombre: carpeta.nombre_carpeta });
    setIsModalOpen(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!carpetaForm.nombre.trim()) return alert("El nombre no puede estar vacío");

    try {
      if (modalMode === 'crear') {
        await carpetasService.crearCarpeta(carpetaForm.nombre);
      } else {
        await carpetasService.renombrarCarpeta(carpetaForm.id, carpetaForm.nombre);
      }
      await cargarCarpetas();
      setIsModalOpen(false);
    } catch (error) {
      alert(`Error al ${modalMode} la carpeta: ${error.message}`);
    }
  };

  const handleEliminar = async (id, nombre, e) => {
    e.stopPropagation(); // Evita navegar al hacer clic en eliminar
    if (!window.confirm(`¿Seguro que deseas eliminar la carpeta "${nombre}" y todo su contenido?`)) return;

    try {
      await carpetasService.eliminarCarpeta(id);
      await cargarCarpetas();
    } catch (error) {
      alert("Error al eliminar la carpeta:" + error.message);
    }
  };

  // Filtrado de búsqueda
  const carpetasFiltradas = carpetas.filter(c =>
    c.nombre_carpeta?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return <div className="p-20 text-center text-gray-500 animate-pulse">Cargando carpetas...</div>;

  return (
    <main className="p-8 max-w-7xl mx-auto">
      {/* HEADER */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        
        {/* Contenedor del BUSCADOR */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar carpeta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* BOTÓN */}
        <button
          onClick={abrirModalCrear}
          className="bg-[#0F172A] text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-slate-800 transition flex items-center justify-center gap-2 w-full md:w-auto whitespace-nowrap"
        >
          <span className="text-lg">+</span> Nueva Carpeta
        </button>

      </div>

      {/* GRID DE CARPETAS */}
      {carpetasFiltradas.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <span className="text-5xl block mb-4">🗂️</span>
          <h3 className="text-lg font-bold text-gray-700">No se encontraron carpetas</h3>
          <p className="text-sm text-gray-500">Crea una nueva carpeta para empezar a organizar tus documentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {carpetasFiltradas.map((carpeta) => (
            <div
              key={carpeta.id}
              onClick={() => navigate(`/carpetas/${carpeta.id}`)}
              className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between h-36 relative"
            >
              <div className="flex justify-between items-start">
                <span className="text-4xl">📁</span>

                {/* Menú de acciones invisible hasta hacer hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={(e) => abrirModalEditar(carpeta, e)}
                    className="p-1.5 bg-gray-50 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                    title="Renombrar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => handleEliminar(carpeta.id, carpeta.nombre_carpeta, e)}
                    className="p-1.5 bg-gray-50 hover:bg-red-50 text-red-600 rounded-lg transition"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#080E21] line-clamp-2 leading-tight">
                  {carpeta.nombre_carpeta}
                </h3>
                {/* Opcional: Si el backend devuelve cantidad de archivos, lo pones aquí */}
                {/* <p className="text-xs text-gray-400 mt-1">{carpeta.cantidad_archivos || 0} archivos</p> */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR/EDITAR CARPETA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="bg-[#080E21] p-4 flex justify-between items-center">
              <h2 className="text-white font-bold">
                {modalMode === 'crear' ? 'Crear Nueva Carpeta' : 'Renombrar Carpeta'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-white text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleGuardar} className="p-6">
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-700 mb-2 block">Nombre de la Carpeta *</label>
                <input
                  required
                  type="text"
                  autoFocus
                  placeholder="Ej. Plantillas Contratos 2026"
                  value={carpetaForm.nombre}
                  onChange={e => setCarpetaForm({ ...carpetaForm, nombre: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition"
                >
                  {modalMode === 'crear' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Carpetas;