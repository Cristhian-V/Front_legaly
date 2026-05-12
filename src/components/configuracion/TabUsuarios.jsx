import React, { useState, useEffect } from 'react';
import adminUsuariosService from '../../services/adminUsuariosService';
import userService from '../../services/userService';
import { useOutletContext } from 'react-router-dom';
import { Modal, Label, Input } from '../ui/ComponentesGenerales';

const TabUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const { catalogos, datosUsuario, recargarPerfil } = useOutletContext();

  // --- ESTADOS DEL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('crear'); // 'crear' | 'editar'
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    nombre_completo: '',
    name_user: '',
    email: '',
    password: '',
    rol_usuario: '',
    telefono: '',
    biografia: '',
    avatar_url: ''
  });

  const [areasSeleccionadas, setAreasSeleccionadas] = useState([]);
  const [areasUsuarios, setAreasUsuarios] = useState([]); // Cache de GET /api/user/area

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

  const cargarAreasUsuarios = async () => {
    try {
      const data = await userService.obtenerUsuariosPorArea();
      setAreasUsuarios(data || []);
    } catch {
      setAreasUsuarios([]);
    }
  };

  useEffect(() => {
    cargarUsuarios();
    cargarAreasUsuarios();
  }, []);

  // --- MANEJADORES DE ACCIONES ---
  const abrirModalCrear = () => {
    setModalMode('crear');
    setFormData({
      id: null, nombre_completo: '', name_user: '', email: '', password: '',
      rol_usuario: '', telefono: '', biografia: '', avatar_url: ''
    });
    setAreasSeleccionadas([]);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (usuario) => {
    setModalMode('editar');
    setFormData({
      id: usuario.id,
      nombre_completo: usuario.nombre_completo || '',
      name_user: usuario.nombre_usuario || '',
      email: usuario.email || '',
      password: '',
      rol_usuario: usuario.rol_id || '',
      telefono: usuario.telefono || '',
      biografia: usuario.biografia || '',
      avatar_url: usuario.avatar_url || ''
    });
    const usuarioArea = areasUsuarios.find(u => +u.id === +usuario.id);
    setAreasSeleccionadas(usuarioArea?.areas_legales?.map(a => a.id) || []);
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleArea = (id) => {
    setAreasSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      if (modalMode === 'crear') {
        const res = await adminUsuariosService.crearUsuario(formData);
        const nuevoId = res.user?.id;
        if (nuevoId && areasSeleccionadas.length > 0) {
          await adminUsuariosService.asignarAreasUsuario(nuevoId, areasSeleccionadas);
        }
      } else {
        const { id, ...datosAEditar } = formData;
        await adminUsuariosService.modificarUsuario(id, datosAEditar);

        const usuarioArea = areasUsuarios.find(u => +u.id === +id);
        const areasActuales = usuarioArea?.areas_legales?.map(a => a.id) || [];

        const areasAAgregar = areasSeleccionadas.filter(aid => !areasActuales.includes(aid));
        if (areasAAgregar.length > 0) {
          await adminUsuariosService.asignarAreasUsuario(id, areasAAgregar);
        }

        const areasARemover = areasActuales.filter(aid => !areasSeleccionadas.includes(aid));
        for (const areaId of areasARemover) {
          await adminUsuariosService.removerAreaUsuario(id, areaId);
        }
      }
      await cargarUsuarios();
      await cargarAreasUsuarios();
      await recargarPerfil()
      setIsModalOpen(false);
      alert(`Usuario ${modalMode === 'crear' ? 'creado' : 'actualizado'} exitosamente.`);
    } catch (error) {
      alert(`Error al ${modalMode} el usuario.`);
      console.error(error);
    } finally {
      setGuardando(false);
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

  const esAdminGeneral = datosUsuario?.rol === 'Abogado Socio';

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
        {esAdminGeneral && (
          <button
            onClick={abrirModalCrear}
            className="bg-[#1E3A5F] hover:bg-slate-800 text-white px-5 py-2 rounded-lg font-bold shadow transition flex items-center gap-2"
          >
            + Nuevo Usuario
          </button>
        )}
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
              <tr key={user.id}
                className={`transition group ${user.estado_id === 2
                    ? 'bg-orange-100 hover:bg-orange-100'
                    : 'hover:bg-blue-50/30'
                  }`}>
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
                  {user.estado_id === 1 ? (
                    <button onClick={() => abrirModalEditar(user)} className="text-blue-600 font-bold text-xs hover:underline mr-4">
                      Editar
                    </button>
                  ) : (
                    <button onClick={() => abrirModalEditar(user)} className="text-blue-600 font-bold text-xs hover:underline mr-4">
                      Habilitar
                    </button>
                  )}
                  {(datosUsuario?.rol === 'Abogado Socio' && user.estado_id === 1) && (
                    <button
                      onClick={() => handleEliminar(user.id, user.nombre_completo)}
                      className="text-red-500 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
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
        <Modal
          title={modalMode === 'crear' ? 'Registrar Nuevo Usuario' : 'Editar Datos de Usuario'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleGuardar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* 1. Nombre Completo */}
              <div>
                <Label text="Nombre Completo *" />
                <Input required name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} />
              </div>

              {/* 2. Nombre de Usuario (Login) */}
              <div>
                <Label text="Nombre de Usuario (Login) *" />
                <Input required name="name_user" value={formData.name_user} onChange={handleChange} />
              </div>

              {/* 3. Correo Electrónico */}
              <div>
                <Label text="Correo Electrónico *" />
                <Input required type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>

              {/* 4. Rol en el Sistema (RESTRINGIDO) */}
              <div>
                <Label text="Rol en el Sistema *" />
                <select
                  name="rol_usuario"
                  required
                  disabled={!esAdminGeneral}
                  value={formData.rol_usuario}
                  onChange={handleInputChange}
                  className={`w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${!esAdminGeneral ? 'bg-gray-50 cursor-not-allowed text-gray-500' : ''}`}
                >
                  <option value="">Asignar a...</option>
                  {catalogos?.catalogos?.roles_usuario?.map((rol, i) => (
                    <option key={i} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
                {!esAdminGeneral && <p className="text-[10px] text-gray-400 mt-1 italic">Solo el Administrador General puede cambiar roles.</p>}
              </div>

              {/* 5. Contraseña (Visible siempre, obligatoria al crear) */}
              <div>
                <Label text={`Contraseña ${modalMode === 'crear' ? '*' : '(Opcional)'}`} />
                <Input
                  required={modalMode === 'crear'}
                  type="password"
                  name="password"
                  placeholder={modalMode === 'editar' ? 'Dejar en blanco para no cambiar' : '********'}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* 7. Teléfono (SOLO VISIBLE AL EDITAR) */}
              {modalMode === 'editar' && (
                <div>
                  <Label text="Teléfono *" />
                  <Input required name="telefono" value={formData.telefono} onChange={handleChange} />
                </div>
              )}
            </div>

            {/* 8. Biografía (SOLO VISIBLE AL EDITAR) */}
            {modalMode === 'editar' && (
              <div className="mb-4">
                <Label text="Biografía / Notas *" />
                <textarea
                  required
                  name="biografia"
                  value={formData.biografia}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                  placeholder="Información adicional del colega..."
                ></textarea>
              </div>
            )}

            {/* 9. Áreas Legales */}
            <div className="mb-4">
              <Label text="Áreas Legales Asignadas" />
              <p className="text-[11px] text-gray-500 mb-2">Selecciona las áreas legales a las que pertenece este usuario.</p>
              <div className="border rounded-lg max-h-48 overflow-y-auto bg-gray-50/50 p-2 space-y-1">
                {catalogos?.catalogos?.area_legal?.length > 0 ? (
                  catalogos.catalogos.area_legal.map(area => (
                    <label
                      key={area.id}
                      className="flex items-center gap-3 p-2 rounded border border-transparent hover:bg-white hover:border-gray-200 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={areasSeleccionadas.includes(area.id)}
                        onChange={() => toggleArea(area.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">{area.nombre}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No hay áreas legales registradas.</p>
                )}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={guardando}
                className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-2 bg-[#1E3A5F] hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : modalMode === 'crear' ? 'Registrar Usuario' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TabUsuarios;