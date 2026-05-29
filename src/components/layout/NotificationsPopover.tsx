import * as Popover from '@radix-ui/react-popover';
import { Bell, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { useRegion } from '@/hooks/useRegion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Ticket {
  id: string;
  subject: string;
  status: 'pendiente' | 'en_curso' | 'cerrado';
  priority: 'baja' | 'media' | 'alta';
  updated_at: string;
}

/**
 * NotificationsPopover — Dropdown de notificaciones en el Topbar.
 * Actualmente sincronizado con el Centro de Soporte para alertar sobre tickets activos.
 */
export function NotificationsPopover() {
  const { apiFetch } = useApi();
  const { t } = useRegion();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchRecentActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/soporte/tickets');
      if (res.success) {
        // Mostrar solo los más recientes o pendientes
        setTickets(res.data.slice(0, 5));
      }
    } catch (err) {
      console.error('[Notifications] Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (open) {
      fetchRecentActivity();
    }
  }, [open, fetchRecentActivity]);

  // Contador de tickets pendientes/en curso
  const activeCount = tickets.filter(t => t.status !== 'cerrado').length;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white text-renta-600 transition-all hover:bg-renta-50 hover:shadow-sm",
            open && "bg-renta-50 ring-renta-200"
          )}
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-renta-500 text-[8px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 mt-2 w-80 rounded-2xl border border-admin-border bg-white p-0 shadow-2xl animate-in fade-in zoom-in duration-200"
          sideOffset={5}
          align="end"
        >
          <div className="flex items-center justify-between border-b border-renta-100 p-4">
            <h3 className="text-sm font-bold text-renta-900">{t('notificaciones_titulo', 'Actividad Reciente')}</h3>
            <span className="rounded-full bg-renta-50 px-2 py-0.5 text-[10px] font-bold text-renta-600">
              {activeCount} Pendientes
            </span>
          </div>

          <div className="max-h-[350px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-renta-200 border-t-renta-600" />
                <p className="text-xs text-renta-400">Sincronizando...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
                <div className="rounded-full bg-renta-50 p-3">
                  <Bell className="h-6 w-6 text-renta-200" />
                </div>
                <p className="text-xs text-renta-400 font-medium">No hay notificaciones nuevas</p>
              </div>
            ) : (
              <div className="divide-y divide-renta-50">
                {tickets.map((ticket) => (
                  <a
                    key={ticket.id}
                    href="/soporte"
                    className="flex items-start gap-3 p-4 transition-colors hover:bg-renta-50/50"
                    onClick={() => setOpen(false)}
                  >
                    <div className={cn(
                      "mt-0.5 rounded-lg p-2",
                      ticket.status === 'pendiente' ? "bg-amber-50 text-amber-600" : 
                      ticket.status === 'en_curso' ? "bg-blue-50 text-blue-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {ticket.status === 'en_curso' ? <MessageSquare className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold text-renta-900 line-clamp-1">{ticket.subject}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-renta-400">
                          {ticket.status === 'pendiente' ? 'Ticket Abierto' : 'Nueva Respuesta'}
                        </span>
                        <span className="text-[10px] text-renta-300">•</span>
                        <span className="flex items-center gap-1 text-[10px] text-renta-300">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-renta-100 p-3">
            <a
              href="/soporte"
              className="block w-full rounded-xl bg-renta-50/50 py-2 text-center text-xs font-bold text-renta-600 transition-colors hover:bg-renta-50 hover:text-renta-700"
              onClick={() => setOpen(false)}
            >
              Ver todo el Centro de Soporte
            </a>
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
