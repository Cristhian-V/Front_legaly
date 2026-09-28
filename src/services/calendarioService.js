import axios from "axios";
axios.defaults.withCredentials = true;

// Definimos la URL base de tu backend
const API_URL = `${import.meta.env.VITE_API_URL}/eventos`;

const obtenerEventos = async () => {
  try {
    const response = await axios.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los eventos:", error);
    throw error;
  }
};

const crearEventoUsuario = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/usuario`, data);
    return response.data;
  } catch (error) {
    console.error("Error al crear evento de usuario:", error);
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

const calendarioService = {
  obtenerEventos,
  crearEventoUsuario,
  obtenerParticipantes,
  responderAsistencia,
};

export default calendarioService;
