import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Importamos las páginas principales
import Login from './pages/Login'; 
import Layout from './components/Layout';
import Dashboard from './pages/Inicio';
import Expedientes from './pages/Expedientes';
import DetalleExpediente from './pages/DetalleExpediente';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas Protegidas (Envueltas en el Layout) */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expedientes" element={<Expedientes />} />
            <Route path="/expedientes/:id" element={<DetalleExpediente />} />
            {/* Aquí añadirás más adelante <Route path="/clientes" ... /> */}
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;