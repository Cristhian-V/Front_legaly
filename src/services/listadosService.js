import axios from 'axios';

axios.defaults.withCredentials = true; 

// Definimos la URL base de tu backend 
const API_URL = `${import.meta.env.VITE_API_URL}/listados`;


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