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

const calendarioService = {
  obtenerEventos,
};

export default calendarioService;
