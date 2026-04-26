import React from 'react';
import { EmptyState } from '../ui/ComponentesGenerales';

const TabHistorial = ({ historial }) => {

  if (!historial || !historial.historial || historial.historial.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <EmptyState icon="⏳" title="Sin historial" description="Aún no se han registrado eventos en este expediente." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h3 className="text-lg font-bold text-[#080E21]">Línea de Tiempo del Caso</h3>
          <p className="text-sm text-gray-500">Trazabilidad completa de estados y acciones en este expediente</p>
        </div>
        <div className="text-sm font-semibold text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border">
          Total de eventos: <span className="text-[#080E21]">{historial.total_eventos}</span>
        </div>
      </div>

      <div className="relative pt-4 pb-12">
        {/* LÍNEA VERTICAL CENTRAL CONTINUA */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2 z-0"></div>

        {historial.historial.map((grupoFecha, grupoIndex) => (
          <div key={grupoIndex} className="mb-12">
            
            {/* Etiqueta de la Fecha Centrada */}
            <div className="flex justify-center mb-8 relative z-10">
              <span className="bg-[#080E21] text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-md">
                {grupoFecha.fecha_etiqueta}
              </span>
            </div>

            <div className="space-y-8">
              {grupoFecha.eventos.map((evento, index) => {
                const esIzquierda = index % 2 === 0;

                // DICCIONARIO DE ESTILOS (El que ya tenías)
                const estilosEventos = {
                  'Carga de Documento': { bg: 'bg-blue-100', text: 'text-blue-600', emoji: '📁' },
                  'carga_doc': { bg: 'bg-blue-100', text: 'text-blue-600', emoji: '📁' },
                  'Modificación de Documento': { bg: 'bg-yellow-100', text: 'text-yellow-600', emoji: '✏️' },
                  'modificacion_doc': { bg: 'bg-yellow-100', text: 'text-yellow-600', emoji: '✏️' },
                  'Eliminación de Documento': { bg: 'bg-red-100', text: 'text-red-500', emoji: '🗑️' },
                  'eliminacion_doc': { bg: 'bg-red-100', text: 'text-red-500', emoji: '🗑️' },
                  'Solicitud de Revisión': { bg: 'bg-orange-100', text: 'text-orange-600', emoji: '👀' },
                  'solicitud_revision': { bg: 'bg-orange-100', text: 'text-orange-600', emoji: '👀' },
                  'Revisión Completada': { bg: 'bg-green-100', text: 'text-green-600', emoji: '✅' },
                  'revision_completada': { bg: 'bg-green-100', text: 'text-green-600', emoji: '✅' },
                  'Apertura de Expediente': { bg: 'bg-purple-100', text: 'text-purple-600', emoji: '🏛️' },
                  'creacion': { bg: 'bg-purple-100', text: 'text-purple-600', emoji: '🏛️' },
                  'Generación de Carátula': { bg: 'bg-slate-100', text: 'text-slate-600', emoji: '📄' },
                  'caratula': { bg: 'bg-slate-100', text: 'text-slate-600', emoji: '📄' },
                  'Cambio de Estado del Caso': { bg: 'bg-indigo-100', text: 'text-indigo-600', emoji: '🔄' },
                  'cambio_estado': { bg: 'bg-indigo-100', text: 'text-indigo-600', emoji: '🔄' },
                  'Modificación de Equipo Legal': { bg: 'bg-teal-100', text: 'text-teal-600', emoji: '👥' },
                  'modificacion_equipo': { bg: 'bg-teal-100', text: 'text-teal-600', emoji: '👥' }
                };

                const estiloActual = estilosEventos[evento.titulo] || estilosEventos[evento.tipo] || { bg: 'bg-gray-100', text: 'text-gray-600', emoji: '📌' };
                const { bg: iconBg, text: iconText, emoji: iconEmoji } = estiloActual;

                return (
                  <div key={evento.id || index} className="relative flex items-center justify-center w-full">
                    {/* Icono del Evento (Centro) */}
                    <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-sm border-2 border-white ${iconBg} ${iconText}`}>
                      <span className="text-lg">{iconEmoji}</span>
                    </div>

                    {/* Tarjeta del Evento */}
                    <div className={`w-full flex ${esIzquierda ? 'justify-start' : 'justify-end'}`}>
                      <div className={`w-[calc(50%-2.5rem)] ${esIzquierda ? 'pr-2' : 'pl-2'}`}>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm transition hover:shadow-md hover:border-gray-300 relative group">
                          
                          <p className="absolute top-5 right-5 text-xs text-gray-400 font-bold">{evento.hora}</p>
                          <h4 className="text-sm font-bold text-[#080E21] mb-1.5 pr-16">{evento.titulo}</h4>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{evento.descripcion}</p>
                          
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              <img src={evento.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 truncate">{evento.autor}</span>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabHistorial;