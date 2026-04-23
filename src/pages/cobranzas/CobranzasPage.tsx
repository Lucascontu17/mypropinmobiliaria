import { useState, useMemo } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { type PagoEnCuenta } from '@/types/cobranzas';
import { RegistrarIngresoModal } from '@/components/cobranzas/RegistrarIngresoModal';
import { CierrePeriodoModal } from '@/components/cobranzas/CierrePeriodoModal';
import { Search, FolderSync, Plus, FileText, CheckCircle2, AlertCircle, Clock, Check, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data representativo de la DB (Mes en curso)
const PERIODO_ACTUAL = '2026-04';
const MOCK_PAGOS: PagoEnCuenta[] = [
  {
    pago_id: 'p1', contrato_id: 'c1', inmobiliaria_id: 'inmo1',
    periodo: PERIODO_ACTUAL, nombre_inquilino: 'Martin Lopez', detalle_propiedad: 'Av. Callao 1234, CABA',
    monto_alquiler_base: 450000, monto_expensas: 0,
    monto_a_abonar: 450000, monto_abonado: 450000, status: 'PAGADO'
  },
  {
    pago_id: 'p2', contrato_id: 'c2', inmobiliaria_id: 'inmo1',
    periodo: PERIODO_ACTUAL, nombre_inquilino: 'Estudio Jurídico R&M', detalle_propiedad: 'Oficina 3B, Centro',
    monto_alquiler_base: 650000, monto_expensas: 150000,
    monto_a_abonar: 800000, monto_abonado: 300000, status: 'PARCIAL' // Pagó de menos
  },
  {
    pago_id: 'p3', contrato_id: 'c3', inmobiliaria_id: 'inmo1',
    periodo: PERIODO_ACTUAL, nombre_inquilino: 'Carlos Gomez', detalle_propiedad: 'San Salvador 332',
    monto_alquiler_base: 300000, monto_expensas: 0,
    monto_a_abonar: 300000, monto_abonado: 0, status: 'PENDIENTE' 
  },
  { // Saldo a favor simulación
    pago_id: 'p4', contrato_id: 'c4', inmobiliaria_id: 'inmo1',
    periodo: PERIODO_ACTUAL, nombre_inquilino: 'Maria Perez', detalle_propiedad: 'Local Comercial Güemes',
    monto_alquiler_base: 400000, monto_expensas: 100000,
    monto_a_abonar: 500000, monto_abonado: 550000, status: 'PAGADO' 
  }
];

type FiltroEstado = 'TODOS' | 'AL_DIA' | 'CON_DEUDA' | 'SALDOS_A_FAVOR';

/**
 * CobranzasPage — Cuenta Corriente Global con moneda regionalizada.
 * Todos los importes formateados via useRegion().formatCurrency().
 * Textos localizados via useRegion().t() desde archivos de dialectos .md.
 */
export function CobranzasPage() {
  const { hasPermission } = useInmobiliaria();
  const { t, formatCurrency } = useRegion();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('TODOS');
  
  // Modals state
  const [selectedPago, setSelectedPago] = useState<PagoEnCuenta | null>(null);
  const [showCierreModal, setShowCierreModal] = useState(false);

  // Business Logic Filtering
  const pagosVisibles = useMemo(() => {
    return MOCK_PAGOS.filter(p => {
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
  }, [searchTerm, filtro]);

  // Totales Financieros Header
  const totalRecaudado = MOCK_PAGOS.reduce((acc, p) => acc + p.monto_abonado, 0);
  const totalEsperado = MOCK_PAGOS.reduce((acc, p) => acc + p.monto_a_abonar, 0);
  const deudaEstimadaCierre = MOCK_PAGOS.reduce((acc, p) => {
     const dif = p.monto_a_abonar - p.monto_abonado;
     return acc + (dif > 0 ? dif : 0);
  }, 0);
  const saldoFavorEstimado = MOCK_PAGOS.reduce((acc, p) => {
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
            {t('cobranza_periodo', 'Periodo Activo')}: <span className="font-bold text-renta-900 bg-renta-100 px-2 py-0.5 rounded-md">{PERIODO_ACTUAL}</span>
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
            <p className="text-2xl font-bold text-emerald-600 font-jakarta mt-1">{formatCurrency(totalRecaudado)}</p>
         </div>
         <div className="bg-white border border-admin-border p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {t('cobranza_esperado', 'Total Esperado N')}
            </p>
            <p className="text-2xl font-bold text-renta-900 font-jakarta mt-1">{formatCurrency(totalEsperado)}</p>
         </div>
          <div 
            data-shepherd="kpi-morosidad"
            className="bg-white border border-admin-border p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" /> {t('cobranza_morosidad', 'Morosidad (A arrastrar)')}
            </p>
            <p className="text-2xl font-bold text-red-600 font-jakarta mt-1">{formatCurrency(deudaEstimadaCierre)}</p>
          </div>
         <div className="bg-white border border-admin-border p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
              <Plus className="h-3 w-3" /> {t('cobranza_saldos', 'Saldos a Favor Inq.')}
            </p>
            <p className="text-2xl font-bold text-blue-600 font-jakarta mt-1">{formatCurrency(saldoFavorEstimado)}</p>
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
              {pagosVisibles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-renta-500">
                    <Wallet className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    {t('cobranza_vacio', 'No hay contratos que coincidan con los filtros aplicados en este periodo.')}
                  </td>
                </tr>
              ) : (
                pagosVisibles.map((p) => {
                   const saldoRestante = p.monto_a_abonar - p.monto_abonado;
                   const tieneSaldoFavor = saldoRestante < 0;

                   return (
                     <tr key={p.pago_id} className={cn(
                       "hover:bg-admin-surface-hover transition-colors",
                       saldoRestante <= 0 ? "opacity-60 grayscale-[0.2]" : ""
                     )}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-renta-950">{p.nombre_inquilino}</div>
                        <div className="text-[11px] text-renta-500 mt-0.5">{p.detalle_propiedad}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-renta-900">
                         {formatCurrency(p.monto_a_abonar)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                         {formatCurrency(p.monto_abonado)}
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
                          p.status === 'PAGADO' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          p.status === 'PARCIAL' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200" // Pendiente o Vencido
                        )}>
                          {tieneSaldoFavor && <Check className="h-3 w-3"/>}
                          {tieneSaldoFavor ? t('cobranza_a_favor', 'A FAVOR') : p.status}
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
          onSuccess={() => alert('¡Ingreso procesado correctamente! En la integración final esto actualizará la DB.')}
        />
      )}

      {showCierreModal && (
         <CierrePeriodoModal
           periodoActual={PERIODO_ACTUAL}
           deudaEstimada={deudaEstimadaCierre}
           saldoAFavorEstimado={saldoFavorEstimado}
           onClose={() => setShowCierreModal(false)}
           onSuccess={() => {
             alert('El mes ha sido cerrado. En Integración esto forzará una recarga atómica en mypropAPI.');
           }}
         />
      )}

    </div>
  );
}
