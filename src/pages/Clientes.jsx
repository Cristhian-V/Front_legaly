import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import clienteService from '../services/clienteService';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Asumiendo que las categorías vienen del contexto global
  const { catalogos, recargarCatalogos } = useOutletContext() || {};

  const [formData, setFormData] = useState({
    nombre_completo: '', documento_identidad: '', correo_electronico: '',
    telefono: '', direccion: '', categoria_id: ''
  });

  const navigate = useNavigate();

  const cargarClientes = async () => {
    try {
      const data = await clienteService.obtenerClientes();
      setClientes(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await clienteService.crearCliente(formData);
      await cargarClientes();
      setIsModalOpen(false);
      await recargarCatalogos(); 
      setFormData({ nombre_completo: '', documento_identidad: '', correo_electronico: '', telefono: '', direccion: '', categoria_id: '' });
    } catch (error) {
      alert("Error al crear cliente: " + error.message);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.documento_identidad.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return <div className="p-20 text-center text-gray-500">Cargando Clientes...</div>;

  return (
    <main className="p-8 max-w-7xl mx-auto">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        
        {/* Contenedor del Buscador */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            🔍
          </span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o NIT..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        {/* Botón */}
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-[#0F172A] text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-slate-800 transition-colors whitespace-nowrap w-full md:w-auto"
        >
          + Nuevo Cliente
        </button>

      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b">
            <tr>
              <th className="p-4 font-bold">Cliente / Razón Social</th>
              <th className="p-4 font-bold">Identidad (NIT/CI)</th>
              <th className="p-4 font-bold">Contacto</th>
              <th className="p-4 text-right font-bold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientesFiltrados.map((cli) => (
              <tr key={cli.id} className="hover:bg-blue-50/50 transition">
                <td className="p-4 font-bold text-gray-800">{cli.nombre_completo}</td>
                <td className="p-4 text-sm text-gray-600 font-mono">{cli.documento_identidad}</td>
                <td className="p-4">
                  <p className="text-sm text-gray-800">{cli.correo_electronico}</p>
                  <p className="text-xs text-gray-500">{cli.telefono}</p>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => navigate(`/clientes/${cli.id}`)} className="text-blue-600 font-bold text-sm px-3 py-1 rounded hover:bg-blue-100">
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#080E21] p-4 flex justify-between"><h2 className="text-white font-bold">Nuevo Cliente</h2><button onClick={() => setIsModalOpen(false)} className="text-white">&times;</button></div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-4">
              <div><label className="text-xs font-bold text-gray-700">Nombre / Razón Social *</label><input required name="nombre_completo" value={formData.nombre_completo} onChange={handleInputChange} className="w-full p-2 border rounded text-sm"/></div>
              <div><label className="text-xs font-bold text-gray-700">NIT o CI *</label><input required name="documento_identidad" value={formData.documento_identidad} onChange={handleInputChange} className="w-full p-2 border rounded text-sm"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-700">Teléfono</label><input name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-full p-2 border rounded text-sm"/></div>
                <div><label className="text-xs font-bold text-gray-700">Categoría</label>
                  <select name="categoria_id" value={formData.categoria_id} onChange={handleInputChange} className="w-full p-2 border rounded text-sm">
                    <option value="">Seleccione...</option>
                    {console.log("Categorías en catálogo:", catalogos.catalogos.categorias_cliente)}
                    {catalogos?.catalogos?.categorias_cliente?.map((cat, i) => (
                      <option key={i} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-bold text-gray-700">Correo Electrónico</label><input type="email" name="correo_electronico" value={formData.correo_electronico} onChange={handleInputChange} className="w-full p-2 border rounded text-sm"/></div>
              <div><label className="text-xs font-bold text-gray-700">Dirección</label><input name="direccion" value={formData.direccion} onChange={handleInputChange} className="w-full p-2 border rounded text-sm"/></div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-gray-500">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Clientes;