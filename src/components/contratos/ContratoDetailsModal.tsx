import { X, Calendar, User, Home, AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Contrato {
  id: string;
  propiedad: string;
  inquilino: string;
  fecha_inicio: string;
  precio: number;
  estado: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-renta-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-renta-50 px-6 py-5 border-b border-admin-border-subtle flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold font-jakarta text-renta-950 flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-renta-400" />
              Detalles del Contrato
            </h2>
            <p className="text-xs text-renta-500 font-inter mt-0.5">Vista de solo lectura</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-renta-400 hover:text-renta-600 hover:bg-renta-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Status Badge */}
          <div className="flex justify-between items-center bg-renta-50/50 p-4 rounded-2xl border border-admin-border-subtle">
            <span className="text-sm font-semibold text-renta-700">Estado del Contrato</span>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold font-jakarta border",
              contrato.estado === 'ACTIVO' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-renta-100 text-renta-600 border-renta-200"
            )}>
              {contrato.estado}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-renta-400 mb-1">
                <Home className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Propiedad</span>
              </div>
              <p className="text-sm font-medium text-renta-900 bg-admin-surface px-3 py-2 rounded-xl border border-admin-border-subtle">
                {contrato.propiedad}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-renta-400 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Inquilino</span>
              </div>
              <p className="text-sm font-medium text-renta-900 bg-admin-surface px-3 py-2 rounded-xl border border-admin-border-subtle">
                {contrato.inquilino}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-renta-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Fecha de Inicio</span>
              </div>
              <p className="text-sm font-medium text-renta-900 bg-admin-surface px-3 py-2 rounded-xl border border-admin-border-subtle">
                {contrato.fecha_inicio}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-renta-400 mb-1">
                <FileTextIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Valor Actual</span>
              </div>
              <p className="text-sm font-medium text-renta-900 bg-admin-surface px-3 py-2 rounded-xl border border-admin-border-subtle">
                ${contrato.precio.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-admin-surface p-6 border-t border-admin-border-subtle space-y-3">
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

function FileTextIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}
