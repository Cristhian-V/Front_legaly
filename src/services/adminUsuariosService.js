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
      rol_usuario: usuarioData.rol_usuario,
      grado_id: 5
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
      avatar_url: usuarioData.avatar_url
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

const asignarAreasUsuario = async (usuarioId, areasLegalesIds) => {
  try {
    const response = await axios.post(`${API_URL}/area`, {
      usuario_id: usuarioId,
      areas_legales_ids: areasLegalesIds
    });
    return response.data;
  } catch (error) {
    console.error("Error al asignar áreas al usuario:", error);
    throw error;
  }
};

const removerAreaUsuario = async (usuarioId, areaLegalId) => {
  try {
    const response = await axios.delete(`${API_URL}/area`, {
      data: { usuario_id: usuarioId, area_legal_id: areaLegalId }
    });
    return response.data;
  } catch (error) {
    console.error("Error al remover área del usuario:", error);
    throw error;
  }
};


const adminUsuariosService = {
  obtenerUsuarios,
  crearUsuario,
  modificarUsuario,
  eliminarUsuario,
  asignarAreasUsuario,
  removerAreaUsuario
};

export default adminUsuariosService;