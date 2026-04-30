import axios from 'axios';

// Definimos la URL base de tu backend
const API_URL = `${import.meta.env.VITE_API_URL}/catalogos`;

const catalogosAdminService = {
  obtenerCatalogo: async (catalogo) => {
    const response = await axios.get(`${API_URL}/${catalogo}`, { withCredentials: true });
    return response.data;
  },
  crearRegistro: async (catalogo, data) => {
    const response = await axios.post(`${API_URL}/${catalogo}`, data, { withCredentials: true });
    return response.data;
  },
  actualizarRegistro: async (catalogo, id, data) => {
    const response = await axios.put(`${API_URL}/${catalogo}/${id}`, data, { withCredentials: true });
    return response.data;
  },
  desactivarRegistro: async (catalogo, id) => {
    const response = await axios.delete(`${API_URL}/${catalogo}/${id}`, { withCredentials: true });
    return response.data;
  },
  activarRegistro: async (catalogo, id) => {
    // Apuntamos a la nueva ruta con /activar
    const response = await axios.put(`${API_URL}/${catalogo}/${id}/activar`, {}, { withCredentials: true });
    return response.data;
  }
};

export default catalogosAdminService;