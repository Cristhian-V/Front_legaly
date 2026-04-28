import axios from 'axios';

axios.defaults.withCredentials = true;

const API_URL = `${import.meta.env.VITE_API_URL}/user`;


const obtenerUsuarios = async () => {
  try {
    const response = await axios.get(`${API_URL}/data`);
    return response.data;
  } catch (error) {
    console.error("Error al intentar abrir el documento:", error);
    throw error;
  }
}

const crearUsuario = async (usuarioData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      name_user: usuarioData.name_user,
      nombre_completo: usuarioData.nombre_completo,
      email: usuarioData.email,
      password: usuarioData.password,
      rol_usuario: usuarioData.rol_id
    });
    return response.data;
  } catch (error) {
    console.error("Error al intentar abrir el documento:", error);
    throw error;
  }
}


const modificarUsuario = async (id, usuarioData) => {
  try {
    const response = await axios.put(`${API_URL}/mod/${id}`, {
      name_user: usuarioData.name_user,
      nombre_completo: usuarioData.nombre_completo,
      email: usuarioData.email,
      rol_usuario: +usuarioData.rol_usuario,
      password: usuarioData.password,
      telefono: usuarioData.telefono,
      biografia: usuarioData.biografia,
      avatar_url: usuarioData.avatar_url,
      grado_id: usuarioData.grado_id
    });
    return response.data;
  } catch (error) {
    console.error("Error al intentar abrir el documento:", error);
    throw error;
  }
}

const eliminarUsuario = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al intentar abrir el documento:", error);
    throw error;
  }
}


const adminUsuariosService = {
  obtenerUsuarios,
  crearUsuario,
  modificarUsuario,
  eliminarUsuario
};

export default adminUsuariosService;