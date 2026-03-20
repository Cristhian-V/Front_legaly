import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [name_user, setNameUser] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // La URL debe coincidir con tu server.js del backend 
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        name_user,
        password
      });

      console.log("Respuesta del servidor:", response.data); // Para depuración

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      }
    } catch (error) {
      alert("Error en las credenciales. Revisa tu email o contraseña.", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-extrabold text-center text-blue-800 mb-6">LEGALY</h2>
        <p className="text-center text-gray-500 mb-8">Gestión de Expedientes Jurídicos</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
            <input
              type="text"
              value={name_user}
              onChange={(e) => setNameUser(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="abogado"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition duration-200"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;