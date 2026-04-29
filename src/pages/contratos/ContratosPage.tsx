import { useState, useEffect } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { Plus, Search, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useEden } from '@/services/eden';
import { toast } from 'sonner';
import { ContratoDetailsModal } from '@/components/contratos/ContratoDetailsModal';

// Mock Data
// Delete MOCK_CONTRATOS as we will fetch real data
export function ContratosPage() {
  const { hasPermission } = useInmobiliaria();
  const { t } = useRegion();
  const [searchTerm, setSearchTerm] = useState('');
  const [allContratos, setAllContratos] = useState<any[]>([]);
  const [selectedContrato, setSelectedContrato] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { client: eden } = useEden();

  useEffect(() => {
    fetchContratos();
  }, [eden]);

  const fetchContratos = async () => {
    setIsLoading(true);
    try {
      // @ts-ignore
      const res = await eden.admin.contratos.get();
      // Defensive check: handle res.data?.contratos to match the new backend structure
      const lista = res.data?.contratos ?? [];
      setAllContratos(lista);
    } catch (e) {
      console.error('Error fetching contratos', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const contratos = allContratos.filter(c => 
    c.propiedad.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.inquilino.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFinalizar = async (contratoId: string) => {
    try {
      // @ts-ignore
      await eden.admin.contratos[contratoId].finalizar.post();
      toast.success('Contrato finalizado exitosamente.');
      setSelectedContrato(null);
      await fetchContratos();
    } catch (e: any) {
      toast.error('Error al finalizar el contrato: ' + e.message);
    }
  };

  const handleReunion = async (contratoId: string, target: 'inquilino' | 'propietario') => {
    try {
      // @ts-ignore
      await eden.admin.contratos[contratoId].reunion.post({ target });
      toast.success(`Notificación de reunión enviada al ${target}.`);
    } catch (e: any) {
      toast.error('Error al solicitar reunión: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">{t('nav_contratos', 'Contratos y Alquileres')}</h1>
          <p className="text-sm text-renta-600 font-inter mt-1">
            {t('contratos_subtitulo', 'Gestión del ciclo de vida, indexación e intereses por mora.')}
          </p>
        </div>
        
        {hasPermission(['superadmin', 'admin', 'vendedor']) && (
          <button 
            onClick={() => navigate('/contratos/nuevo')}
            className="flex items-center gap-2 rounded-xl bg-renta-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-renta-950/20 transition-all hover:bg-renta-800"
          >
            <Plus className="h-4 w-4" />
            {t('contratos_nuevo', 'Nuevo Contrato')}
          </button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-renta-400" />
          <input
            type="text"
            placeholder={t('contratos_buscar', 'Buscar por propiedad o inquilino...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-admin-border bg-white pl-10 pr-4 py-2 text-sm text-renta-900 placeholder:text-renta-400 focus:border-renta-300 focus:ring-1 focus:ring-renta-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <table className="w-full text-left text-sm font-inter">
              <thead className="bg-renta-50/50 text-renta-600 border-b border-admin-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('contratos_th_prop', 'Propiedad Alquilada')}</th>
                  <th className="px-6 py-4 font-semibold">{t('contratos_th_inq', 'Inquilino (Locatario)')}</th>
                  <th className="px-6 py-4 font-semibold">{t('contratos_th_fechas', 'Inicio / Fin')}</th>
                  <th className="px-6 py-4 font-semibold">{t('contratos_th_status', 'Status')}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t('contratos_th_acc', 'Acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border-subtle">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-renta-50 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-renta-50 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-renta-50 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-renta-50 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-20 bg-renta-50 rounded-xl ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
          <table className="w-full text-left text-sm font-inter">
            {/* ... rest of the table */}
            <thead className="bg-renta-50/50 text-renta-600 border-b border-admin-border">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('contratos_th_prop', 'Propiedad Alquilada')}</th>
                <th className="px-6 py-4 font-semibold">{t('contratos_th_inq', 'Inquilino (Locatario)')}</th>
                <th className="px-6 py-4 font-semibold">{t('contratos_th_fechas', 'Inicio / Fin')}</th>
                <th className="px-6 py-4 font-semibold">{t('contratos_th_status', 'Status')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('contratos_th_acc', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {contratos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-renta-500">
                    <FileText className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    {t('contratos_vacio', 'No se encontraron contratos vigentes.')}
                  </td>
                </tr>
              ) : (
                contratos.map((c) => (
                  <tr key={c.id} className="hover:bg-admin-surface-hover transition-colors">
                    <td className="px-6 py-4 font-medium text-renta-950">{c.propiedad}</td>
                    <td className="px-6 py-4 text-renta-600">{c.inquilino}</td>
                    <td className="px-6 py-4 text-renta-900 font-medium">
                       {c.fecha_inicio}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      )}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission(['superadmin', 'admin']) && (
                          <button 
                            onClick={() => setSelectedContrato(c)}
                            title="Gestionar y Finalizar Contrato" 
                            className="flex items-center gap-2 px-3 py-1.5 bg-renta-50 text-renta-600 hover:bg-renta-100 border border-renta-200 rounded-xl transition-all font-semibold text-xs shadow-sm"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            Gestionar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {selectedContrato && (
        <ContratoDetailsModal 
          contrato={selectedContrato}
          onClose={() => setSelectedContrato(null)}
          onFinalizar={handleFinalizar}
          onReunion={handleReunion}
        />
      )}
    </div>
  );
}
