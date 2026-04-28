import axios from "axios";

axios.defaults.withCredentials = true;

// Definimos la URL base de tu backend
const API_URL = `${import.meta.env.VITE_API_URL}/casos`;

const obtenerCasos = async (tipo = "activos") => {
  try {
    // Enviamos el parámetro tipo como query string (?tipo=activos o ?tipo=historial)
    const response = await axios.get(`${API_URL}/`, {
      params: {
        tipo: tipo,
      },
    });
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

// --- CERRAR CASO ---
const cerrarCaso = async (expedienteId) => {
    try {
      const response = await axios.put(`${API_URL}/${expedienteId}/cerrar`);
      return response.data;
    } catch (error) {
      console.error("Error al cerrar el caso:", error);
      throw error;
    }
  }

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
        expediente_id: expediente_id,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el equipo del caso:", error);
    throw error;
  }
};

const addMiembroEquipo = async (expediente_id, abogados_ids) => {
  try {
    const response = await axios.post(`${API_URL}/equipo`, {
      expediente_id,
      usuarios_ids: abogados_ids,
    });
    return response.data;
  } catch (error) {
    console.error("Error al agregar miembro al equipo:", error);
    throw error;
  }
};

const eliminarMiembroEquipo = async (expediente_id, abogado_id) => {
  try {
    const response = await axios.delete(`${API_URL}/equipo`, {
      data: {
        expediente_id,
        usuario_id: abogado_id,
      },
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
const solicitarRevision = async (
  expediente_id,
  revisorSeleccionado,
  comentariosSolicitud,
  docsSeleccionados,
) => {
  try {
    const response = await axios.post(
      `${API_URL}/${expediente_id}/revisiones`,
      {
        revisor_id: +revisorSeleccionado,
        comentarios_solicitud: comentariosSolicitud,
        documentos_ids: docsSeleccionados, // Si está vacío [], el backend lo entiende como revisión general
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error al eliminar miembro del equipo:", error);
    throw error;
  }
};

const revisarCaso = async (expediente_id) => {
  try {
    const response = await axios.patch(
      `${API_URL}/revisiones/${expediente_id}/iniciar`,
      {},
    );
    return response.data;
  } catch (error) {
    console.error("Error al iniciar la revisión del caso:", error);
    throw error;
  }
};

const aprobarObservarCaso = async (revision_id, datosEvaluacion) => {
  try {
    const response = await axios.put(
      `${API_URL}/revisiones/${revision_id}`,
      datosEvaluacion,
    );
    return response.data;
  } catch (error) {
    console.error("Error al revisar el caso:", error);
    throw error;
  }
};

const obtenerRevisionActiva = async (expediente_id) => {
  try {
    const response = await axios.get(
      `${API_URL}/${expediente_id}/revisionActiva`,
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener la revisión activa del caso:", error);
    throw error;
  }
};

const obtenerContactosAsignados = async (expedienteId) => {
  try {
    const response = await axios.get(
      `${API_URL}/${expedienteId}/contactos-asignados`,
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener la contactos del caso:", error);
    throw error;
  }
};

const obtenerContactosDisponibles = async (expedienteId) => {
  try {
    const response = await axios.get(
      `${API_URL}/${expedienteId}/contactos-disponibles`,
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener contactos del cliente:", error);
    throw error;
  }
};

const asignarContactos = async (expedienteId, contactosIds) => {
  try {
    // contactosIds debe ser un array: [1, 4, 7]
    const response = await axios.post(`${API_URL}/${expedienteId}/contactos`, {
      contactos_ids: contactosIds,
    });
    return response.data;
  } catch (error) {
    console.error("Error al asignar contacto al caso:", error);
    throw error;
  }
};

// Quitar un contacto del caso (DELETE)
const quitarContacto = async (casoId, contactoId) => {
  try {
    console.log(casoId);
    const response = await axios.delete(
      `${API_URL}/${casoId}/contactos/${contactoId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error al asignar contacto al caso:", error);
    throw error;
  }
};

const cancelarRevision = async (idRevision) => {
  try {
    const response = await axios.patch(
      `${API_URL}/revisiones/${idRevision}/cancelar`,
      {},
    );
    return response.data;
  } catch (error) {
    console.error("Error al Cancelar la Revision del caso:", error);
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
  aprobarObservarCaso,
  revisarCaso,
  obtenerRevisionActiva,
  obtenerContactosAsignados,
  obtenerContactosDisponibles,
  asignarContactos,
  quitarContacto,
  cancelarRevision,
  cerrarCaso
};

export default casosService;
