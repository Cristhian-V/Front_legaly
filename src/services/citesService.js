import axios from 'axios';

axios.defaults.withCredentials = true;

const API_URL = `${import.meta.env.VITE_API_URL}/cites`;

const obtenerCites = async () => {
  try {
    const response = await axios.get(`${API_URL}/`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los CITES:", error);
    throw error;
  }
};

const crearCite = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al crear el CITE:", error);
    throw error;
  }
};

const crearCiteExpediente = async (expedienteId, data) => {
  try {
    const response = await axios.post(`${API_URL}/expediente/${expedienteId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error al crear el CITE del expediente:", error);
    throw error;
  }
};

const citesService = {
  obtenerCites,
  crearCite,
  crearCiteExpediente,
};

export default citesService;
