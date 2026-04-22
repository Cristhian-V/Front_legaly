import axios from "axios";

axios.defaults.withCredentials = true;

const API_URL = "http://localhost:3000/api/docs";

// =============================================================
// Función para obtener los documentos de un caso específico
//=============================================================

const obtenerDocumentosCaso = async (expediente_id) => {
  try {
    const response = await axios.get(`${API_URL}/${expediente_id}/documentacion`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los documentos del caso:", error);
    throw error;
  };
};

// =============================================================
// Función para subir un nuevo documento a un caso específico
//=============================================================
const subirDocumentoCaso = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/${formData.get('expediente_id')}/documentacion`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // MUY IMPORTANTE PARA ARCHIVOS
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al subir el documento:", error);
    throw error;
  }
};

const eliminarDocumentoCaso = async (docId) => {
  try {
    const response = await axios.delete(`http://localhost:3000/api/docs/${docId}/eliminar`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el documento:", error);
    throw error;
  }
};

const subirNuevaVersion = async (documentoId, formData) => {
  try {
    // Asegúrate de enviar los headers correctos para archivos (multipart/form-data)
    const response = await axios.post(`${API_URL}/${documentoId}/nueva_version`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el documento:", error);
    throw error;
  }
};

const crearDocumentoBlanco = async (expedienteId, data) => {
  try {
    // data debe contener: nombreArchivo, tipoPlantilla, tipoDocumento
    const response = await axios.post(`${API_URL}/${expedienteId}/crearDocumento`, data);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el documento:", error);
    throw error;
  }
}


const docsService = {
  obtenerDocumentosCaso,
  subirDocumentoCaso,
  eliminarDocumentoCaso,
  subirNuevaVersion,
  crearDocumentoBlanco
};

export default docsService;