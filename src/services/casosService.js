import axios from 'axios';

axios.defaults.withCredentials = true; 

const API_URL = 'http://localhost:3000/api/casos'; 

const obtenerCasos = async () => {
  try {
    const response = await axios.get(`${API_URL}/`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los casos:", error);
    throw error;
  }     
};

const casosService = {
  obtenerCasos
};

export default casosService;