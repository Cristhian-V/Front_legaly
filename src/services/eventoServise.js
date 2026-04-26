import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/eventos`;

const obtenerEventosPorCaso = async (casoId) => {
  try {
    const response = await axios.get(`${API_URL}/caso/${casoId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener eventos del caso :", error);
    throw error;
  }
};

const crearEvento = async (eventoData) => {
  try {
    const response = await axios.post(`${API_URL}`, eventoData);
    return response.data;
  } catch (error) {
    console.error("Error al crear evento del caso:", error);
    throw error;
  }
};

const modificarEvento = async (id, eventoData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, eventoData);
    return response.data;
  } catch (error) {
    console.error("Error al modificar evento del caso:", error);
    throw error;
  }
};

const eliminarEvento = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar evento del caso:", error);
    throw error;
  }
};

const eventosService = {
  obtenerEventosPorCaso,
  crearEvento,
  modificarEvento,
  eliminarEvento,
};

export default eventosService;
