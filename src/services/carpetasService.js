// src/services/carpetasService.js
import axios from 'axios';

axios.defaults.withCredentials = true;

// Definimos la URL base de tu backend 
const API_URL = `${import.meta.env.VITE_API_URL}/docsueltos`;


const obtenerCarpetas = async () => {
  try {
    const response = await axios.get(`${API_URL}/carpetas`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener carpetas:', error);
    throw error;
  }
};

const crearCarpeta = async (nombre) => {
  try {
    const response = await axios.post(`${API_URL}/carpetas`,
      { nombre_carpeta: nombre }
    );
    return response.data;
  } catch (error) {
    console.error('Error al crear carpeta:', error);
    throw error;
  }
};

const renombrarCarpeta = async (id, nuevoNombre) => {
  try {
    // Nota: Usamos 'nuevo_nombre' tal como lo pide tu backend
    const response = await axios.put(`${API_URL}/carpetas/${id}`,
      { nuevo_nombre: nuevoNombre }
    );
    return response.data;
  } catch (error) {
    console.error('Error al renombrar carpeta:', error);
    throw error;
  }
};

const eliminarCarpeta = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/carpetas/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar carpeta:', error);
    throw error;
  }
};

// --- MÓDULO: DOCUMENTOS DENTRO DE CARPETAS ---

// Obtener los documentos de una carpeta específica
const obtenerDetalleCarpeta = async (carpetaId) => {
  try {
    // Asumo que tienes una ruta GET como esta para listar el contenido
    const response = await axios.get(`${API_URL}/carpetas/${carpetaId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalle de carpeta:', error);
    throw error;
  }
};

// A. Subir un documento (multipart/form-data)
const subirDocumento = async (carpetaId, formData) => {
  try {
    const response = await axios.post(`${API_URL}/carpetas/${carpetaId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error al subir documento:', error);
    throw error;
  }
};



// B. Compartir Documento
const compartirDocumento = async (docId, usuariosIds) => {
  try {
    const response = await axios.post(`${API_URL}/documentos/${docId}/compartir`,
      { usuarios_ids: usuariosIds }
    );
    return response.data;
  } catch (error) {
    console.error('Error al compartir documento:', error);
    throw error;
  }
};

// C. Vincular a un Caso
const vincularACaso = async (docId, casoId, tipoDocumentoId) => {
  try {
    const response = await axios.post(`${API_URL}/documentos/${docId}/vincular-caso`,
      { caso_id: casoId, tipo_documento_id: tipoDocumentoId }
    );
    return response.data;
  } catch (error) {
    console.error('Error al vincular documento a caso:', error);
    throw error;
  }
};

// D. Eliminar Documento
const eliminarDocumento = async (docId) => {
  try {
    const response = await axios.delete(`${API_URL}/documentos/${docId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    throw error;
  }
};


const descargarDocumento = async (rutaArchivo) => {
  try {
    const response = await axios.get(`${API_URL}/descargar`, {
      // Axios convierte "params" automáticamente en req.query.ruta
      params: { 
        ruta: rutaArchivo 
      },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error("Error al intentar abrir el documento:", error);
    throw error;
  }
}  

// Crear un documento en blanco directamente en la carpeta
const crearDocumentoBlanco = async (carpetaId, data) => {
  try {
    // 'data' es un objeto que debe contener: { nombreArchivo, tipoPlantilla }
    const response = await axios.post(`${API_URL}/carpetas/${carpetaId}/documentos/blanco`, data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener blob de documento:', error);
    throw error;
  }
};

const carpetasService = {
  obtenerCarpetas,
  crearCarpeta,
  renombrarCarpeta,
  eliminarCarpeta,
  obtenerDetalleCarpeta,
  subirDocumento,
  compartirDocumento,
  vincularACaso,
  eliminarDocumento,
  descargarDocumento,
  crearDocumentoBlanco
};

export default carpetasService;