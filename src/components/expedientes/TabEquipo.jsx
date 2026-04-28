import React, { useState, useEffect } from 'react';
import casosService from '../../services/casosService';
import { Modal, Label } from '../ui/ComponentesGenerales';

const TabEquipo = ({ casoId, catalogos, estaCerrado}) => {
  const [equipoCaso, setEquipoCaso] = useState({ equipo: [] });
  const [cargando, setCargando] = useState(true);

  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState([]);

  const cargarEquipo = async () => {
    try {
      setCargando(true);
      const resEquipo = await casosService.obtenerEquipoCaso(casoId);
      setEquipoCaso(resEquipo || { equipo: [] });
    } catch (error) {
      console.error("Error al cargar equipo", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (casoId) cargarEquipo();
  }, [casoId]);

  const handleAddMiembro = async (e) => {
    e.preventDefault();

    if (equipoSeleccionado.length === 0) {
      return alert("Selecciona al menos un colega para añadir al equipo.");
    }

    try {
      // Pasamos el array de IDs en lugar de un solo ID
      await casosService.addMiembroEquipo(casoId, equipoSeleccionado);

      setIsEquipoModalOpen(false);
      setEquipoSeleccionado([]); // Limpiamos la selección
      await cargarEquipo(); // Recargamos la cuadrícula

    } catch (error) {
      alert("Error al añadir miembros: " + (error.response?.data?.error || error.message));
    }
  };

  const toggleAbogado = (id) => {
    setEquipoSeleccionado(prev =>
      prev.includes(id)
        ? prev.filter(aId => aId !== id) // Si ya está, lo quita
        : [...prev, id]                  // Si no está, lo añade
    );
  };

  const handleEliminarMiembro = async (miembroId, nombre) => {
    if (!window.confirm(`¿Quitar a ${nombre} del caso?`)) return;
    try {
      await casosService.eliminarMiembroEquipo(casoId, miembroId);
      await cargarEquipo();
    } catch (error) { alert("Error al eliminar miembro: " + error); }
  };

  if (cargando) return <div className="py-10 text-center text-gray-500 animate-pulse">Cargando equipo...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold">Abogados del Caso</h3>
        {!estaCerrado && (
        <button onClick={() => setIsEquipoModalOpen(true)} className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition">+ Añadir Colega</button>
        )}
      </div>

      {!equipoCaso.equipo?.length ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
          No hay abogados adicionales asignados a este caso.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {equipoCaso.equipo.map((miembro) => (
            <div key={miembro.id} className="border rounded-xl p-6 text-center hover:shadow-md transition-shadow relative group bg-white">
              {!estaCerrado && (
              <button onClick={() => handleEliminarMiembro(miembro.id, miembro.nombre_completo)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-xs w-6 h-6 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-full flex items-center justify-center transition-all" title="Quitar del caso">
                ✕
              </button>
              )}
              <img src={miembro.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} className="w-16 h-16 rounded-full mx-auto mb-4 border object-cover" alt="avatar" />
              <h4 className="font-bold text-sm text-gray-800">{miembro.nombre_completo}</h4>
              <p className="text-xs text-blue-600 font-bold mb-2">{miembro.descripcion_titulo || 'Abogado'}</p>
              <div className="text-[10px] text-gray-400 border-t pt-2 truncate px-2">{miembro.email}</div>
            </div>
          ))}
        </div>
      )}

      {isEquipoModalOpen && (
        <Modal title="Añadir al Equipo" onClose={() => { setIsEquipoModalOpen(false); setEquipoSeleccionado([]); }}>
          <form onSubmit={handleAddMiembro}>
            <div className="mb-6">
              <Label text="Seleccionar Colegas *" />
              <p className="text-[11px] text-gray-500 mb-2">Selecciona uno o más abogados para unirse al expediente.</p>

              {/* Contenedor con scroll para los checkboxes */}
              <div className="border rounded-lg h-48 overflow-y-auto bg-gray-50 p-2 space-y-1 shadow-inner">
                {catalogos?.usuarios?.map((abogado) => {

                  // Validamos si el abogado ya es parte del equipo actual para deshabilitarlo
                  const yaEsMiembro = equipoCaso?.equipo?.some(miembro => miembro.id === abogado.id);

                  return (
                    <label
                      key={abogado.id}
                      className={`flex items-start gap-3 p-2 rounded border border-transparent transition-colors ${yaEsMiembro ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-white hover:border-gray-200'}`}
                    >
                      <input
                        type="checkbox"
                        disabled={yaEsMiembro}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:bg-gray-300"
                        checked={equipoSeleccionado.includes(abogado.id) || yaEsMiembro}
                        onChange={() => toggleAbogado(abogado.id)}
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-800 leading-none">
                          {abogado.nombre_completo} {yaEsMiembro && <span className="text-[10px] text-green-600 ml-1">(Ya en el equipo)</span>}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">{abogado.descripcion_titulo || 'Abogado'}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => { setIsEquipoModalOpen(false); setEquipoSeleccionado([]); }}
                className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={equipoSeleccionado.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Añadir al Caso
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TabEquipo;