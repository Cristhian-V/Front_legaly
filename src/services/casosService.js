import axios from "axios";

axios.defaults.withCredentials = true;

const API_URL = "http://localhost:3000/api/casos";

const obtenerCasos = async () => {
  try {
    const response = await axios.get(`${API_URL}/`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los casos:", error);
    throw error;
  }
};

const crearCaso = async (casoData) => {
  try {
    const response = await axios.post(`${API_URL}/`, {
      area_legal_id: +casoData.areaLegal,
      cliente_id: +casoData.cliente,
      responsable_id: +casoData.responsable,
      descripcion_corta: casoData.titulo,
      descripcion_completa: casoData.descripcion,
      contraparte: casoData.contraparte,
      fecha_inicio: null,
    });
    return response.data; // Aquí podrías devolver el nuevo caso creado o un mensaje de éxito
  } catch (error) {
    console.error("Error al obtener los casos:", error);
    throw error;
  }
};

const obtenerDetalleCaso = async (expediente_id) => {
  try {
    const response = await axios.get(`${API_URL}/${expediente_id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los casos:", error);
    throw error;
  }
};

const obtenerIdForm = async (expediente_id) => {
  try {
    const response = await axios.get(`${API_URL}/formData/${expediente_id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los casos:", error);
    throw error;
  }
};

const modificarCaso = async (id, casoData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, {
      area_legal_id: +casoData.areaLegal,
      cliente_id: +casoData.cliente,
      responsable_id: +casoData.responsable,
      descripcion_corta: casoData.titulo,
      descripcion_completa: casoData.descripcion,
      contraparte: casoData.contraparte,
    });
    return response.data;
  } catch (error) {
    console.error("Error al modificar el caso:", error);
    throw error;
  }
};



const casosService = {
  obtenerCasos,
  crearCaso,
  obtenerDetalleCaso,
  obtenerIdForm,
  modificarCaso,
};

export default casosService;
