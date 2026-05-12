import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import userService from '../services/userService';
import listadoService from '../services/listadosService';
import logoAyP from '../image/LogoAyP.png';


const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [datosUsuario, setDatosUsuario] = useState({
    rol: 'Cargando...', nombre_completo: 'Abogado', avatar_url: ''
  });
  const [catalogos, setCatalogos] = useState();
  const [casosPendientes, setCasosPendientes] = useState({});

  const [cargando, setCargando] = useState(true);

  const cargarCatalogos = async () => {
    try {
      // Suponiendo que tienes un servicio para esto
      const data = await listadoService.traerListados();
      setCatalogos(data);
    } catch (error) {
      console.error(error);
    }
  };
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


  // Cargamos el perfil UNA SOLA VEZ para toda la aplicación
  useEffect(() => {
    cargarPerfil();
  }, []);

  const navigateTo = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    authService.logout();
    navigate('/login');
  };

  // Función para dar estilo al botón activo del menú
  const getNavStyle = (path) => {
    const baseStyle = "w-full text-left px-4 py-3 rounded-md transition-all duration-300 font-medium flex items-center text-lg";
    return location.pathname === path
      ? `${baseStyle} bg-slate-800 text-white shadow-inner` // Estilo Activo
      : `${baseStyle} hover:bg-slate-700 hover:text-white text-gray-300`; // Estilo Inactivo
  };

  // Función para asignar el nombre de la sección según la ruta actual
  const obtenerTituloSeccion = (path) => {
    // 1. Diccionario para rutas exactas
    const titulosExactos = {
      '/dashboard': {
        'titulo': 'Panel de Control',
        'descripcion': 'Bienvenido/a al Sistema de Gestion de Expedientes de ALAIZA & PEDRAZA Abogados'
      },
      '/expedientes': {
        'titulo': 'Gestión de Expedientes',
        'descripcion': 'Podras Gestionar tus Expedientes y los de tu equipo desde aqui.'
      },
      '/clientes': {
        'titulo': 'Directorio de Clientes',
        'descripcion': 'Gestiona las empresas y personas representadas por la firma.'
      },
      '/configuracion': {
        'titulo': 'Configuración del Sistema',
        'descripcion': 'Administra usuarios, roles, catálogos y preferencias de la firma.'
      },
      '/revisiones': {
        'titulo': 'Bandeja de Revisiones',
        'descripcion': 'Gestiona y evalúa las solicitudes de revisión enviadas por tu equipo.'
      },
      '/carpetas': {
        'titulo': 'Gestion de Documentacion',
        'descripcion': 'Gestiona y evalúa las solicitudes de revisión enviadas por tu equipo.'
      }
    };

    if (titulosExactos[path]) return titulosExactos[path];

    // 2. Comprobaciones para rutas dinámicas (con IDs)
    if (path.startsWith('/dashboard/')) return {
      'titulo': 'Panel de Control',
      'descripcion': 'Bienvenido/a al Sistema de Gestion de Expedientes de ALAIZA & PEDRAZA Abogados'
    };
    if (path.startsWith('/expedientes/')) return {
      'titulo': 'Gestión de Expedientes',
      'descripcion': 'Podras Gestionar tus Expedientes y los de tu equipo desde aqui.'
    };
    if (path.startsWith('/clientes/')) return {
      'titulo': 'Directorio de Clientes',
      'descripcion': 'Gestiona las empresas y personas representadas por la firma.'
    };
    if (path.startsWith('/configuracion/')) return {
      'titulo': 'Configuración del Sistema',
      'descripcion': 'Administra usuarios, roles, catálogos y preferencias de la firma.'
    };
    if (path.startsWith('/revisiones/')) return {
      'titulo': 'Bandeja de Revisiones',
      'descripcion': 'Gestiona y evalúa las solicitudes de revisión enviadas por tu equipo.'
    };
    if (path.startsWith('/carpetas/')) return {
      'titulo': 'Gestion de Documentacion',
      'descripcion': 'Gestiona y evalúa las solicitudes de revisión enviadas por tu equipo.'
    };
  };

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#152844]">
        <h2 className="text-white text-2xl animate-pulse">Cargando Legaly...</h2>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR – fixed off-screen on mobile, static in flex on desktop */}
      <div className={`w-64 bg-[#152844] text-gray-300 flex flex-col shadow-xl z-30 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:transform max-lg:transition-transform max-lg:duration-300 ${sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-center items-center">
          <img src={logoAyP} alt="Logo AyP" className="h-12 w-auto object-contain" />
        </div>
        <nav className="flex-1 flex flex-col p-4 bg-[#1E3A5F]">
          <div className="flex-grow space-y-2">
            <button onClick={() => navigateTo('/dashboard')} className={getNavStyle('/dashboard')}>Inicio</button>
            <button onClick={() => navigateTo('/expedientes')} className={getNavStyle('/expedientes')}>Expedientes</button>
            <button onClick={() => navigateTo('/revisiones')} className={getNavStyle('/revisiones')}>Bandeja de Revisiones</button>
            <button onClick={() => navigateTo('/clientes')} className={getNavStyle('/clientes')}>Clientes</button>
            <button onClick={() => navigateTo('/carpetas')} className={getNavStyle('/carpetas')}>Control Documental</button>
          </div>
          <div className="pt-4 border-t border-gray-800 space-y-2">
            <button onClick={() => navigateTo('/configuracion')} className={getNavStyle('/configuracion')}>Configuración</button>
            <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-md hover:bg-slate-700 hover:text-white transition-all text-gray-300 font-medium text-lg">Cerrar Sesión</button>
          </div>
        </nav>
      </div>

      {/* CONTENEDOR DERECHO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER FIJO */}
        <header className="bg-white shadow-sm flex justify-between items-stretch border-b h-24">
          <div className="pl-4 lg:pl-8 flex flex-col justify-center">
            {/* Hamburger – visible only on mobile */}
            <button
              className="lg:hidden mb-2 text-[#152844]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Título dinámico según la ruta */}
            <h2 className="text-xl lg:text-3xl font-black text-[#152844] mb-1 lg:mb-2">
              {obtenerTituloSeccion(location.pathname).titulo}
            </h2>
            <p className="text-xs lg:text-sm text-gray-500">{obtenerTituloSeccion(location.pathname).descripcion}</p>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-4 pr-4 lg:pr-6">
              <div className="text-right">
                <span className="text-xs lg:text-sm text-gray-500 italic block">{datosUsuario.rol}</span>
                <span className="font-semibold text-gray-800 text-sm lg:text-base">{datosUsuario.nombre_completo}</span>
              </div>
            </div>

          </div>
        </header>

        {/* AQUÍ SE INYECTA EL CONTENIDO DINÁMICO (Inicio o Expedientes) */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Outlet context={{ datosUsuario, catalogos, casosPendientes, recargarCatalogos: cargarCatalogos, recargarPerfil: cargarPerfil }} />
        </div>
      </div>
    </div>
  );
};

export default Layout;