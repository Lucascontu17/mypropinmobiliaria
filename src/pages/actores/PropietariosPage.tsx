import { useState, useEffect } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { Plus, Search, Building2, Edit2, Trash2, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropietarioForm } from '@/components/actores/PropietarioForm';
import { useEden } from '@/services/eden';

export function PropietariosPage() {
  const { hasPermission } = useInmobiliaria();
  const { t, formatCurrency } = useRegion();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<any | null>(null);
  const [propietarios, setPropietarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { client: eden, isReady } = useEden();

  useEffect(() => {
    const fetchPropietarios = async () => {
      if (!isReady) return;
      try {
        setIsLoading(true);
        const { data, error } = await eden.admin.owners.get();
        if (error) {
           console.error("Error fetching propietarios:", error);
        } else {
           // @ts-ignore
           setPropietarios(data?.owners ?? []);
        }
      } catch (err) {
        console.error("Critical error fetching propietarios:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPropietarios();
  }, [eden, isReady]);

  const filteredPropietarios = propietarios.filter(p => 
    (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.dni || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">{t('nav_propietarios', 'Propietarios')}</h1>
          <p className="text-sm text-renta-600 font-inter mt-1">
            {t('propietarios_subtitulo', 'Gestión de dueños de inmuebles y liquidaciones de alquiler.')}
          </p>
        </div>
        
        {hasPermission(['superadmin', 'admin']) && (
          <button 
            onClick={() => { setEditingData(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-renta-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-renta-950/20 transition-all hover:bg-renta-800"
          >
            <Plus className="h-4 w-4" />
            {t('propietarios_nuevo', 'Nuevo Propietario')}
          </button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-renta-400" />
          <input
            type="text"
            placeholder={t('propietarios_buscar', 'Buscar por nombre o DNI...')}
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
                <th className="px-6 py-4 font-semibold">{t('propietarios_th_nombre', 'Propietario')}</th>
                <th className="px-6 py-4 font-semibold">{t('propietarios_th_dni', 'DNI / CUIT')}</th>
                <th className="px-6 py-4 font-semibold">{t('propietarios_th_contacto', 'Contacto')}</th>
                <th className="px-6 py-4 font-semibold">{t('propietarios_th_comision', 'Comisión')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('propietarios_th_acciones', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
               {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-renta-50 rounded" />
                        <div className="h-2 w-16 bg-renta-50 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-renta-50 rounded" /></td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-renta-50 rounded" />
                        <div className="h-3 w-36 bg-renta-50 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-3 w-12 bg-renta-50 rounded" />
                        <div className="h-2 w-10 bg-renta-50 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-renta-50 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : (filteredPropietarios?.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-renta-500">
                    <Building2 className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    {t('propietarios_vacio', 'No se encontraron propietarios registrados.')}
                  </td>
                </tr>
              ) : (
                filteredPropietarios?.map((p) => (
                  <tr key={p?.id} className="hover:bg-admin-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-renta-950">{p?.nombre || 'Sin nombre'}</span>
                        <span className="text-[10px] text-renta-400 font-mono">UID: {p?.id?.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-renta-600 font-medium">{p?.dni || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-renta-900 font-medium">{p?.celular || 'No registrado'}</span>
                        <span className="text-xs text-renta-500">{p?.email || 'Sin email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-renta-950">
                            {p?.commission_type === 'percent' ? `${p?.commission_value || 0}%` : formatCurrency(p?.commission_value || 0)}
                          </span>
                          <span className="text-[10px] text-renta-500 uppercase tracking-tighter">
                            {p?.commission_type === 'percent' ? 'Variable' : 'Fija'}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingData(p); setIsFormOpen(true); }}
                          className="p-2 text-renta-400 hover:text-renta-700 hover:bg-renta-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {hasPermission(['superadmin']) && (
                          <button className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-renta-950/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <PropietarioForm 
              initialData={editingData} 
              onCancel={() => setIsFormOpen(false)} 
              onSuccess={() => {
                 setIsFormOpen(false);
                 // Trigger refresh by some means or just let useEffect handle it if we add a deps
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
