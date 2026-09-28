import React, { useState, useEffect } from 'react';
import citesService from '../services/citesService';
import wopiDocServices from '../services/wopiDocService';
import { Modal, Label, EmptyState } from '../components/ui/ComponentesGenerales';

const VIAS = [
  { valor: 'correo', etiqueta: 'Correo' },
  { valor: 'entrega física', etiqueta: 'Entrega física' },
];

const formularioInicial = {
  via: 'correo',
  ref: '',
  destinatario: '',
  cargo_institucion: '',
};

const CITES = () => {
  const [cites, setCites] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);

  const cargarCites = async () => {
    try {
      setCargando(true);
      const data = await citesService.obtenerCites();
      setCites(data?.cites || []);
    } catch (error) {
      console.error('Error al cargar CITES:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCites();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirModal = () => {
    setFormData(formularioInicial);
    setIsModalOpen(true);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      const res = await citesService.crearCite(formData);
      setIsModalOpen(false);
      await cargarCites();
      if (res?.documentoId && window.confirm(`CITE ${res.numero} creado. ¿Abrir el editor ahora?`)) {
        window.open(wopiDocServices.wopiURL(res.documentoId), '_blank');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear el CITE.');
    } finally {
      setGuardando(false);
    }
  };

  const handleAbrir = (docId) => {
    if (!docId) return;
    window.open(wopiDocServices.wopiURL(docId), '_blank');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className="text-lg font-bold">CITES</h3>
        <button
          onClick={abrirModal}
          className="bg-[#1E3A5F] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition"
        >
          + Nuevo CITE
        </button>
      </div>

      {cargando ? (
        <div className="py-10 text-center text-gray-500 animate-pulse">Cargando CITES...</div>
      ) : cites.length === 0 ? (
        <EmptyState
          icon="📨"
          title="Sin CITES"
          description="Crea tu primera correspondencia oficial."
          onAction={abrirModal}
          actionText="Nuevo CITE"
        />
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-4">Número</th>
                <th className="p-4">Vía</th>
                <th className="p-4">Ref.</th>
                <th className="p-4">Destinatario</th>
                <th className="p-4">Expediente</th>
                <th className="p-4">Creado por</th>
                <th className="p-4">Fecha</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cites.map((cite) => (
                <tr key={cite.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-bold text-gray-800 whitespace-nowrap">{cite.etiqueta}</td>
                  <td className="p-4 text-gray-600 capitalize">{cite.via}</td>
                  <td className="p-4 text-gray-600">{cite.ref || '—'}</td>
                  <td className="p-4 text-gray-600">{cite.destinatario || '—'}</td>
                  <td className="p-4 text-gray-600">{cite.expediente_id || '—'}</td>
                  <td className="p-4 text-gray-600">{cite.creado_por || '—'}</td>
                  <td className="p-4 text-gray-500 text-sm">{cite.creado_en}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleAbrir(cite.documento_id)}
                      className="text-green-600 hover:text-green-800 font-bold text-xs transition"
                    >
                      📝 Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title="Nuevo CITE" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleCrear} className="space-y-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
              Se generará una carta en Word con la cabecera. El cuerpo lo redactas tú en el editor.
            </div>

            <div>
              <Label text="VIA *" />
              <select
                required
                name="via"
                value={formData.via}
                onChange={handleChange}
                className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VIAS.map((v) => (
                  <option key={v.valor} value={v.valor}>{v.etiqueta}</option>
                ))}
              </select>
            </div>

            <div>
              <Label text="REF. (asunto)" />
              <input
                type="text"
                name="ref"
                value={formData.ref}
                onChange={handleChange}
                placeholder="Asunto de la comunicación"
                className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label text="Destinatario" />
              <input
                type="text"
                name="destinatario"
                value={formData.destinatario}
                onChange={handleChange}
                placeholder="[NOMBRE DEL DESTINATARIO]"
                className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label text="Cargo / Institución" />
              <input
                type="text"
                name="cargo_institucion"
                value={formData.cargo_institucion}
                onChange={handleChange}
                placeholder="[Cargo / Institución]"
                className="w-full p-2.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={guardando}
                className="px-5 py-2 text-gray-600 font-bold rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-md disabled:opacity-50"
              >
                {guardando ? 'Creando...' : 'Crear CITE'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CITES;
