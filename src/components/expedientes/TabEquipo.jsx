import React, { useState, useEffect } from 'react';
import casosService from '../../services/casosService';
import { Modal, Label } from '../ui/ComponentesGenerales';

const TabEquipo = ({ casoId, catalogos, estaCerrado }) => {
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
      await casosService.addMiembroEquipo(casoId, equipoSeleccionado);

      setIsEquipoModalOpen(false);
      setEquipoSeleccionado([]); 
      await cargarEquipo(); 

    } catch (error) {
      alert("Error al añadir miembros: " + (error.response?.data?.error || error.message));
    }
  };

  const toggleAbogado = (id) => {
    setEquipoSeleccionado(prev =>
      prev.includes(id)
        ? prev.filter(aId => aId !== id) 
        : [...prev, id]                  
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
          <button onClick={() => setIsEquipoModalOpen(true)} className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition">
            + Añadir Colega
          </button>
        )}
      </div>

      {!equipoCaso.equipo?.length ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
          No hay abogados adicionales asignados a este caso.
        </div>
      ) : (
        /* --- NUEVA VISTA DE TABLA (FILAS) --- */
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
              <tr>
                <th className="p-4">Profesional Asignado</th>
                <th className="p-4">Cargo / Título</th>
                <th className="p-4">Contacto</th>
                {!estaCerrado && <th className="p-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipoCaso.equipo.map((miembro) => (
                <tr key={miembro.id} className="hover:bg-blue-50/30 transition group">
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{miembro.nombre_completo}</p>
                  </td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                      {miembro.descripcion_titulo || 'Título no Registrado'}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-600">{miembro.email}</p>
                  </td>
                  {!estaCerrado && (
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEliminarMiembro(miembro.id, miembro.nombre_completo)}
                        className="text-red-500 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                        title="Quitar del caso"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL (Se mantiene exactamente igual) --- */}
      {isEquipoModalOpen && (
        <Modal title="Añadir al Equipo" onClose={() => { setIsEquipoModalOpen(false); setEquipoSeleccionado([]); }}>
          <form onSubmit={handleAddMiembro}>
            <div className="mb-6">
              <Label text="Seleccionar Colegas *" />
              <p className="text-[11px] text-gray-500 mb-2">Selecciona uno o más abogados para unirse al expediente.</p>

              <div className="border rounded-lg h-48 overflow-y-auto bg-gray-50 p-2 space-y-1 shadow-inner">
                {catalogos?.usuarios?.map((abogado) => {
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
                        <p className="text-[11px] text-gray-500 mt-1">{abogado.descripcion_titulo || 'Titulo no Registrado'}</p>
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