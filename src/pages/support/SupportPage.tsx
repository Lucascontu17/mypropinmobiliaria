import { useState, useEffect, useCallback } from 'react';
import { useRegion } from '@/hooks/useRegion';
import { useApi } from '@/hooks/useApi';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { 
  LifeBuoy, 
  Plus, 
  Send, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TicketMessage {
  id: string;
  sender_role: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: 'pendiente' | 'en_curso' | 'cerrado';
  priority: 'baja' | 'media' | 'alta';
  current_level: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  messages?: TicketMessage[];
}

export function SupportPage() {
  const { t } = useRegion();
  const { apiFetch } = useApi();
  const { nombre } = useInmobiliaria();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reply, setReply] = useState('');

  // Form State
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Consulta Técnica',
    priority: 'media',
    description: ''
  });

  const fetchTickets = useCallback(async () => {
    try {
      const res = await apiFetch('/soporte/tickets');
      if (res.success) setTickets(res.data);
    } catch (err) {
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      const res = await apiFetch(`/soporte/tickets/${ticketId}/messages`);
      if (res.success) setMessages(res.data);
    } catch (err) {
      toast.error('Error al cargar conversación');
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/soporte/tickets', {
        method: 'POST',
        body: JSON.stringify(newTicket)
      });
      if (res.success) {
        toast.success('Ticket enviado con éxito');
        setIsModalOpen(false);
        setNewTicket({ subject: '', category: 'Consulta Técnica', priority: 'media', description: '' });
        fetchTickets();
      }
    } catch (err) {
      toast.error('No se pudo crear el ticket');
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    try {
      const res = await apiFetch(`/soporte/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: reply.trim() })
      });
      if (res.success) {
        setReply('');
        fetchMessages(selectedTicket.id);
        fetchTickets(); // Update list (updated_at)
      }
    } catch (err) {
      toast.error('Error al enviar mensaje');
    }
  };

  const selectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-renta-900 flex items-center gap-3">
            <LifeBuoy className="h-8 w-8 text-renta-500" />
            {t('support_titulo', 'Centro de Soporte')}
          </h1>
          <p className="text-renta-500 mt-1 max-w-2xl font-jakarta">
            {t('support_subtitulo', 'Gestioná tus incidencias y consultas técnicas.')}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-renta-600 text-white rounded-xl font-bold shadow-lg shadow-renta-600/20 hover:bg-renta-700 transition"
        >
          <Plus className="h-5 w-5" />
          {t('support_nuevo_ticket', 'Nuevo Ticket')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Tickets List */}
        <div className={cn(
          "lg:col-span-4 space-y-4",
          selectedTicket ? "hidden lg:block" : "block"
        )}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-renta-400 px-1">
            {t('support_lista_pendientes', 'Tickets Activos')}
          </h3>
          
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-renta-300">Cargando...</div>
            ) : tickets.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-renta-100 rounded-3xl text-center text-renta-300">
                {t('support_vacio', 'Sin tickets aún')}
              </div>
            ) : (
              tickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all duration-200",
                    selectedTicket?.id === ticket.id 
                      ? "bg-white border-renta-200 shadow-xl shadow-renta-900/5 ring-1 ring-renta-100" 
                      : "bg-renta-50/50 border-transparent hover:bg-renta-50"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-[10px] uppercase tracking-tighter font-bold px-2 py-0.5 rounded-full",
                      ticket.priority === 'alta' ? "bg-red-50 text-red-600" :
                      ticket.priority === 'media' ? "bg-amber-50 text-amber-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {t(`support_prioridad_${ticket.priority}`)}
                    </span>
                    <span className="text-[10px] text-renta-400 font-mono">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-renta-950 truncate mb-1">{ticket.subject}</h4>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ticket.status} t={t} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat / Detail View */}
        <div className={cn(
          "lg:col-span-8 bg-white border border-renta-100 rounded-3xl shadow-xl shadow-renta-900/5 flex flex-col min-h-[600px]",
          !selectedTicket ? "hidden lg:flex items-center justify-center opacity-40" : "flex"
        )}>
          {!selectedTicket ? (
            <div className="text-center p-12 space-y-4">
              <MessageSquare className="h-16 w-16 text-renta-200 mx-auto" />
              <p className="text-renta-400 font-jakarta">Seleccioná un ticket para ver la conversación</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-renta-100 flex items-center justify-between bg-renta-50/30 rounded-t-3xl">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 text-renta-400 hover:text-renta-600">
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                  <div>
                    <h2 className="font-bold text-renta-900 flex items-center gap-2">
                      {selectedTicket.subject}
                    </h2>
                    <p className="text-xs text-renta-400 flex items-center gap-2">
                      <ShieldAlert className="h-3 w-3" />
                      {t('support_chat_level', 'Nivel Support').replace('{{level}}', selectedTicket.current_level.toString())}
                    </p>
                  </div>
                </div>
                <StatusBadge status={selectedTicket.status} t={t} />
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Initial Description */}
                <div className="flex flex-col items-center mb-8">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-bold uppercase text-renta-300 tracking-widest">Inicio de Incidencia</p>
                    <p className="text-xs text-renta-400 italic">"{selectedTicket.description}"</p>
                  </div>
                </div>

                {messages.map((msg, idx) => {
                  const isAdmin = msg.sender_role === 'hiperadmin' || msg.sender_role === 'reseller';
                  return (
                    <div key={msg.id || idx} className={cn(
                      "flex flex-col max-w-[80%]",
                      isAdmin ? "mr-auto items-start" : "ml-auto items-end"
                    )}>
                      <div className={cn(
                        "rounded-2xl p-4 text-sm font-jakarta leading-relaxed",
                        isAdmin 
                          ? "bg-renta-100 text-renta-900 rounded-tl-none" 
                          : "bg-renta-600 text-white rounded-tr-none"
                      )}>
                        {msg.content}
                      </div>
                      <div className="mt-1 flex items-center gap-2 px-1">
                        <span className="text-[9px] font-bold text-renta-400 uppercase tracking-tighter">
                          {isAdmin ? "Soporte Zonatia" : nombre}
                        </span>
                        <span className="text-[9px] text-renta-300">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-renta-100 bg-white rounded-b-3xl">
                {selectedTicket.status === 'cerrado' ? (
                  <div className="p-3 bg-renta-50 rounded-xl text-center text-xs text-renta-400 font-medium">
                    {t('support_chat_closed', 'Ticket cerrado')}
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={t('support_chat_input', 'Escribir respuesta...')}
                      className="w-full bg-renta-50/50 border border-renta-100 rounded-2xl p-3 pr-14 text-sm text-renta-900 placeholder:text-renta-300 focus:outline-none focus:ring-2 focus:ring-renta-200 transition-all resize-none h-20"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!reply.trim()}
                      className="absolute right-3 bottom-3 p-2 bg-renta-600 text-white rounded-xl shadow-lg shadow-renta-600/20 disabled:opacity-30 disabled:shadow-none hover:bg-renta-700 transition"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-renta-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-playfair font-bold text-renta-900">{t('support_form_titulo')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-renta-300 hover:text-renta-500 transition">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-renta-400 uppercase ml-1">{t('support_form_subject')}</label>
                <input 
                  required
                  value={newTicket.subject}
                  onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                  className="w-full bg-renta-50 border border-renta-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-renta-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-renta-400 uppercase ml-1">{t('support_form_category')}</label>
                  <select 
                    value={newTicket.category}
                    onChange={e => setNewTicket({...newTicket, category: e.target.value})}
                    className="w-full bg-renta-50 border border-renta-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  >
                    <option>Consulta Técnica</option>
                    <option>Facturación</option>
                    <option>Sugerencia</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-renta-400 uppercase ml-1">{t('support_form_priority')}</label>
                  <select 
                    value={newTicket.priority}
                    onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                    className="w-full bg-renta-50 border border-renta-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="baja">{t('support_prioridad_baja')}</option>
                    <option value="media">{t('support_prioridad_media')}</option>
                    <option value="alta">{t('support_prioridad_alta')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-renta-400 uppercase ml-1">{t('support_form_description')}</label>
                <textarea 
                  required
                  rows={4}
                  value={newTicket.description}
                  onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full bg-renta-50 border border-renta-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-renta-200 resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-renta-600 text-white rounded-xl font-bold hover:bg-renta-700 transition shadow-lg shadow-renta-600/20"
              >
                {t('support_form_submit')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, t }: { status: string, t: any }) {
  const configs: any = {
    pendiente: { icon: Clock, color: 'text-renta-400', label: t('support_estado_pendiente') },
    en_curso: { icon: MessageSquare, color: 'text-blue-500', label: t('support_estado_en_curso') },
    cerrado: { icon: CheckCircle2, color: 'text-emerald-500', label: t('support_estado_cerrado') },
  };

  const c = configs[status] || configs.pendiente;
  const Icon = c.icon;

  return (
    <div className={cn("flex items-center gap-1.5", c.color)}>
      <Icon className="h-3 w-3" />
      <span className="text-[10px] font-bold uppercase tracking-tight">{c.label}</span>
    </div>
  );
}
