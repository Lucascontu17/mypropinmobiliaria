import { useState } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { Plus, Search, FileText, Trash2, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { eden } from '@/services/eden';
import { toast } from 'react-hot-toast';
import { ContratoDetailsModal } from '@/components/contratos/ContratoDetailsModal';

// Mock Data
const MOCK_CONTRATOS = [
  { id: '1', propiedad: 'Av. Callao 1234, CABA', inquilino: 'Martin Lopez', fecha_inicio: '2026-04-01', precio: 450000, estado: 'ACTIVO' },
];

export function ContratosPage() {
  const { hasPermission } = useInmobiliaria();
  const { t } = useRegion();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContrato, setSelectedContrato] = useState<typeof MOCK_CONTRATOS[0] | null>(null);
  const navigate = useNavigate();
  
  const contratos = MOCK_CONTRATOS.filter(c => 
    c.propiedad.toLowerCase().includes(searchTerm.toLowerCase()) || c.inquilino.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFinalizar = async (contratoId: string) => {
    try {
      // @ts-ignore
      await eden.admin.contratos[contratoId].finalizar.post();
      toast.success('Contrato finalizado exitosamente.');
      setSelectedContrato(null);
    } catch (e: any) {
      toast.error('Error al finalizar el contrato: ' + e.message);
    }
  };

  const handleReunion = async (contratoId: string) => {
    try {
      // @ts-ignore
      await eden.admin.contratos[contratoId].reunion.post();
      toast.success('Notificación de reunión enviada al inquilino.');
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
                          <>
                            <button 
                              onClick={() => setSelectedContrato(c)}
                              title="Gestionar Contrato" 
                              className="p-2 text-renta-400 hover:text-renta-600 hover:bg-renta-50 rounded-lg transition-colors"
                            >
                              <StopCircle className="h-4 w-4" />
                            </button>
                            <button title="Eliminar Contrato (Rollback)" className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
