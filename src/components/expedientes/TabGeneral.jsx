// src/components/expedientes/TabGeneral.jsx
import React, { useState, useEffect } from 'react';
import casosService from '../../services/casosService';
import { InfoBox, Modal } from '../ui/ComponentesGenerales';

const TabGeneral = ({ casoId, detalleCaso, estaCerrado }) => {
  const [contactosAsignados, setContactosAsignados] = useState([]);
  const [contactosDisponibles, setContactosDisponibles] = useState([]);
  const [contactosSeleccionados, setContactosSeleccionados] = useState([]);
  const [isContactosModalOpen, setIsContactosModalOpen] = useState(false);

  useEffect(() => {
    const cargarContactos = async () => {
      if (!casoId) return;
      const resContactos = await casosService.obtenerContactosAsignados(casoId);
      setContactosAsignados(resContactos || []);
    };
    cargarContactos();
  }, [casoId]);

  const abrirModalContactos = async () => {
    try {
      const disponibles = await casosService.obtenerContactosDisponibles(casoId);
      setContactosDisponibles(disponibles || []);
      setContactosSeleccionados([]);
      setIsContactosModalOpen(true);
    } catch (error) { alert("Error al cargar los contactos: " + error); }
  };

  const handleToggleContacto = (contactoId) => {
    setContactosSeleccionados(prev => prev.includes(contactoId) ? prev.filter(id => id !== contactoId) : [...prev, contactoId]);
  };

  const handleGuardarContactos = async (e) => {
    e.preventDefault();
    if (contactosSeleccionados.length === 0) return alert("Selecciona al menos uno.");
    try {
      await casosService.asignarContactos(casoId, contactosSeleccionados);
      const resContactos = await casosService.obtenerContactosAsignados(casoId);
      setContactosAsignados(resContactos || []);
      setIsContactosModalOpen(false);
    } catch (error) { alert("Error al asignar contactos: "+ error); }
  };

  const handleQuitarContacto = async (contactoId, nombreContacto) => {
    if (!window.confirm(`¿Desvincular a ${nombreContacto}?`)) return;
    try {
      await casosService.quitarContacto(detalleCaso.caso?.id, contactoId); // Usamos el ID interno
      const resContactos = await casosService.obtenerContactosAsignados(casoId);
      setContactosAsignados(resContactos || []);
    } catch (error) { alert("Error al desvincular: "+ error); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CUADRO: DESCRIPCIÓN */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-[#080E21] mb-4">Descripción del Caso</h3>
        <p className="text-gray-600 text-sm mb-8 leading-relaxed">{detalleCaso.caso?.descripcion}</p>
        <hr className="mb-6 border-gray-100" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InfoBox label="Cliente" value={detalleCaso.caso?.nombre_cliente} />
          <InfoBox label="Contraparte" value={detalleCaso.caso?.contraparte || 'No especificada'} />
          <InfoBox label="Fecha Inicio" value={detalleCaso.caso?.fecha_inicio} />
          <InfoBox label="Vencimiento" value="Próximamente" color="text-red-500" />
        </div>
      </div>

      {/* CUADRO: CONTACTOS ASIGNADOS */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-fit">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#080E21]">Contactos del Cliente</h3>
          {!estaCerrado && (
          <button onClick={abrirModalContactos} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">+ Añadir</button>
          )}
        </div>

        <div className="space-y-4">
          {contactosAsignados.length > 0 ? (
            contactosAsignados.map((contacto) => (
              <div key={`contacto-${contacto.id}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative group transition-colors hover:bg-white hover:shadow-sm">
                {!estaCerrado && (
                <button onClick={() => handleQuitarContacto(contacto.id, contacto.nombre_contacto)} className="absolute top-2 right-2 text-[10px] text-gray-400 hover:text-red-600 bg-gray-100 hover:bg-red-50 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">✕</button>
                )}
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                  {contacto.nombre_contacto?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 pr-6">
                  <p className="text-sm font-bold text-gray-800 truncate">{contacto.nombre_contacto}</p>
                  <p className="text-xs text-gray-500 font-medium mb-1">{contacto.cargo || 'Sin cargo'}</p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {contacto.telefono && <span className="text-[11px] text-gray-600">📞 {contacto.telefono}</span>}
                    {contacto.email && <span className="text-[11px] text-gray-600 truncate">✉️ {contacto.email}</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
              <span className="text-2xl mb-2 block">📇</span><p className="text-xs text-gray-400 font-medium px-4">No hay contactos vinculados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Contactos (Copiado exactamente como lo tenías) */}
      {isContactosModalOpen && (
        <Modal title="Añadir Contactos al Expediente" onClose={() => setIsContactosModalOpen(false)}>
          <form onSubmit={handleGuardarContactos}>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 bg-gray-50 mb-6 mt-4">
              {contactosDisponibles.map(contacto => {
                const yaAsignado = contactosAsignados.some(c => c.id === contacto.id);
                return (
                  <label key={contacto.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${yaAsignado ? 'bg-gray-100 opacity-60' : 'hover:bg-white border-transparent hover:border-gray-200 hover:shadow-sm'}`}>
                    <input type="checkbox" disabled={yaAsignado} className="mt-1 w-4 h-4 text-blue-600 rounded" checked={yaAsignado || contactosSeleccionados.includes(contacto.id)} onChange={() => handleToggleContacto(contacto.id)}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{contacto.nombre_contacto} {yaAsignado && '(Ya asignado)'}</p>
                      <p className="text-xs text-gray-500">{contacto.cargo}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsContactosModalOpen(false)} className="px-5 py-2 text-gray-600 font-bold rounded-lg hover:bg-gray-100">Cancelar</button>
              <button type="submit" disabled={contactosSeleccionados.length === 0} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md disabled:bg-gray-300">Vincular Seleccionados</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default TabGeneral;