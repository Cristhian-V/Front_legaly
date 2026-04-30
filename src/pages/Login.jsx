import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Importamos el servicio
import authService from '../services/authService';

// 1 y 2. Importaciones de las imágenes requeridas
import bgLogin from '../image/FondoLoginn.jpg';
import logoEmpresa from '../image/LOGO2-02-325x217.png';

const Login = () => {
  const [name_user, setNameUser] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Llamamos a la lógica delegada en el servicio
      await authService.login(name_user, password);
      
      // Si no hubo error, el token ya está guardado y podemos navegar
      navigate('/dashboard'); 
    } catch (error) {
      // Manejamos el error que el servicio lanzó
      const message = error.message || "Error en las credenciales. Revisa tu usuario o contraseña.";
      alert(message);
    }
  };
  return (
    // 1. Contenedor principal con la imagen de fondo
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      {/* Capa oscura superpuesta (overlay) para que el cuadro de login resalte mejor sobre el fondo */}
      {/*<div className="absolute inset-0 bg-black bg-opacity-60"></div>*/}

      {/* Contenedor del Cuadro de Login (Estilo Split-Screen) */}
      <div className="relative z-10 flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden mx-4 h-[550px]">
        
        {/* Mitad Izquierda: Branding y Logo (Se oculta en pantallas de celulares para ahorrar espacio) */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-[#080E21] p-12 text-center relative">
          {/* 2. Logo de la empresa */}
          <img 
            src={logoEmpresa} 
            alt="Logo Legaly" 
            className="w-64 mb-8 object-contain drop-shadow-lg" 
          />
          
          {/* 3. Mensaje de bienvenida en español */}
          <h2 className="text-3xl font-bold text-white mb-4">¡Bienvenido de nuevo!</h2>
          <div className="w-16 h-1 bg-blue-500 mb-6 rounded-full"></div>
          <p className="text-gray-300 text-lg">
            Inicia sesión para continuar gestionando tus expedientes y documentos jurídicos.
          </p>
        </div>

        {/* Mitad Derecha: 4. Formulario de Autenticación */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white">
          
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center md:text-left">
            Ingresa a tu cuenta
          </h3>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Usuario</label>
              <input
                type="text"
                value={name_user}
                onChange={(e) => setNameUser(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#080E21] focus:border-transparent transition-all outline-none"
                placeholder="Ej. abogado_socio"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#080E21] focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 mt-4 bg-[#0F172A] hover:bg-slate-700 text-white font-bold rounded-lg transition duration-300 shadow-md"
            >
              Iniciar Sesión
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;