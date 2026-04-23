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

// --- MOCK DATA PARA DESARROLLO / STAGING ---
const MOCK_VISITAS: Visita[] = [
  {
    id: 'mock-1',
    fecha_programada: new Date(Date.now() + 86400000).toISOString(), // Mañana
    status: 'PENDIENTE',
    mensaje_visitante: 'Me interesa ver el estado de la cocina y el balcón. ¿Es apto crédito?',
    created_at: new Date().toISOString(),
    propiedad: { id: 'p1', direccion: 'Av. Callao 1234, 4to B, CABA' },
    cliente: { id: 'c1', nombre: 'Juan Ignacio Pérez', celular: '+54 11 4455-6677', email: 'juan.perez@example.com' }
  },
  {
    id: 'mock-2',
    fecha_programada: new Date(Date.now() + 172800000).toISOString(), // En 2 días
    status: 'PENDIENTE',
    mensaje_visitante: 'Solicito visita por la tarde si es posible.',
    created_at: new Date().toISOString(),
    propiedad: { id: 'p2', direccion: 'GÃ¼emes 2100, Mar del Plata' },
    cliente: { id: 'c2', nombre: 'LucÃ­a FernÃ¡ndez', celular: '+54 223 556-7788', email: 'lucia.f@example.com' }
  },
  {
    id: 'mock-3',
    fecha_programada: new Date(Date.now() + 43200000).toISOString(), // En 12 horas
    status: 'PROGRAMADA',
    mensaje_visitante: null,
    created_at: new Date().toISOString(),
    propiedad: { id: 'p3', direccion: 'San Salvador 332, Corrientes' },
    cliente: { id: 'c3', nombre: 'Roberto Thompson', celular: '+54 379 455-1122', email: 'r.thompson@example.com' }
  },
  {
    id: 'mock-4',
    fecha_programada: new Date(Date.now() - 86400000).toISOString(), // Ayer
    status: 'REALIZADA',
    mensaje_visitante: 'Muy interesado.',
    created_at: new Date().toISOString(),
    propiedad: { id: 'p1', direccion: 'Av. Callao 1234, 4to B, CABA' },
    cliente: { id: 'c4', nombre: 'MarÃ­a GarcÃ­a', celular: '+54 11 9988-7766', email: 'm.garcia@example.com' }
  }
];

interface Visita {
  id: string;
  fecha_programada: string;
  status: 'PENDIENTE' | 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA';
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
    // Detección de entorno para usar Mock Data en DEV/STAGING
    const isDemo = window.location.hostname.includes('staging') || window.location.hostname.includes('localhost');
    
    if (isDemo) {
      console.log('[Visitas] Modo Demo Activo: Cargando Mocks');
      // Simulamos un delay de red
      setTimeout(() => {
        const stored = localStorage.getItem('mock_visitas');
        if (stored) {
          setVisitas(JSON.parse(stored));
        } else {
          setVisitas(MOCK_VISITAS);
          localStorage.setItem('mock_visitas', JSON.stringify(MOCK_VISITAS));
        }
        setLoading(false);
      }, 800);
      return;
    }

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

