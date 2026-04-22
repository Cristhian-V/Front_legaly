import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clienteService from '../services/clienteService';

const DetalleCliente = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState({});
  const [contactos, setContactos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados de Modales
  const [isEditClienteOpen, setIsEditClienteOpen] = useState(false);
  const [isContactoOpen, setIsContactoOpen] = useState(false);

  // Estados de Formularios
  const [clienteForm, setClienteForm] = useState({});
  const [contactoForm, setContactoForm] = useState({ id: null, nombre_contacto: '', cargo: '', telefono: '', email: '', es_principal: false });

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      // Asumiendo que filtramos el cliente de la lista general (o tienes un endpoint GET /clientes/:id)
      const listaClientes = await clienteService.obtenerClientes();
      const clienteEncontrado = listaClientes.find(c => c.id.toString() === id);
      setCliente(clienteEncontrado || {});

      const listaContactos = await clienteService.obtenerContactos(id);
      setContactos(listaContactos);
    } catch (error) {
      console.error("Error al cargar detalle del cliente:", error);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // --- LÓGICA DE CLIENTE ---
  const abrirEditarCliente = () => {
    setClienteForm(cliente);
    setIsEditClienteOpen(true);
  };

  const handleGuardarCliente = async (e) => {
    e.preventDefault();
    try {
      await clienteService.modificarCliente(id, clienteForm);
      await cargarDatos();
      setIsEditClienteOpen(false);
    } catch (error) { alert("Error al modificar cliente: " + error.message); }
  };

  // --- LÓGICA DE CONTACTOS ---
  const abrirModalContacto = (contacto = null) => {
    if (contacto) {
      setContactoForm({ ...contacto }); // Modo Edición
    } else {
      setContactoForm({ id: null, nombre_contacto: '', cargo: '', telefono: '', email: '', es_principal: false }); // Modo Creación
    }
    setIsContactoOpen(true);
  };

  const handleGuardarContacto = async (e) => {
    e.preventDefault();
    try {
      // Importante: Aseguramos enviar el cliente_id para la lógica de "es_principal"
      const payload = { ...contactoForm, cliente_id: id };

      if (contactoForm.id) {
        await clienteService.modificarContacto(contactoForm.id, payload);
      } else {
        await clienteService.crearContacto(id, payload);
      }
      await cargarDatos();
      setIsContactoOpen(false);
    } catch (error) { alert("Error al guardar contacto: " + error.message); }
  };

  const handleEliminarContacto = async (contactoId) => {
    if (!window.confirm("¿Seguro que deseas eliminar este contacto?")) return;
    try {
      await clienteService.eliminarContacto(contactoId);
      await cargarDatos();
    } catch (error) { alert("Error al eliminar contacto: " + error.message); }
  };

  if (cargando) return <div className="p-20 text-center">Cargando datos del cliente...</div>;

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <button onClick={() => navigate('/clientes')} className="text-gray-500 mb-6 hover:text-blue-600 font-bold text-sm">
        ← Volver a Directorio
      </button>

      {/* TARJETA: INFO GENERAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-black text-[#080E21]">{cliente.nombre_completo}</h1>
            <p className="text-gray-500 font-mono mt-1">NIT/CI: {cliente.documento_identidad}</p>
          </div>
          <button onClick={abrirEditarCliente} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition">
            Editar Perfil
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
          <div><p className="text-xs text-gray-400 font-bold uppercase">Correo Corporativo</p><p className="font-medium">{cliente.correo_electronico || 'N/A'}</p></div>
          <div><p className="text-xs text-gray-400 font-bold uppercase">Teléfono Central</p><p className="font-medium">{cliente.telefono || 'N/A'}</p></div>
          <div><p className="text-xs text-gray-400 font-bold uppercase">Dirección Física</p><p className="font-medium text-sm">{cliente.direccion || 'N/A'}</p></div>
        </div>
      </div>

      {/* SECCIÓN: CONTACTOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#080E21]">Personal de Contacto</h2>
          <button onClick={() => abrirModalContacto(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition">
            + Añadir Contacto
          </button>
        </div>

        {contactos.length === 0 ? (
          <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-dashed">No hay contactos registrados para este cliente.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactos.map(contacto => (
              <div key={contacto.id} className={`p-5 rounded-xl border relative group ${contacto.es_principal ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-200 hover:shadow-md'}`}>
                {contacto.es_principal && <span className="absolute top-0 right-4 -translate-y-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow-sm">Principal</span>}
                
                <h3 className="font-bold text-gray-800 text-lg">{contacto.nombre_contacto}</h3>
                <p className="text-sm text-gray-500 mb-3">{contacto.cargo || 'Cargo no especificado'}</p>
                
                <div className="space-y-1 mb-4">
                  <p className="text-sm font-medium text-gray-700">📞 {contacto.telefono}</p>
                  <p className="text-sm font-medium text-gray-700">✉️ {contacto.email}</p>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => abrirModalContacto(contacto)} className="text-xs font-bold text-blue-600 hover:text-blue-800">Editar</button>
                  <button onClick={() => handleEliminarContacto(contacto.id)} className="text-xs font-bold text-red-500 hover:text-red-700">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

{/* Modal Editar Cliente */}
      {isEditClienteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
             
             <div className="bg-[#080E21] p-4 flex justify-between items-center">
               <h2 className="text-white font-bold">Editar Información del Cliente</h2>
               <button type="button" onClick={() => setIsEditClienteOpen(false)} className="text-white text-xl leading-none">&times;</button>
             </div>

             <form onSubmit={handleGuardarCliente} className="p-6 grid grid-cols-1 gap-4">
               
               {/* Nombre */}
               <div>
                 <label className="text-xs font-bold text-gray-700 mb-1 block">Nombre / Razón Social *</label>
                 <input 
                   required 
                   value={clienteForm.nombre_completo || ''} 
                   onChange={e => setClienteForm({...clienteForm, nombre_completo: e.target.value})} 
                   className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 />
               </div>

               {/* Documento de Identidad (NIT/CI) */}
               <div>
                 <label className="text-xs font-bold text-gray-700 mb-1 block">NIT o CI *</label>
                 <input 
                   required 
                   value={clienteForm.documento_identidad || ''} 
                   onChange={e => setClienteForm({...clienteForm, documento_identidad: e.target.value})} 
                   className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 />
               </div>

               {/* Fila compartida: Teléfono y Correo */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-gray-700 mb-1 block">Teléfono Central</label>
                   <input 
                     value={clienteForm.telefono || ''} 
                     onChange={e => setClienteForm({...clienteForm, telefono: e.target.value})} 
                     className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-700 mb-1 block">Correo Electrónico</label>
                   <input 
                     type="email"
                     value={clienteForm.correo_electronico || ''} 
                     onChange={e => setClienteForm({...clienteForm, correo_electronico: e.target.value})} 
                     className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
               </div>

               {/* Dirección */}
               <div>
                 <label className="text-xs font-bold text-gray-700 mb-1 block">Dirección Física</label>
                 <input 
                   value={clienteForm.direccion || ''} 
                   onChange={e => setClienteForm({...clienteForm, direccion: e.target.value})} 
                   className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 />
               </div>

               {/* Botones */}
               <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                 <button 
                   type="button" 
                   onClick={() => setIsEditClienteOpen(false)} 
                   className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit" 
                   className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition"
                 >
                   Guardar Cambios
                 </button>
               </div>

             </form>
           </div>
        </div>
      )}

      {/* Modal Añadir/Editar Contacto */}
      {isContactoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
             <div className="bg-[#080E21] p-4 flex justify-between"><h2 className="text-white font-bold">{contactoForm.id ? 'Editar Contacto' : 'Nuevo Contacto'}</h2><button onClick={() => setIsContactoOpen(false)} className="text-white">&times;</button></div>
             <form onSubmit={handleGuardarContacto} className="p-6 grid grid-cols-1 gap-4">
               <div><label className="text-xs font-bold text-gray-700">Nombre Completo *</label><input required value={contactoForm.nombre_contacto} onChange={e => setContactoForm({...contactoForm, nombre_contacto: e.target.value})} className="w-full p-2 border rounded"/></div>
               <div><label className="text-xs font-bold text-gray-700">Cargo</label><input value={contactoForm.cargo} onChange={e => setContactoForm({...contactoForm, cargo: e.target.value})} className="w-full p-2 border rounded"/></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold text-gray-700">Teléfono</label><input value={contactoForm.telefono} onChange={e => setContactoForm({...contactoForm, telefono: e.target.value})} className="w-full p-2 border rounded"/></div>
                 <div><label className="text-xs font-bold text-gray-700">Email</label><input type="email" value={contactoForm.email} onChange={e => setContactoForm({...contactoForm, email: e.target.value})} className="w-full p-2 border rounded"/></div>
               </div>
               <label className="flex items-center gap-2 mt-2 cursor-pointer bg-gray-50 p-3 rounded border">
                 <input type="checkbox" checked={contactoForm.es_principal} onChange={e => setContactoForm({...contactoForm, es_principal: e.target.checked})} className="w-4 h-4 text-blue-600"/>
                 <span className="text-sm font-bold text-gray-700">Marcar como Contacto Principal</span>
               </label>
               <div className="flex justify-end gap-2 mt-4">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded">Guardar Contacto</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </main>
  );
};

export default DetalleCliente;