import axios from 'axios';

axios.defaults.withCredentials = true; 

const API_URL = 'http://localhost:3000/api/listados'; 

const traerListados = async () => {
  try {
    const response = await axios.get(`${API_URL}/`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los listados:", error);
    throw error;
  }
};

const listadosService = {
  traerListados
};

export default listadosService;