import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { eden } from '@/services/eden';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Visita {
  id: string;
  fecha_programada: string;
  status: 'PENDIENTE' | 'REALIZADA' | 'CANCELADA';
  mensaje_visitante: string | null;
  created_at: string;
  propiedad: {
    id: string;
    direccion: string;
  };
  cliente: {
    id: string;
    nombre: string;
    celular: string;
    email: string;
  };
}

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchVisitas = async () => {
    try {
      const res = await eden.v1.visitas.admin.get();
      if (res.data) {
        setVisitas(res.data as any);
      }
    } catch (error) {
      toast.error('Error al cargar visitas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitas();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'REALIZADA' | 'CANCELADA') => {
    setUpdatingId(id);
    try {
      const res = await eden.v1.visitas({ id }).status.patch({ status: newStatus });
      if (!res.error) {
        toast.success(newStatus === 'REALIZADA' ? '¡Visita marcada como realizada!' : 'Visita cancelada');
        fetchVisitas();
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-renta-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse uppercase tracking-widest">Cargando Agenda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-jakarta font-bold text-renta-950 tracking-tight">Agenda de Visitas</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona los encuentros con tus potenciales clientes.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <Calendar className="w-4 h-4 text-renta-500" />
          <span className="text-xs font-bold text-renta-900">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </header>

      {visitas.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-[32px] p-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-jakarta font-bold text-renta-900">Sin visitas agendadas</h3>
          <p className="text-slate-500 text-sm mt-2">Cuando un cliente agende una visita desde la landing, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {visitas.map((visita) => (
            <div 
              key={visita.id}
              className={cn(
                "group bg-white rounded-[32px] border transition-all duration-300 hover:shadow-xl hover:shadow-renta-900/5",
                visita.status === 'REALIZADA' ? 'border-emerald-100 bg-emerald-50/10' : 
                visita.status === 'CANCELADA' ? 'border-slate-100 opacity-60' : 'border-slate-100'
              )}
            >
              <div className="p-8">
                {/* Header Card */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      visita.status === 'PENDIENTE' ? 'bg-renta-50 text-renta-600' :
                      visita.status === 'REALIZADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    )}>
                      {visita.status === 'PENDIENTE' ? <Clock className="w-6 h-6" /> :
                       visita.status === 'REALIZADA' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                        visita.status === 'PENDIENTE' ? 'bg-renta-100 text-renta-700' :
                        visita.status === 'REALIZADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      )}>
                        {visita.status}
                      </span>
                      <h3 className="text-lg font-jakarta font-bold text-renta-950 mt-1">
                        {new Date(visita.fecha_programada).toLocaleDateString()} — {new Date(visita.fecha_programada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                      </h3>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-300" />
                  </button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Interesado</span>
                        <span className="text-sm font-jakarta font-bold text-renta-900">{visita.cliente.nombre}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Contacto</span>
                        <span className="text-sm font-jakarta font-bold text-renta-900">{visita.cliente.celular}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Propiedad</span>
                        <span className="text-sm font-jakarta font-bold text-renta-900 truncate max-w-[200px]">{visita.propiedad.direccion}</span>
                      </div>
                    </div>
                    {visita.mensaje_visitante && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Nota del cliente</span>
                          <p className="text-xs text-slate-600 leading-relaxed italic">"{visita.mensaje_visitante}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {visita.status === 'PENDIENTE' && (
                  <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                    <button 
                      onClick={() => handleUpdateStatus(visita.id, 'REALIZADA')}
                      disabled={updatingId === visita.id}
                      className="flex-1 bg-renta-950 text-white font-jakarta font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-renta-800 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {updatingId === visita.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Marcar como Realizada
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(visita.id, 'CANCELADA')}
                      disabled={updatingId === visita.id}
                      className="px-6 py-3.5 border border-slate-200 text-slate-600 font-jakarta font-bold rounded-2xl hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
