import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import casosService from '../services/casosService';


const Expedientes = () => {
  const [busqueda, setBusqueda] = useState('');
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const navigate = useNavigate();

  const autenticado = async () => {
    const esAuth = await authService.isAuthenticated();
    if (!esAuth) {
      navigate('/login');
    }
  };

  const cargarDataCasos = async () => {
    try {
      // Promise.all ejecuta ambas peticiones al mismo tiempo y espera a que LAS DOS terminen
      const [respuestaCasos] = await Promise.all([
        casosService.obtenerCasos()
      ]);
      console.log("Casos obtenidos del backend: ", respuestaCasos.casos);
      setCasos(respuestaCasos.casos);

    } catch (error) {
      console.error("Error al cargar los datos del panel:", error);
    } finally {
      // Solo quitamos la pantalla de carga cuando ya tenemos TANTO el perfil COMO los casos
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDataCasos();
    autenticado();
  }, []);

  // Filtrado de expedientes en tiempo real
  const casosFiltrados = casos.filter(caso =>
    caso.descripcion_corta.toLowerCase().includes(busqueda.toLowerCase()) ||
    caso.expediente_id.toLowerCase().includes(busqueda.toLowerCase()) ||
    caso.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Función para determinar el color de la etiqueta (Badge) del estado
  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Activo': return 'bg-green-100 text-green-800 border-green-200';
      case 'En Espera': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cerrado': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080E21]">
        <h2 className="text-white text-2xl animate-pulse">Cargando Expedientes...</h2>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">

      {/* Barra de Herramientas: Buscador y Botón Nuevo */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">

        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por ID, título o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
          />
        </div>

        {/* Botón Nuevo Expediente */}
        <button className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">
          <span>+</span> Nuevo Expediente
        </button>
      </div>

      {/* TABLA DE EXPEDIENTES */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-semibold">ID Expediente</th>
                <th className="p-4 font-semibold">Título del Caso</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Fecha Inicio</th>
                <th className="p-4 font-semibold">Responsable</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {casosFiltrados.length > 0 ? (
                casosFiltrados.map((caso, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-sm text-blue-600 font-semibold">{caso.expediente_id}</td>
                    <td className="p-4 text-gray-800 font-medium">{caso.descripcion_corta}</td>
                    <td className="p-4 text-gray-600">{caso.cliente_nombre}</td>
                    <td className="p-4 text-gray-500 text-sm">{caso.fecha_apertura}</td>
                    <td className="p-4 text-gray-600">{caso.responsable_nombre}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoBadge(caso.estado_nombre)}`}>
                        {caso.estado_nombre}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => navigate(`/expedientes/${caso.expediente_id}`)} // <-- AÑADIR ESTO
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm px-3 py-1 rounded hover:bg-blue-50 transition"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No se encontraron expedientes que coincidan con la búsqueda "{busqueda}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
};

export default Expedientes;