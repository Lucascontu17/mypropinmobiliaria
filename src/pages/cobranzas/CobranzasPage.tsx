import { useState, useMemo, useEffect } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { type PagoEnCuenta } from '@/types/cobranzas';
import { RegistrarIngresoModal } from '@/components/cobranzas/RegistrarIngresoModal';
import { CierrePeriodoModal } from '@/components/cobranzas/CierrePeriodoModal';
import { VerBoletasModal } from '@/components/cobranzas/VerBoletasModal';
import { Search, FolderSync, Plus, FileText, CheckCircle2, AlertCircle, Clock, Check, Wallet, FileUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEden } from '@/services/eden';
import { toast } from 'sonner';

type FiltroEstado = 'TODOS' | 'AL_DIA' | 'CON_DEUDA' | 'SALDOS_A_FAVOR';

export function CobranzasPage() {
  const { hasPermission } = useInmobiliaria();
  const { t, formatCurrency } = useRegion();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('TODOS');
  const [pagos, setPagos] = useState<PagoEnCuenta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { client: eden } = useEden();
  const [periodoActual, setPeriodoActual] = useState(new Date().toISOString().slice(0, 7));
  
  // Modals state
  const [selectedPago, setSelectedPago] = useState<PagoEnCuenta | null>(null);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [boletasPagoId, setBoletasPagoId] = useState<{ id: string, nombre: string } | null>(null);

  const fetchPagos = async () => {
    setIsLoading(true);
    try {
        const { data, error } = await eden.admin.pagos.get({
            query: { periodo: periodoActual }
        });
        if (error) {
            toast.error('No se pudo cargar la cobranza');
        } else {
            // @ts-ignore
            setPagos(data?.pagos ?? []);
        }
    } catch (err) {
        toast.error('Error al conectar con el servidor');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, [periodoActual, eden]);

  // Business Logic Filtering
  const pagosVisibles = useMemo(() => {
    return pagos.filter(p => {
      // Search
      const matchText = p.nombre_inquilino.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.detalle_propiedad.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchText) return false;

      // Status Filter logic
      const saldoRestante = p.monto_a_abonar - p.monto_abonado;
      if (filtro === 'AL_DIA') return saldoRestante === 0;
      if (filtro === 'SALDOS_A_FAVOR') return saldoRestante < 0; // Excedentes Financieros
      if (filtro === 'CON_DEUDA') return saldoRestante > 0;
      return true;
    });
  }, [searchTerm, filtro, pagos]);

  // Totales Financieros Header
  const totalRecaudado = pagos.reduce((acc, p) => acc + p.monto_abonado, 0);
  const totalEsperado = pagos.reduce((acc, p) => acc + p.monto_a_abonar, 0);
  const deudaEstimadaCierre = pagos.reduce((acc, p) => {
     const dif = p.monto_a_abonar - p.monto_abonado;
     return acc + (dif > 0 ? dif : 0);
  }, 0);
  const saldoFavorEstimado = pagos.reduce((acc, p) => {
     const dif = p.monto_a_abonar - p.monto_abonado;
     return acc + (dif < 0 ? Math.abs(dif) : 0); // Excedente Absoluto
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* ── Header Financiero ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">
            {t('cobranza_titulo', 'Cuenta Corriente Global')}
          </h1>
          <p className="text-sm text-renta-600 font-inter mt-1 flex items-center gap-2">
            {t('cobranza_periodo', 'Periodo Activo')}: <span className="font-bold text-renta-900 bg-renta-100 px-2 py-0.5 rounded-md">{periodoActual}</span>
          </p>
        </div>
        
        {hasPermission(['superadmin', 'admin']) && (
          <button 
            data-shepherd="btn-cierre-periodo"
            onClick={() => setShowCierreModal(true)}
            className="flex items-center gap-2 rounded-xl bg-renta-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-renta-950/20 transition-all hover:bg-renta-800 hover:scale-[1.02]"
          >
            <FolderSync className="h-4 w-4" />
            {t('cobranza_cierre', 'Cerrar Periodo & Arrastrar Deuda')}
          </button>
        )}
      </div>

      {/* ── KPI Widgets ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
         <div className="bg-white border border-admin-border p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> {t('cobranza_recaudacion', 'Recaudación Real')}
            </p>
            {isLoading ? (
              <div className="h-8 w-24 bg-emerald-50 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-emerald-600 font-jakarta mt-1">{formatCurrency(totalRecaudado)}</p>
            )}
         </div>
         <div className="bg-white border border-admin-border p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {t('cobranza_esperado', 'Total Esperado N')}
            </p>
            {isLoading ? (
              <div className="h-8 w-24 bg-renta-50 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-renta-900 font-jakarta mt-1">{formatCurrency(totalEsperado)}</p>
            )}
         </div>
          <div 
            data-shepherd="kpi-morosidad"
            className="bg-white border border-admin-border p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" /> {t('cobranza_morosidad', 'Morosidad (A arrastrar)')}
            </p>
            {isLoading ? (
              <div className="h-8 w-24 bg-red-50 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-red-600 font-jakarta mt-1">{formatCurrency(deudaEstimadaCierre)}</p>
            )}
          </div>
         <div className="bg-white border border-admin-border p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
              <Plus className="h-3 w-3" /> {t('cobranza_saldos', 'Saldos a Favor Inq.')}
            </p>
            {isLoading ? (
              <div className="h-8 w-24 bg-blue-50 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-blue-600 font-jakarta mt-1">{formatCurrency(saldoFavorEstimado)}</p>
            )}
         </div>
      </div>

      {/* ── Toolbar & Filtros ── */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-renta-400" />
          <input
            type="text"
            placeholder={t('cobranza_buscar', 'Buscar contrato o inquilino...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-admin-border bg-white pl-10 pr-4 py-2.5 text-sm text-renta-900 placeholder:text-renta-400 focus:border-renta-300 focus:ring-1 focus:ring-renta-200 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
           {(['TODOS', 'AL_DIA', 'CON_DEUDA', 'SALDOS_A_FAVOR'] as FiltroEstado[]).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors",
                  filtro === f ? "bg-renta-900 text-white" : "bg-white border border-admin-border text-renta-600 hover:bg-renta-50"
                )}
              >
                {f.replace(/_/g, ' ')}
              </button>
           ))}
        </div>
      </div>

      {/* ── Data Table ── */}
      <div 
        className="rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden animate-fade-in-up" 
        style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-inter">
            <thead data-shepherd="table-cobranzas" className="bg-renta-50/50 text-renta-600 border-b border-admin-border">
              <tr>
                <th className="px-6 py-4 font-semibold shrink-0">{t('cobranza_inquilino', 'Inquilino / Contrato')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('cobranza_a_abonar', 'A Abonar (N)')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('cobranza_abonado', 'Abonado Real')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('cobranza_saldo_restante', 'Saldo Restante')}</th>
                <th className="px-6 py-4 font-semibold text-center">{t('cobranza_estado', 'Estado')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('cobranza_acciones', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 text-renta-400 animate-spin mb-2" />
                    <p className="text-sm text-renta-500">Cargando cobranzas reales...</p>
                  </td>
                </tr>
              ) : (pagosVisibles?.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-renta-500">
                    <Wallet className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    {t('cobranza_vacio', 'No hay contratos que coincidan con los filtros aplicados en este periodo.')}
                  </td>
                </tr>
              ) : (
                pagosVisibles?.map((p) => {
                   const saldoRestante = (p?.monto_a_abonar || 0) - (p?.monto_abonado || 0);
                   const tieneSaldoFavor = saldoRestante < 0;

                   return (
                     <tr key={p?.pago_id} className={cn(
                       "hover:bg-admin-surface-hover transition-colors",
                       saldoRestante <= 0 ? "opacity-60 grayscale-[0.2]" : ""
                     )}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-renta-950">{p?.nombre_inquilino || 'Inquilino desconocido'}</div>
                        <div className="text-[11px] text-renta-500 mt-0.5">{p?.detalle_propiedad || 'Sin dirección'}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-renta-900">
                         {formatCurrency(p?.monto_a_abonar || 0)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                         {formatCurrency(p?.monto_abonado || 0)}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className={cn(
                           "font-bold",
                           tieneSaldoFavor ? "text-blue-600 bg-blue-50 px-2 py-1 rounded" : 
                           saldoRestante > 0 ? "text-red-500" : "text-emerald-500"
                         )}>
                            {formatCurrency(saldoRestante)}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                          tieneSaldoFavor ? "bg-blue-50 text-blue-700 border-blue-200" :
                          p?.status === 'PAGADO' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          p?.status === 'PARCIAL' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200" // Pendiente o Vencido
                        )}>
                          {tieneSaldoFavor && <Check className="h-3 w-3"/>}
                          {tieneSaldoFavor ? t('cobranza_a_favor', 'A FAVOR') : (p?.status || 'PENDIENTE')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                           {saldoRestante > 0 ? (
                             <button 
                               data-shepherd="btn-registrar-pago"
                               onClick={() => setSelectedPago(p)}
                               className="text-[11px] uppercase tracking-wider font-bold text-renta-600 bg-white border border-admin-border hover:bg-renta-50 hover:text-renta-900 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                             >
                               <Plus className="h-3 w-3" /> {t('cobranza_cobrar', 'Cobrar')}
                             </button>
                           ) : (
                             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px] uppercase tracking-wider animate-in fade-in zoom-in duration-300">
                               <CheckCircle2 className="h-3 w-3" /> {t('cobranza_completado', 'Cobrado')}
                             </div>
                           )}
                           <button 
                             title="Ver Recibos"
                             className="text-renta-400 bg-white border border-transparent hover:border-admin-border hover:text-renta-900 px-2 rounded-lg transition-colors"
                           >
                             <FileText className="h-4 w-4" />
                           </button>
                           <button 
                             title="Ver Boletas de Servicios"
                             onClick={() => setBoletasPagoId({ id: p?.pago_id, nombre: p?.nombre_inquilino })}
                             className="text-renta-400 bg-white border border-transparent hover:border-admin-border hover:text-renta-900 px-2 rounded-lg transition-colors"
                           >
                             <FileUp className="h-4 w-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                   )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modales en Memoria ── */}
      {selectedPago && (
        <RegistrarIngresoModal 
          pagoDestino={selectedPago} 
          onClose={() => setSelectedPago(null)}
          onSuccess={() => {
            setSelectedPago(null);
            fetchPagos();
          }}
        />
      )}

      {showCierreModal && (
         <CierrePeriodoModal
           periodoActual={periodoActual}
           deudaEstimada={deudaEstimadaCierre}
           saldoAFavorEstimado={saldoFavorEstimado}
           onClose={() => setShowCierreModal(false)}
           onSuccess={() => {
             fetchPagos();
             toast.success('El periodo ha sido procesado.');
           }}
         />
      )}

      {boletasPagoId && (
        <VerBoletasModal
          pagoId={boletasPagoId.id}
          inquilinoNombre={boletasPagoId.nombre}
          onClose={() => setBoletasPagoId(null)}
        />
      )}

    </div>
  );
}
