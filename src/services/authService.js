import axios from 'axios';

//configuracion axios para enviar cookies en cada solicitud
axios.defaults.withCredentials = true; 

// Definimos la URL base de tu backend 
const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

const login = async (name_user, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      name_user,
      password
    });

    // Si recibimos un token, lo guardamos en el localStorage
    /*
    if (response.data.token) {
      document.cookie = `token=${response.data.token}; path=/; SameSite=Strict`;
    }*/

    return response.data;
  } catch (error) {
    // Re-lanzamos el error para que el componente Login pueda manejarlo (mostrar alertas, etc.)
    throw error.response ? error.response.data : new Error('Error de conexión');
  }
};

const logout = async () => {
  try {
        const response = await axios.post(`${API_URL}/logout`);
        return response.data.message;
    } catch (error) {
        console.log( error);
    }  
};

const getCurrentUserID = async () => {
try {
        const response = await axios.get(`${API_URL}/verify`);

        const userData = response.data.user;
        return userData.id; 
        // Aquí guardarías userData en un estado global (como Redux o Context)
    } catch (error) {
        console.log("No hay sesión activa o el token expiró : ", error);
        // Redirigir al login si es necesario
        logout();        
    }
};

//verificación de autenticación con el servidor
const isAuthenticated = async () => {
  try {
    const response = await axios.get(`${API_URL}/verify`);
    return response.data.isAuthenticated; // Si la verificación es exitosa, el usuario está autenticado

  } catch {
    return false; // Si hay un error (como token inválido o expirado), no está autenticado
  }
};

// Exportamos las funciones como un objeto
const authService = {
  login,
  logout,
  getCurrentUserID,
  isAuthenticated
};

export default authService;