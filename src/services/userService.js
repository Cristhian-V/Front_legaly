import axios from 'axios';
axios.defaults.withCredentials = true; 

const API_URL = 'http://localhost:3000/api/inicio'; 

const obtenerPerfil = async () => {
  try {
    //const id = await authService.getCurrentUserID();
    // 3. Hacemos la petición GET al backend
    // Suponemos que tienes un endpoint '/user/:id' que devuelve los datos del usuario logueado
    const response = await axios.get(`${API_URL}/userData`); 

    return response.data; // Devolvemos los datos del usuario al componente

  } catch (error) {
    console.error("Error al obtener el perfil del usuario:", error);
    throw error;
  }
};

const obtenerCasos = async () => {
  try {
    const response = await axios.get(`${API_URL}/casosUsusario`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los casos:", error);
    throw error;
  }
};

const obtenerEventos = async () => {
  try {
    const response = await axios.get(`${API_URL}/eventos`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los eventos:", error);
    throw error;
  }
};


const userService = {
  obtenerPerfil,
  obtenerCasos,
  obtenerEventos
};

export default userService;