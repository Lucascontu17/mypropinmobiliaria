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
import { useEden } from '@/services/eden';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [activeTab, setActiveTab] = useState<'SOLICITUDES' | 'AGENDADAS' | 'HISTORIAL'>('SOLICITUDES');
  const { client: eden, isReady } = useEden();

  const fetchVisitas = async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const { data, error } = await eden.admin.visitas.get();
      if (error) {
        console.error('[VISITAS] Error fetching:', error);
      } else {
        // @ts-ignore
        setVisitas(data?.visitas ?? []);
      }
    } catch (err) {
      console.error('[VISITAS] Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitas();
  }, [eden, isReady]);

  const handleUpdateStatus = async (id: string, newStatus: string, newDate?: string) => {
    setUpdatingId(id);
    // TODO: Implementar patch real en el backend si existe
    toast.info('Actualización enviada (Backend sync pendiente)');
    setUpdatingId(null);
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

  const tabs = [
    { id: 'SOLICITUDES', label: 'Solicitudes', count: solicitudes.length, icon: Clock, color: 'amber' },
    { id: 'AGENDADAS', label: 'Agenda Confirmada', count: agendadas.length, icon: Calendar, color: 'emerald' },
    { id: 'HISTORIAL', label: 'Historial', count: historico.length, icon: CheckCircle2, color: 'slate' },
  ] as const;

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-jakarta font-extrabold text-renta-950 tracking-tight">Gestión de Visitas</h1>
          <p className="text-slate-500 text-base mt-1">Administra tus encuentros y solicitudes desde un solo lugar.</p>
        </div>
        
        {/* Luxury Tab Switcher */}
        <div className="bg-slate-100/50 p-1.5 rounded-[22px] flex items-center gap-1 border border-slate-200/60 backdrop-blur-sm self-start md:self-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2.5 px-5 py-2.5 rounded-[18px] text-sm font-bold transition-all duration-300",
                  isActive 
                    ? "bg-white text-renta-950 shadow-sm shadow-renta-900/5 border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? `text-${tab.color}-600` : "text-slate-400"
                )} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter transition-colors",
                    isActive ? `bg-${tab.color}-100 text-${tab.color}-700` : "bg-slate-200 text-slate-500"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── CONTENIDO DINÁMICO SEGÚN TAB ── */}
      <div className="min-h-[400px]">
        {activeTab === 'SOLICITUDES' && (
          <section className="space-y-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-jakarta font-bold text-renta-950">Solicitudes por Confirmar</h2>
            </div>

            {solicitudes.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-[32px] p-20 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-slate-200" />
                </div>
                <h3 className="text-lg font-jakarta font-bold text-renta-900">Bandeja de entrada vacía</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">No hay solicitudes pendientes de confirmación en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {solicitudes?.map((visita) => (
                  <VisitaCard 
                    key={visita?.id} 
                    visita={visita} 
                    onUpdate={handleUpdateStatus}
                    updatingId={updatingId}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'AGENDADAS' && (
          <section className="space-y-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-jakarta font-bold text-renta-950">Agenda Confirmada</h2>
            </div>

            {agendadas.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-[32px] p-20 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-slate-200" />
                </div>
                <h3 className="text-lg font-jakarta font-bold text-renta-900">Sin visitas programadas</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Coordiná tus solicitudes pendientes para que aparezcan en tu agenda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {agendadas?.map((visita) => (
                  <VisitaCard 
                    key={visita?.id} 
                    visita={visita} 
                    onUpdate={handleUpdateStatus}
                    updatingId={updatingId}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'HISTORIAL' && (
          <section className="space-y-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-jakarta font-bold text-renta-950">Historial de Visitas</h2>
            </div>

            {historico.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-[32px] p-20 text-center shadow-sm">
                <p className="text-slate-400 text-sm font-medium">Aún no hay visitas en el historial.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {historico?.map(v => (
                   <div key={v?.id} className="bg-white border border-slate-100 p-6 rounded-[24px] flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[10px] font-black px-3 py-1 rounded-full",
                          v?.status === 'REALIZADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        )}>
                          {v?.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(v?.fecha_programada || '').toLocaleDateString()}</span>
                     </div>
                     <div>
                       <h4 className="font-bold text-renta-950 text-sm">{v?.cliente?.nombre}</h4>
                       <p className="text-xs text-slate-500 truncate mt-0.5">{v?.propiedad?.direccion}</p>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ── COMPONENTE AUXILIAR PARA LA CARD ──
function VisitaCard({ visita, onUpdate, updatingId }: { visita: Visita, onUpdate: any, updatingId: string | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newDate, setNewDate] = useState(visita?.fecha_programada?.split('.')[0] || ''); 

  const handleConfirmReschedule = () => {
    onUpdate(visita?.id, 'PROGRAMADA', newDate);
    setIsEditing(false);
  };

  return (
    <div className={cn(
      "group bg-white rounded-[32px] border transition-all duration-300 hover:shadow-xl hover:shadow-renta-900/5",
      visita?.status === 'PROGRAMADA' ? 'border-emerald-100 shadow-sm' : 'border-slate-100 shadow-sm',
      isEditing && "ring-2 ring-renta-500 border-transparent"
    )}>
      <div className="p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
              visita?.status === 'PENDIENTE' ? 'bg-amber-50 text-amber-600' :
              visita?.status === 'PROGRAMADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
            )}>
              {visita?.status === 'PENDIENTE' ? <Clock className="w-6 h-6" /> :
               visita?.status === 'PROGRAMADA' ? <Calendar className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                visita?.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                visita?.status === 'PROGRAMADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              )}>
                {visita?.status === 'PENDIENTE' ? 'POR CONFIRMAR' : visita?.status}
              </span>
              
              {!isEditing ? (
                <h3 className="text-lg font-jakarta font-bold text-renta-950 mt-1">
                  {new Date(visita?.fecha_programada || '').toLocaleDateString()} — {new Date(visita?.fecha_programada || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                </h3>
              ) : (
                <div className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px] text-renta-600 font-bold uppercase tracking-widest">Nuevo Horario Acordado</span>
                  <input 
                    type="datetime-local" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="text-sm font-bold text-renta-950 bg-renta-50 border-none rounded-lg p-1 focus:ring-0"
                  />
                </div>
              )}
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
                <span className="text-sm font-jakarta font-bold text-renta-900">{visita?.cliente?.nombre}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Contacto</span>
                <span className="text-sm font-jakarta font-bold text-renta-900">{visita?.cliente?.celular}</span>
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
                <span className="text-sm font-jakarta font-bold text-renta-900 truncate max-w-[200px]">{visita?.propiedad?.direccion}</span>
              </div>
            </div>
            {visita?.mensaje_visitante && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Nota del cliente</span>
                  <p className="text-xs text-slate-600 leading-relaxed italic">"{visita?.mensaje_visitante}"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
          {visita?.status === 'PENDIENTE' && (
            <>
              {!isEditing ? (
                <>
                  <button 
                    onClick={() => onUpdate(visita?.id, 'PROGRAMADA')}
                    disabled={updatingId === visita?.id}
                    className="flex-1 bg-renta-950 text-white font-jakarta font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-renta-800 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {updatingId === visita?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    Confirmar Visita
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    disabled={updatingId === visita?.id}
                    className="px-6 py-3.5 border border-slate-200 text-slate-600 font-jakarta font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Reprogramar
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleConfirmReschedule}
                    className="flex-1 bg-renta-600 text-white font-jakarta font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-renta-700 transition-all active:scale-[0.98]"
                  >
                    Guardar y Confirmar
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3.5 text-slate-400 font-jakarta font-bold hover:text-slate-600"
                  >
                    Cancelar
                  </button>
                </>
              )}
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

