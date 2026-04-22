import axios from 'axios';
axios.defaults.withCredentials = true; 

const API_URL = 'http://localhost:3000/api/calendario'; 



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