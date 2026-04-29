import { X, Calendar, User, Home, AlertTriangle, MessageSquare, Loader2, TrendingUp, ShieldCheck, Key, Clock, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Contrato {
  id: string;
  propiedad: string;
  propietario: string;
  inquilino: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio: number;
  estado: string;
  reglas_aumento?: {
    aplicar_aumento: boolean;
    tipo_aumento?: string;
    periodicidad?: string;
    porcentaje?: number;
  };
  reglas_mora?: {
    aplicar_mora: boolean;
    periodicidad?: string;
    porcentaje?: number;
    dias_gracia?: number;
  };
}

interface ContratoDetailsModalProps {
  contrato: Contrato;
  onClose: () => void;
  onFinalizar: (contratoId: string) => Promise<void>;
  onReunion: (contratoId: string) => Promise<void>;
}

export function ContratoDetailsModal({ contrato, onClose, onFinalizar, onReunion }: ContratoDetailsModalProps) {
  const [isFinishing, setIsFinishing] = useState(false);
  const [isMeeting, setIsMeeting] = useState(false);

  const handleFinalizar = async () => {
    if (!window.confirm('¿Está seguro que desea finalizar anticipadamente este contrato? Esta acción es irreversible.')) return;
    setIsFinishing(true);
    try {
      await onFinalizar(contrato.id);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleReunion = async () => {
    setIsMeeting(true);
    try {
      await onReunion(contrato.id);
    } finally {
      setIsMeeting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-renta-950/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="bg-renta-50 px-6 py-5 border-b border-admin-border-subtle flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold font-jakarta text-renta-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-renta-600" />
              Detalles del Contrato
            </h2>
            <p className="text-[10px] font-bold text-renta-400 uppercase tracking-widest mt-0.5">Vigencia y Reglas Financieras</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-renta-400 hover:text-renta-600 hover:bg-renta-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Top Status & Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-renta-50/50 p-4 rounded-2xl border border-admin-border-subtle flex flex-col justify-center">
              <span className="text-[10px] font-bold text-renta-400 uppercase tracking-widest mb-1">Estado Actual</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold font-jakarta border w-fit",
                contrato.estado === 'ACTIVO' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-renta-100 text-renta-600 border-renta-200"
              )}>
                {contrato.estado}
              </span>
            </div>
            <div className="bg-renta-50/50 p-4 rounded-2xl border border-admin-border-subtle flex flex-col justify-center">
              <span className="text-[10px] font-bold text-renta-400 uppercase tracking-widest mb-1">Valor del Alquiler</span>
              <span className="text-lg font-black text-renta-950 font-jakarta">
                ${contrato.precio.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Vínculos Principales */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-renta-900 uppercase tracking-widest flex items-center gap-2 border-b border-admin-border-subtle pb-2">
                <Home className="w-3.5 h-3.5" /> Actores y Propiedad
             </h3>
             <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-white border border-admin-border rounded-2xl shadow-sm">
                   <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Home className="w-4 h-4" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-bold text-renta-400 uppercase tracking-tighter">Propiedad Alquilada</p>
                      <p className="text-sm font-bold text-renta-950 truncate">{contrato.propiedad}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="flex items-center gap-3 p-3 bg-white border border-admin-border rounded-2xl shadow-sm">
                      <div className="h-9 w-9 rounded-xl bg-renta-50 flex items-center justify-center text-renta-600 shrink-0">
                         <Key className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-bold text-renta-400 uppercase tracking-tighter">Propietario</p>
                         <p className="text-sm font-bold text-renta-950 truncate">{contrato.propietario}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-white border border-admin-border rounded-2xl shadow-sm">
                      <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                         <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-bold text-renta-400 uppercase tracking-tighter">Locatario (Inquilino)</p>
                         <p className="text-sm font-bold text-renta-950 truncate">{contrato.inquilino}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Fechas y Vigencia */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-renta-900 uppercase tracking-widest flex items-center gap-2 border-b border-admin-border-subtle pb-2">
                <Calendar className="w-3.5 h-3.5" /> Ciclo de Vida
             </h3>
             <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center">
                   <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Inicio</span>
                   <span className="text-sm font-bold text-slate-700">{contrato.fecha_inicio}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center">
                   <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Finalización</span>
                   <span className="text-sm font-bold text-slate-700">{contrato.fecha_fin}</span>
                </div>
             </div>
          </div>

          {/* Reglas Financieras */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-renta-900 uppercase tracking-widest flex items-center gap-2 border-b border-admin-border-subtle pb-2">
                <TrendingUp className="w-3.5 h-3.5" /> Motor de Rentabilidad
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Aumentos */}
                <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-2">
                   <div className="flex items-center gap-2 text-emerald-700">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Aumentos</span>
                   </div>
                   {contrato.reglas_aumento?.aplicar_aumento ? (
                     <div className="space-y-1">
                        <p className="text-[11px] text-emerald-800 font-medium">
                           Tipo: <span className="font-bold">{contrato.reglas_aumento.tipo_aumento?.replace(/_/g, ' ')}</span>
                        </p>
                        <p className="text-[11px] text-emerald-800 font-medium">
                           Cada: <span className="font-bold">{contrato.reglas_aumento.periodicidad}</span>
                        </p>
                        {contrato.reglas_aumento.porcentaje && (
                           <p className="text-[11px] text-emerald-800 font-medium">
                              Tasa: <span className="font-bold">{contrato.reglas_aumento.porcentaje}%</span>
                           </p>
                        )}
                     </div>
                   ) : (
                     <p className="text-[10px] text-emerald-600 font-medium italic">Sin aumentos configurados</p>
                   )}
                </div>

                {/* Mora */}
                <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30 space-y-2">
                   <div className="flex items-center gap-2 text-amber-700">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Interés Moroso</span>
                   </div>
                   {contrato.reglas_mora?.aplicar_mora ? (
                     <div className="space-y-1">
                        <p className="text-[11px] text-amber-800 font-medium">
                           Mora: <span className="font-bold">{contrato.reglas_mora.porcentaje}% {contrato.reglas_mora.periodicidad}</span>
                        </p>
                        <p className="text-[11px] text-amber-800 font-medium">
                           Gracia: <span className="font-bold">{contrato.reglas_mora.dias_gracia} días</span>
                        </p>
                     </div>
                   ) : (
                     <p className="text-[10px] text-amber-600 font-medium italic">Sin intereses morosos</p>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-admin-surface p-6 border-t border-admin-border-subtle space-y-3 shrink-0">
          <button 
            onClick={handleReunion}
            disabled={isMeeting || contrato.estado !== 'ACTIVO'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-renta-600 text-white rounded-xl font-bold font-jakarta shadow-lg shadow-renta-600/20 hover:bg-renta-700 transition disabled:opacity-50 disabled:shadow-none"
          >
            {isMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Solicitar Reunión en Inmobiliaria
          </button>

          <button 
            onClick={handleFinalizar}
            disabled={isFinishing || contrato.estado !== 'ACTIVO'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold font-jakarta border border-red-200 hover:bg-red-100 transition disabled:opacity-50"
          >
            {isFinishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Finalizar Anticipadamente
          </button>
        </div>
      </div>
    </div>
  );
}
