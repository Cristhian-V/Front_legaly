import axios from 'axios';

axios.defaults.withCredentials = true;

const API_URL = 'http://localhost:3000/api/cliente';


// --- MÓDULO DE CLIENTES ---
const obtenerClientes = async () => {
  try {
    const response = await axios.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
    throw error;
  }
};

const crearCliente = async (clienteData) => {
  try {
    const response = await axios.post(`${API_URL}`, clienteData);
    return response.data;
  } catch (error) {
    console.error("Error al crear el cliente:", error);
    throw error;
  }
};

const modificarCliente = async (id, clienteData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, clienteData);
    return response.data;
  } catch (error) {
    console.error("Error al modificar el cliente:", error);
    throw error;
  }
};

const eliminarCliente = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el cliente:", error);
    throw error;
  }
};

// --- MÓDULO DE CONTACTOS ---
const obtenerContactos = async (clienteId) => {
  try {
    const response = await axios.get(`${API_URL}/${clienteId}/contactos`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los contactos:", error);
    throw error;
  }
};

const crearContacto = async (clienteId, contactoData) => {
  try {
    const response = await axios.post(`${API_URL}/${clienteId}/contactos`, contactoData);
    return response.data;
  } catch (error) {
    console.error("Error al crear el contacto:", error);
    throw error;
  }
};

const modificarContacto = async (contactoId, contactoData) => {
  // Nota: El backend exige que contactoData incluya 'cliente_id'
  try {
    const response = await axios.put(`${API_URL}/contactos/${contactoId}`, contactoData);
    return response.data;
  } catch (error) {
    console.error("Error al modificar el contacto:", error);
    throw error;
  }
};

const eliminarContacto = async (contactoId) => {
  try {
    const response = await axios.delete(`${API_URL}/contactos/${contactoId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el contacto:", error);
    throw error;
  }
};

const clienteService = {
  obtenerClientes,
  crearCliente,
  modificarCliente,
  eliminarCliente,
  obtenerContactos,
  crearContacto,
  modificarContacto,
  eliminarContacto
}

export default clienteService;