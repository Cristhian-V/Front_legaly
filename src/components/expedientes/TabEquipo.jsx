import React, { useState, useEffect } from 'react';
import casosService from '../../services/casosService';
import { Modal, Label } from '../ui/ComponentesGenerales';

const TabEquipo = ({ casoId, catalogos }) => {
  const [equipoCaso, setEquipoCaso] = useState({ equipo: [] });
  const [cargando, setCargando] = useState(true);
  
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false);
  const [nuevoMiembro, setNuevoMiembro] = useState({ abogado_id: '' });

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
    if (!nuevoMiembro.abogado_id) return alert("Selecciona un abogado.");
    try {
      await casosService.addMiembroEquipo(casoId, nuevoMiembro.abogado_id);
      setIsEquipoModalOpen(false);
      setNuevoMiembro({ abogado_id: '' });
      await cargarEquipo();
    } catch (error) { alert("Error al añadir miembro: " + (error.response?.data?.error || error.message)); }
  };

  const handleEliminarMiembro = async (miembroId, nombre) => {
    if (!window.confirm(`¿Quitar a ${nombre} del caso?`)) return;
    try {
      await casosService.eliminarMiembroEquipo(casoId, miembroId);
      await cargarEquipo();
    } catch (error) { alert("Error al eliminar miembro."); }
  };

  if (cargando) return <div className="py-10 text-center text-gray-500 animate-pulse">Cargando equipo...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold">Abogados del Caso</h3>
        <button onClick={() => setIsEquipoModalOpen(true)} className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition">+ Añadir Colega</button>
      </div>

      {!equipoCaso.equipo?.length ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
          No hay abogados adicionales asignados a este caso.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {equipoCaso.equipo.map((miembro) => (
            <div key={miembro.id} className="border rounded-xl p-6 text-center hover:shadow-md transition-shadow relative group bg-white">
              <button onClick={() => handleEliminarMiembro(miembro.id, miembro.nombre_completo)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-xs w-6 h-6 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-full flex items-center justify-center transition-all" title="Quitar del caso">
                ✕
              </button>
              <img src={miembro.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} className="w-16 h-16 rounded-full mx-auto mb-4 border object-cover" alt="avatar" />
              <h4 className="font-bold text-sm text-gray-800">{miembro.nombre_completo}</h4>
              <p className="text-xs text-blue-600 font-bold mb-2">{miembro.descripcion_titulo || 'Abogado'}</p>
              <div className="text-[10px] text-gray-400 border-t pt-2 truncate px-2">{miembro.email}</div>
            </div>
          ))}
        </div>
      )}

      {isEquipoModalOpen && (
        <Modal title="Añadir al Equipo" onClose={() => setIsEquipoModalOpen(false)}>
          <form onSubmit={handleAddMiembro}>
            <div className="mb-6">
              <Label text="Seleccionar Colega *" />
              <select required value={nuevoMiembro.abogado_id} onChange={(e) => setNuevoMiembro({ abogado_id: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {catalogos?.usuarios?.map(a => <option key={a.id} value={a.id}>{a.nombre_completo}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setIsEquipoModalOpen(false)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Cancelar</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition">Añadir al Caso</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TabEquipo;