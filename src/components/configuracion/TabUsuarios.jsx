import React, { useState, useEffect } from 'react';
import adminUsuariosService from '../../services/adminUsuariosService';
import { useOutletContext } from 'react-router-dom';

const TabUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const { catalogos } = useOutletContext();

  // --- ESTADOS DEL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('crear'); // 'crear' | 'editar'

  const [formData, setFormData] = useState({
    id: null,
    nombre_completo: '',
    name_user: '', // Username (login)
    email: '',
    password: '', // Solo para creación
    rol_usuario: '',
    telefono: '',
    biografia: '',
    avatar_url: '',
    grado_id: '' // Opcional, según tu backend
  });

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const data = await adminUsuariosService.obtenerUsuarios();      
      setUsuarios(data.user || data || []); // Ajusta según la respuesta exacta de tu GET /data
      
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // --- MANEJADORES DE ACCIONES ---
  const abrirModalCrear = () => {
    setModalMode('crear');
    setFormData({
      id: null, nombre_completo: '', name_user: '', email: '', password: '',
      rol_usuario: '', telefono: '', biografia: '', avatar_url: '', grado_id: ''
    });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (usuario) => {
    setModalMode('editar');
    setFormData({
      id: usuario.id,
      nombre_completo: usuario.nombre_completo || '',
      name_user: usuario.name_user || '',
      email: usuario.email || '',
      password: '', // No lo enviamos en el PUT
      rol_usuario: usuario.rol_usuario || '',
      telefono: usuario.telefono || '',
      biografia: usuario.biografia || '',
      avatar_url: usuario.avatar_url || '',
      grado_id: usuario.grado_id || ''
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'crear') {
        // Enviar todo incluyendo password
        await adminUsuariosService.crearUsuario(formData);
      } else {
        // No enviamos el password al editar, extraemos el ID
        const { id, password, ...datosAEditar } = formData;
        await adminUsuariosService.modificarUsuario(id, datosAEditar);
      }
      await cargarUsuarios();
      setIsModalOpen(false);
      alert(`Usuario ${modalMode === 'crear' ? 'creado' : 'actualizado'} exitosamente.`);
    } catch (error) {
      alert(`Error al ${modalMode} el usuario.`);
      console.error(error);
    }
  };
    const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${nombre}?`)) return;
    try {
      await adminUsuariosService.eliminarUsuario(id);
      await cargarUsuarios();
    } catch (error) {
      alert("Error al eliminar el usuario: " + error);
    }
  };

  // Filtrado
  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return <div className="py-20 text-center animate-pulse text-gray-500">Cargando personal...</div>;

  return (
    <div>
      {/* HEADER DE LA PESTAÑA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-[#0F172A] hover:bg-slate-800 text-white px-5 py-2 rounded-lg font-bold shadow transition flex items-center gap-2"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
            <tr>
              <th className="p-4">Usuario</th>
              <th className="p-4">Contacto</th>
              <th className="p-4">Rol en el Sistema</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuariosFiltrados.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/30 transition group">
                <td className="p-4 flex items-center gap-3">
                  <img
                    src={user.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                    alt="avatar"
                    className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                  />
                  <div>
                    <p className="font-bold text-gray-800">{user.nombre_completo}</p>
                    <p className="text-xs text-gray-400">@{user.nombre_usuario}</p>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-sm font-medium text-gray-700">{user.email}</p>
                  <p className="text-xs text-gray-400">{user.telefono || 'Sin teléfono'}</p>
                </td>
                <td className="p-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold capitalize">
                    {user.rol_nombre || 'Abogado'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => abrirModalEditar(user)} className="text-blue-600 font-bold text-xs hover:underline mr-4">
                    Editar
                  </button>
                  <button onClick={() => handleEliminar(user.id, user.nombre_completo)} className="text-red-500 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuariosFiltrados.length === 0 && (
          <div className="text-center py-10 text-gray-500">No se encontraron usuarios.</div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR USUARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-[#080E21] p-4 flex justify-between items-center">
              <h2 className="text-white font-bold">
                {modalMode === 'crear' ? 'Registrar Nuevo Usuario' : 'Editar Datos de Usuario'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleGuardar} className="p-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nombre Completo *</label>
                  <input required name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nombre de Usuario (Login) *</label>
                  <input required name="name_user" value={formData.name_user} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Correo Electrónico *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Teléfono</label>
                  <input name="telefono" value={formData.telefono} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                {/* LA CONTRASEÑA SOLO SE PIDE AL CREAR */}
                {modalMode === 'crear' && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Contraseña Temporal *</label>
                    <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Rol en el Sistema *</label>
                  <select name="rol_id" required value={formData.rol_id} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Asignar a...</option>
                    {catalogos?.catalogos?.roles_usuario.map((rol, i) => (
                      <option key={i} value={rol.id}>{rol.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-700 block mb-1">Biografía / Notas</label>
                <textarea name="biografia" value={formData.biografia} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20" placeholder="Información adicional del colega..."></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition">
                  {modalMode === 'crear' ? 'Registrar Usuario' : 'Guardar Cambios'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default TabUsuarios;