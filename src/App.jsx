import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login'; // Asegúrate de crear esta carpeta y archivo

// Componente temporal para el Dashboard post-login
const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-blue-900">Panel de Control - Legaly</h1>
    <p>Bienvenido al sistema de gestión de expedientes.</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Ruta principal: Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Ruta protegida (ejemplo) */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Redirección automática si entran a la raíz */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;