  const handleUpdateStatus = async (id: string, newStatus: 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA') => {
    setUpdatingId(id);

    // Lógica para modo Demo (Mock)
    const isDemo = window.location.hostname.includes('staging') || window.location.hostname.includes('localhost');
    if (isDemo) {
      setTimeout(() => {
        const updatedVisitas = visitas.map(v => v.id === id ? { ...v, status: newStatus } : v);
        setVisitas(updatedVisitas as any);
        localStorage.setItem('mock_visitas', JSON.stringify(updatedVisitas));
        
        let msg = 'Estado actualizado';
        if (newStatus === 'PROGRAMADA') msg = '¡Visita agendada correctamente!';
        if (newStatus === 'REALIZADA') msg = '¡Visita marcada como realizada!';
        if (newStatus === 'CANCELADA') msg = 'Visita cancelada';
        toast.success(msg);
        setUpdatingId(null);
      }, 500);
      return;
    }

    try {
      const res = await eden.v1.visitas({ id }).status.patch({ status: newStatus });
      if (!res.error) {
        let msg = 'Estado actualizado';
        if (newStatus === 'PROGRAMADA') msg = '¡Visita agendada correctamente!';
        if (newStatus === 'REALIZADA') msg = '¡Visita marcada como realizada!';
        if (newStatus === 'CANCELADA') msg = 'Visita cancelada';
        
        toast.success(msg);
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

  const solicitudes = visitas.filter(v => v.status === 'PENDIENTE');
  const agendadas = visitas.filter(v => v.status === 'PROGRAMADA');
  const historico = visitas.filter(v => v.status === 'REALIZADA' || v.status === 'CANCELADA');

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-jakarta font-extrabold text-renta-950 tracking-tight">Gestión de Visitas</h1>
          <p className="text-slate-500 text-base mt-1">Coordina y confirma los encuentros con tus clientes.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <Calendar className="w-5 h-5 text-renta-500" />
          <span className="text-sm font-bold text-renta-900">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </header>

      {/* ── SECCIÓN 1: SOLICITUDES PENDIENTES ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-xl font-jakarta font-bold text-renta-950">Solicitudes por Confirmar</h2>
          <span className="bg-amber-100 text-amber-700 text-xs font-black px-2 py-0.5 rounded-full">
            {solicitudes.length}
          </span>
        </div>

        {solicitudes.length === 0 ? (
          <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px] p-12 text-center">
            <p className="text-slate-400 text-sm font-medium">No hay nuevas solicitudes de visita desde la landing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {solicitudes.map((visita) => (
              <VisitaCard 
                key={visita.id} 
                visita={visita} 
                onUpdate={handleUpdateStatus}
                updatingId={updatingId}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── SECCIÓN 2: AGENDA CONFIRMADA ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-xl font-jakarta font-bold text-renta-950">Agenda Confirmada</h2>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-full">
            {agendadas.length}
          </span>
        </div>

        {agendadas.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-[32px] p-12 text-center">
            <p className="text-slate-400 text-sm font-medium">No tenés visitas programadas para los próximos días.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {agendadas.map((visita) => (
              <VisitaCard 
                key={visita.id} 
                visita={visita} 
                onUpdate={handleUpdateStatus}
                updatingId={updatingId}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── SECCIÓN 3: HISTORIAL (Opcional, más compacto) ── */}
      {historico.length > 0 && (
        <section className="space-y-6 opacity-60">
           <div className="flex items-center gap-3">
            <h2 className="text-lg font-jakarta font-bold text-slate-500">Historial Reciente</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {historico.slice(0, 6).map(v => (
               <div key={v.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-slate-700">{v.cliente.nombre}</span>
                   <span className="text-[10px] text-slate-400">{new Date(v.fecha_programada).toLocaleDateString()}</span>
                 </div>
                 <span className={cn(
                   "text-[10px] font-bold px-2 py-0.5 rounded-full",
                   v.status === 'REALIZADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                 )}>
                   {v.status}
                 </span>
               </div>
             ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── COMPONENTE AUXILIAR PARA LA CARD ──
function VisitaCard({ visita, onUpdate, updatingId }: { visita: Visita, onUpdate: any, updatingId: string | null }) {
  return (
    <div className={cn(
      "group bg-white rounded-[32px] border transition-all duration-300 hover:shadow-xl hover:shadow-renta-900/5",
      visita.status === 'PROGRAMADA' ? 'border-emerald-100 shadow-sm' : 'border-slate-100 shadow-sm'
    )}>
      <div className="p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
              visita.status === 'PENDIENTE' ? 'bg-amber-50 text-amber-600' :
              visita.status === 'PROGRAMADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
            )}>
              {visita.status === 'PENDIENTE' ? <Clock className="w-6 h-6" /> :
               visita.status === 'PROGRAMADA' ? <Calendar className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                visita.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                visita.status === 'PROGRAMADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              )}>
                {visita.status === 'PENDIENTE' ? 'POR CONFIRMAR' : visita.status}
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

        <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
          {visita.status === 'PENDIENTE' && (
            <>
              <button 
                onClick={() => onUpdate(visita.id, 'PROGRAMADA')}
                disabled={updatingId === visita.id}
                className="flex-1 bg-renta-950 text-white font-jakarta font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-renta-800 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {updatingId === visita.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Confirmar Visita
              </button>
              <button 
                onClick={() => onUpdate(visita.id, 'CANCELADA')}
                disabled={updatingId === visita.id}
                className="px-6 py-3.5 border border-slate-200 text-slate-600 font-jakarta font-bold rounded-2xl hover:bg-slate-50 transition-all"
              >
                Rechazar
              </button>
            </>
          )}
          {visita.status === 'PROGRAMADA' && (
            <>
              <button 
                onClick={() => onUpdate(visita.id, 'REALIZADA')}
                disabled={updatingId === visita.id}
                className="flex-1 bg-emerald-600 text-white font-jakarta font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {updatingId === visita.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Marcar como Realizada
              </button>
              <button 
                onClick={() => onUpdate(visita.id, 'CANCELADA')}
                disabled={updatingId === visita.id}
                className="px-6 py-3.5 border border-slate-200 text-slate-600 font-jakarta font-bold rounded-2xl hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
