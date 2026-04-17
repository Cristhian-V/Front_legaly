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

const obtenerEquipoCaso = async (expediente_id) => {
  try {
    const response = await axios.get(`${API_URL}/equipo`, {
      params: {
        expediente_id: expediente_id
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el equipo del caso:", error);
    throw error;
  };
};

const addMiembroEquipo = async (expediente_id, abogado_id) => {
  try {
    const response = await axios.post(`${API_URL}/equipo`, {
      expediente_id,
      usuario_id : abogado_id
    });
    return response.data;
  } catch (error) {
    console.error("Error al agregar miembro al equipo:", error);
    throw error;
  };
}

const eliminarMiembroEquipo = async (expediente_id, abogado_id) => {
  try {
    const response = await axios.delete(`${API_URL}/equipo`, {
      data: {
        expediente_id,
        usuario_id: abogado_id
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar miembro del equipo:", error);
    throw error;
  }
};

// Añade esto a tu casosService.js
const obtenerHistorialCaso = async (id) => {
  try {
  const response = await axios.get(`${API_URL}/${id}/historial`);
  return response.data;
    } catch (error) {
    console.error("Error al eliminar miembro del equipo:", error);
    throw error;
  }
};

// envio de solicitudes para revisiones de casos
const solicitarRevision = async (expediente_id, revisorSeleccionado, comentariosSolicitud, docsSeleccionados) => {
  try {
  const response = await axios.post(`${API_URL}/${expediente_id}/revisiones`, {
    revisor_id: +revisorSeleccionado,
    comentarios_solicitud: comentariosSolicitud,
    documentos_ids: docsSeleccionados // Si está vacío [], el backend lo entiende como revisión general
  });
  return response.data;
    } catch (error) {
    console.error("Error al eliminar miembro del equipo:", error);
    throw error;
  }
};

const revisarCaso = async (expediente_id) => {
  try {
    const response = await axios.patch(`${API_URL}/revisiones/${expediente_id}/iniciar`,{});
    return response.data;
  } catch (error) {
    console.error("Error al revisar el caso:", error);
    throw error;
  }
};

const casosService = {
  obtenerCasos,
  crearCaso,
  obtenerDetalleCaso,
  obtenerIdForm,
  modificarCaso,
  obtenerEquipoCaso,
  addMiembroEquipo,
  eliminarMiembroEquipo,
  obtenerHistorialCaso,
  solicitarRevision,
  revisarCaso
};

export default casosService;
