import React, { useState, useEffect, useCallback } from 'react';
import calendarioService from '../services/calendarioService';

const ESTADOS = {
  confirmado: { color: 'bg-green-500', texto: 'Confirmado', chip: 'bg-green-100 text-green-700' },
  pendiente: { color: 'bg-yellow-400', texto: 'Pendiente', chip: 'bg-yellow-100 text-yellow-700' },
  no_asiste: { color: 'bg-orange-500', texto: 'No asistirá', chip: 'bg-orange-100 text-orange-700' },
};

const ParticipantesEvento = ({ tipoEvento, eventoId, usuarioActualId, compacto = false }) => {
  const [participantes, setParticipantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const [modoNoAsiste, setModoNoAsiste] = useState(false);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    if (!eventoId) return;
    try {
      setCargando(true);
      const data = await calendarioService.obtenerParticipantes(tipoEvento, eventoId);
      setParticipantes(data?.participantes || []);
    } catch (e) {
      console.error('Error al cargar participantes:', e);
      setParticipantes([]);
    } finally {
      setCargando(false);
    }
  }, [tipoEvento, eventoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const responder = async (estado, coment) => {
    try {
      setRespondiendo(true);
      setError('');
      await calendarioService.responderAsistencia({
        tipo_evento: tipoEvento,
        evento_id: eventoId,
        estado_asistencia: estado,
        comentario: coment,
      });
      setModoNoAsiste(false);
      setComentario('');
      await cargar();
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudo registrar la asistencia.');
    } finally {
      setRespondiendo(false);
    }
  };

  const confirmarNoAsiste = () => {
    if (!comentario.trim()) {
      setError('El comentario es obligatorio para indicar que no asistirás.');
      return;
    }
    responder('no_asiste', comentario.trim());
  };

  const resumen = {
    confirmado: participantes.filter((p) => p.estado_asistencia === 'confirmado').length,
    pendiente: participantes.filter((p) => p.estado_asistencia === 'pendiente').length,
    no_asiste: participantes.filter((p) => p.estado_asistencia === 'no_asiste').length,
  };

  if (cargando && participantes.length === 0) {
    return <p className="text-[11px] text-gray-400 animate-pulse">Cargando participantes...</p>;
  }
  if (participantes.length === 0) {
    return <p className="text-[11px] text-gray-400">Sin participantes.</p>;
  }

  return (
    <div className={compacto ? '' : 'mt-3 border-t border-gray-100 pt-3'}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Participantes</span>
        <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
          <span className="text-green-700">● {resumen.confirmado} confirmados</span>
          <span className="text-yellow-700">● {resumen.pendiente} pendientes</span>
          <span className="text-orange-700">● {resumen.no_asiste} no asistirán</span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {participantes.map((p) => {
          const esYo = Number(p.usuario_id) === Number(usuarioActualId);
          const meta = ESTADOS[p.estado_asistencia] || ESTADOS.pendiente;
          return (
            <li key={p.usuario_id} className="text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.color}`} />
                <span className="font-semibold text-gray-700">
                  {p.nombre_completo}{esYo && <span className="text-gray-400 font-normal"> (tú)</span>}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${meta.chip}`}>{meta.texto}</span>

                {esYo && !modoNoAsiste && (
                  <span className="ml-auto flex gap-1">
                    {p.estado_asistencia !== 'confirmado' && (
                      <button
                        type="button"
                        disabled={respondiendo}
                        onClick={() => responder('confirmado')}
                        className="px-2 py-0.5 rounded bg-green-600 text-white text-[10px] font-bold disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                    )}
                    {p.estado_asistencia !== 'no_asiste' && (
                      <button
                        type="button"
                        disabled={respondiendo}
                        onClick={() => { setModoNoAsiste(true); setError(''); }}
                        className="px-2 py-0.5 rounded bg-orange-500 text-white text-[10px] font-bold disabled:opacity-50"
                      >
                        No asistiré
                      </button>
                    )}
                  </span>
                )}
              </div>

              {p.estado_asistencia === 'no_asiste' && p.comentario && (
                <p className="ml-4 mt-0.5 text-[11px] text-orange-700 italic">“{p.comentario}”</p>
              )}

              {esYo && modoNoAsiste && (
                <div className="ml-4 mt-1.5">
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Motivo por el que no asistirás (obligatorio)"
                    className="w-full p-2 border rounded text-[11px] resize-none h-16 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      disabled={respondiendo}
                      onClick={confirmarNoAsiste}
                      className="px-2 py-1 rounded bg-orange-500 text-white text-[10px] font-bold disabled:opacity-50"
                    >
                      Enviar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModoNoAsiste(false); setComentario(''); setError(''); }}
                      className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-[10px] font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
};

export default ParticipantesEvento;
