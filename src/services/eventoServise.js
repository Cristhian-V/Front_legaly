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

const obtenerParticipantes = async (tipoEvento, eventoId) => {
  try {
    const response = await axios.get(`${API_URL}/participantes`, {
      params: { tipo_evento: tipoEvento, evento_id: eventoId },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener los participantes del evento:", error);
    throw error;
  }
};

const responderAsistencia = async (data) => {
  try {
    const response = await axios.put(`${API_URL}/asistencia`, data);
    return response.data;
  } catch (error) {
    console.error("Error al registrar la asistencia:", error);
    throw error;
  }
};

const eventosService = {
  obtenerEventosPorCaso,
  crearEvento,
  modificarEvento,
  eliminarEvento,
  obtenerParticipantes,
  responderAsistencia,
};

export default eventosService;
