import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import userService from '../services/userService';
import listadoService from '../services/listadosService'
import logoAyP from '../image/LogoAyP.png'; 

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Para saber en qué página estamos y pintar el botón activo

  const [datosUsuario, setDatosUsuario] = useState({
    rol: 'Cargando...', nombre_completo: 'Abogado', avatar_url: ''
  });
  const [catalogos, setCatalogos] = useState();
  const [casosPendientes, setCasosPendientes] = useState({});

  const [cargando, setCargando] = useState(true);

  // Cargamos el perfil UNA SOLA VEZ para toda la aplicación
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const respuestaPerfil = await userService.obtenerPerfil();
        if (respuestaPerfil && respuestaPerfil.dataUsuario) {
          setDatosUsuario(respuestaPerfil.dataUsuario);
        }
        
        // Peticiones paralelas para que cargue más rápido y aislemos errores
        const [dataRevisiones, respuestaCatalogos] = await Promise.all([
          userService.obtenerCasosPendientes().catch(() => ({ casos_pendientes: 0 })), // Si falla, devolvemos 0 por defecto
          listadoService.traerListados().catch(() => ({})) // Si falla, devolvemos objeto vacío
        ]);

        setCatalogos(respuestaCatalogos);
        setCasosPendientes(dataRevisiones);

      } catch (error) {
        console.error("Error crítico al cargar el Layout:", error);
        
        // Solo deslogueamos si el servidor nos dice explícitamente que el token es inválido (Error 401 o 403)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
           handleLogout();
        }
      } finally {
        setCargando(false);
      }
    };
    cargarPerfil();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Función para dar estilo al botón activo del menú
  const getNavStyle = (path) => {
    const baseStyle = "w-full text-left px-4 py-3 rounded-md transition-all duration-300 font-medium flex items-center";
    return location.pathname === path
      ? `${baseStyle} bg-slate-800 text-white shadow-inner` // Estilo Activo
      : `${baseStyle} hover:bg-slate-700 hover:text-white text-gray-300`; // Estilo Inactivo
  };

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080E21]">
        <h2 className="text-white text-2xl animate-pulse">Cargando Legaly...</h2>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR FIJO */}
      <div className="w-64 bg-[#080E21] text-gray-300 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-gray-800 flex justify-center items-center">
          <img src={logoAyP} alt="Logo AyP" className="h-12 w-auto object-contain" />
        </div>
        <nav className="flex-1 flex flex-col p-4 bg-[#0F172A]">
          <div className="flex-grow space-y-2">
            <button onClick={() => navigate('/dashboard')} className={getNavStyle('/dashboard')}>Inicio</button>
            <button onClick={() => navigate('/expedientes')} className={getNavStyle('/expedientes')}>Expedientes</button>
            <button onClick={() => navigate('/revisiones')} className={getNavStyle('/revisiones')}>Bandeja de Revisiones</button>
            <button className={getNavStyle('/clientes')}>Clientes</button>
            <button className={getNavStyle('/calendario')}>Documentos Pendientes</button>
          </div>
          <div className="pt-4 border-t border-gray-800 space-y-2">
            <button className={getNavStyle('/configuracion')}>Configuración</button>
            <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-md hover:bg-slate-700 hover:text-white transition-all text-gray-300 font-medium">Cerrar Sesión</button>
          </div>
        </nav>
      </div>

      {/* CONTENEDOR DERECHO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER FIJO */}
        <header className="bg-white shadow-sm flex justify-between items-stretch border-b h-24">
          <div className="pl-8 flex flex-col justify-center">
            {/* Título dinámico según la ruta */}
            <h2 className="text-xl font-semibold text-gray-700">
              {location.pathname === '/expedientes' ? 'Gestión de Expedientes' : 'Panel de Control Legaly'}
            </h2>
            <p className="text-sm text-gray-500">Bienvenido al sistema</p>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-4 pr-6">
              <div className="text-right">
                <span className="text-sm text-gray-500 italic block">{datosUsuario.rol}</span>
                <span className="font-semibold text-gray-800">{datosUsuario.nombre_completo}</span>
              </div>
            </div>
            <div className="h-full w-24 border-l border-gray-200 bg-gray-100 overflow-hidden">
              <img
                src={datosUsuario.avatar_url || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* AQUÍ SE INYECTA EL CONTENIDO DINÁMICO (Inicio o Expedientes) */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Outlet context={{ datosUsuario, catalogos , casosPendientes}} />
        </div>
      </div>
    </div>
  );
};

export default Layout;