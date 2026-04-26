import { useState, useEffect } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { Plus, Search, Users, Edit2, Trash2, FileText, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InquilinoForm } from '@/components/actores/InquilinoForm';
import { api } from '@/services/eden';

export function InquilinosPage() {
  const { hasPermission, inmobiliaria_id } = useInmobiliaria();
  const { t } = useRegion();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<any | null>(null);
  const [inquilinos, setInquilinos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchInquilinos = async () => {
      try {
        setIsLoading(true);
        const res = await api.admin.inquilinos.get({ 
          headers: { 'x-inmobiliaria-id': inmobiliaria_id || '' } 
        });
        const lista = res.data?.inquilinos ?? [];
        setInquilinos(lista);
      } catch (err) {
        console.error("Critical error fetching inquilinos:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInquilinos();
  }, [inmobiliaria_id]);

  const filteredInquilinos = inquilinos.filter(p => 
    (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.dni || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">{t('nav_inquilinos', 'Inquilinos')}</h1>
          <p className="text-sm text-renta-600 font-inter mt-1">
            {t('inquilinos_subtitulo', 'Gestión de locatarios y acceso a documentación digital.')}
          </p>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-renta-400" />
          <input
            type="text"
            placeholder={t('inquilinos_buscar', 'Buscar por nombre o DNI...')}
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
                <th className="px-6 py-4 font-semibold">{t('inquilinos_th_id', 'ID Plataforma')}</th>
                <th className="px-6 py-4 font-semibold">{t('inquilinos_th_nombre', 'Inquilino')}</th>
                <th className="px-6 py-4 font-semibold">{t('inquilinos_th_dni', 'DNI')}</th>
                <th className="px-6 py-4 font-semibold">{t('inquilinos_th_contacto', 'Contacto (E.164)')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('inquilinos_th_acciones', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-renta-500">
                    <Loader2 className="mx-auto h-8 w-8 text-renta-200 mb-3 animate-spin" />
                    {t('inquilinos_cargando', 'Sincronizando legajos reales...')}
                  </td>
                </tr>
              ) : (filteredInquilinos?.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-renta-500">
                    <Users className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    {t('inquilinos_vacio', 'No se encontraron inquilinos.')}
                  </td>
                </tr>
              ) : (
                filteredInquilinos?.map((t) => (
                  <tr key={t?.id} className="hover:bg-admin-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-renta-950 bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                        #{t?.client_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-renta-950">{t?.nombre || 'Sin nombre'}</span>
                        {t?.status === 'CLIENT' && (
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Potencial Inquilino</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-renta-600">{t?.dni || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-renta-900 font-medium">{t?.celular || 'No registrado'}</span>
                        <span className="text-xs text-renta-500">{t?.email || 'Sin email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingData(t); setIsFormOpen(true); }}
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
            <InquilinoForm 
              initialData={editingData} 
              onCancel={() => setIsFormOpen(false)} 
              onSuccess={() => setIsFormOpen(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
