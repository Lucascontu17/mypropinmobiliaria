import { useState } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { Plus, Search, Home, Edit2, Trash2, MapPin, Zap, Flame, Droplets, FileText, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Mock Data Enriquecido para Vendedor (v1.2.3)
const MOCK_PROPIEDADES = [
  { 
    uid_prop: '1', 
    direccion: 'Av. Callao 1234, CABA', 
    status: 'DISPONIBLE', 
    valor_alquiler: 450000, 
    propietario: 'Juan Perez',
    celular_contacto: '+5491112345678',
    superficie_total: 85,
    ambientes: 3,
    dormitorios: 2,
    servicios: { luz: true, gas: true, agua: true, expensas: false, abl: true }
  },
  { 
    uid_prop: '2', 
    direccion: 'Las Heras 3400, CABA', 
    status: 'ALQUILADA', 
    valor_alquiler: 350000, 
    propietario: 'Inversiones Global',
    celular_contacto: '+5491198765432',
    superficie_total: 60,
    ambientes: 2,
    dormitorios: 1,
    servicios: { luz: true, gas: false, agua: true, expensas: true, abl: false }
  },
];

export function PropiedadesPage() {
  const { hasPermission } = useInmobiliaria();
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useRegion();
  const navigate = useNavigate();
  
  const properties = MOCK_PROPIEDADES.filter(p => 
    p.direccion.toLowerCase().includes(searchTerm.toLowerCase()) || p.propietario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">{t('prop_titulo', 'Inventario Patrimonial')}</h1>
          <p className="text-sm text-renta-600 font-inter mt-1">
            {t('prop_desc', 'Gestión centralizada de propiedades y geolocalización.')}
          </p>
        </div>
        
        {hasPermission(['superadmin', 'admin', 'vendedor']) && (
          <button 
            onClick={() => navigate('/propiedades/nueva')}
            className="flex items-center gap-2 rounded-xl bg-renta-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-renta-950/20 transition-all hover:bg-renta-800"
          >
            <Plus className="h-4 w-4" />
            {t('prop_nuevo', 'Nueva Propiedad')}
          </button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-renta-400" />
          <input
            type="text"
            placeholder={t('prop_buscar', 'Buscar por dirección o propietario...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-admin-border bg-white pl-10 pr-4 py-2 text-sm text-renta-900 placeholder:text-renta-400 focus:border-renta-300 focus:ring-1 focus:ring-renta-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Data Table ── */}
      <div 
        data-joyride="assigned-catalog"
        className="rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden animate-fade-in-up" 
        style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-inter">
            <thead className="bg-renta-50/50 text-renta-600 border-b border-admin-border">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('prop_table_dir', 'Dirección')}</th>
                <th className="px-6 py-4 font-semibold text-center">{t('prop_table_specs', 'Especificaciones')}</th>
                <th className="px-6 py-4 font-semibold">{t('prop_table_servicios', 'Servicios')}</th>
                <th className="px-6 py-4 font-semibold">{t('prop_table_status', 'Estado')}</th>
                <th className="px-6 py-4 font-semibold">{t('prop_table_valor', 'Valor')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('prop_table_acc', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-renta-500">
                    <MapPin className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    {t('prop_vacio', 'No se encontraron propiedades.')}
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.uid_prop} className="hover:bg-admin-surface-hover transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 font-medium text-renta-950">
                          <Home className="h-4 w-4 text-renta-400" /> {p.direccion}
                       </div>
                       <div className="text-[10px] text-renta-500 mt-0.5 uppercase tracking-wider">{p.propietario}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                         <div className="text-xs font-bold text-renta-950">{p.superficie_total} m²</div>
                         <div className="text-[10px] text-renta-500 flex items-center gap-1 font-semibold">
                            <span>{p.ambientes} AMB</span> • <span>{p.dormitorios} DORM</span>
                         </div>
                      </div>
                    </td>

                    {/* Monitor de Servicios (Luz, Gas, Agua, etc) */}
                    <td className="px-6 py-4">
                       <div 
                         data-joyride="service-icons"
                         className="flex items-center gap-1.5">
                          <Zap className={cn("h-3.5 w-3.5", p.servicios.luz ? "text-amber-500" : "text-gray-200")} />
                          <Flame className={cn("h-3.5 w-3.5", p.servicios.gas ? "text-orange-500" : "text-gray-200")} />
                          <Droplets className={cn("h-3.5 w-3.5", p.servicios.agua ? "text-blue-500" : "text-gray-200")} />
                          <FileText className={cn("h-3.5 w-3.5", p.servicios.expensas ? "text-purple-500" : "text-gray-200")} />
                       </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        p.status === 'DISPONIBLE' && "bg-green-50 text-green-700 border border-green-100",
                        p.status === 'ALQUILADA' && "bg-blue-50 text-blue-700 border border-blue-100",
                        ["VENTA","RESERVADA","VENDIDA"].includes(p.status) && "bg-amber-50 text-amber-700 border border-amber-100",
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-renta-900 font-bold">
                      ${p.valor_alquiler.toLocaleString('es-AR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          data-joyride="contact-action"
                          title="Click para llamar (E.164)"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/propiedades/${p.uid_prop}`)}
                          className="p-2 text-renta-400 hover:text-renta-700 hover:bg-renta-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
