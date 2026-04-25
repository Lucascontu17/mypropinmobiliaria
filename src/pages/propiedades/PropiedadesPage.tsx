import { useState, useEffect } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { Plus, Search, Home, Edit2, MapPin, Zap, Flame, Droplets, FileText, Phone, Rocket, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useEden } from '@/services/eden';
import { LocalShepherd, type ShepherdStep } from '@/components/shepherd/LocalShepherd';

export function PropiedadesPage() {
  const { hasPermission, role } = useInmobiliaria();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const { t, formatCurrency } = useRegion();
  const navigate = useNavigate();
  const { client: eden, isReady } = useEden();

  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booster Modal State
  const [boosterModal, setBoosterModal] = useState<{ uid: string; direccion: string } | null>(null);
  const [boosterPuntos, setBoosterPuntos] = useState(5);
  const [isAssigning, setIsAssigning] = useState(false);
  
  useEffect(() => {
    const fetchProperties = async () => {
      if (!isReady) return; // Esperar a que el token esté listo

      setIsLoading(true);
      try {
        const { data, error } = await eden.admin.propiedades.get();
        if (error) {
          console.error('[PROPIEDADES] Error fetching:', error);
        } else {
          setProperties(data.data || []);
        }
      } catch (err) {
        console.error('[PROPIEDADES] Connection error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, [eden, isReady]);

  const filteredProperties = properties.filter(p => {
    const matchesSearch = (p.direccion || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || p.tipo_inmueble === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const handleAssignPoints = async () => {
    if (!boosterModal || boosterPuntos <= 0) return;
    setIsAssigning(true);
    // Modo Demo: Éxito local
    setTimeout(() => {
      alert(`${boosterPuntos} puntos asignados a ${boosterModal.direccion}`);
      setBoosterModal(null);
      setBoosterPuntos(5);
      setIsAssigning(false);
    }, 1200);
  };

  const shepherdSteps: ShepherdStep[] = role === 'superadmin' || role === 'admin' 
    ? [
        {
          target: '[data-shepherd="assigned-catalog"]',
          title: t('tour_prop_catalog_title', 'Catálogo de Propiedades'),
          content: t('tour_prop_catalog_desc', 'Aquí se listan todas las propiedades dadas de alta. Si eres Vendedor, el sistema aplica automáticamente el Master Filter para que solo veas las asignadas a ti.'),
          placement: 'bottom',
        },
        {
          target: '[data-shepherd="booster-action"]',
          title: t('tour_prop_booster_title', 'Asignar Puntos Booster 🚀'),
          content: t('tour_prop_booster_desc', 'Use este botón para inyectarle puntos a una propiedad que esté "Disponible" o "En Venta". Los puntos mejoran su ranking dentro del ecosistema.'),
          placement: 'left',
        }
      ]
    : [
        {
          target: '[data-shepherd="assigned-catalog"]',
          title: t('tour_prop_catalog_title', 'Tu Catálogo Asignado'),
          content: t('tour_prop_catalog_ven_desc', 'Como vendedor, solo ves las propiedades que te fueron asignadas. Este es tu espacio de trabajo principal.'),
          placement: 'bottom',
        },
        {
          target: '[data-shepherd="service-icons"]',
          title: t('tour_prop_services_title', 'Indicadores de Servicios'),
          content: t('tour_prop_services_desc', 'Estos íconos te muestran rápidamente qué servicios tiene activos la propiedad (luz, gas, agua).'),
          placement: 'bottom',
        }
      ];

  return (
    <div className="space-y-6">
      <LocalShepherd steps={shepherdSteps} storageKey={`enjoy_local_propiedades_${role}`} />
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

        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="rounded-xl border border-admin-border bg-white px-4 py-2 text-sm text-renta-900 focus:border-renta-300 focus:ring-1 focus:ring-renta-200 outline-none transition-all font-semibold"
        >
          <option value="todos">Todos los Tipos</option>
          <option value="departamento">🏢 Departamento</option>
          <option value="casa">🏡 Casa</option>
          <option value="ph">🏘️ PH</option>
          <option value="terreno">🌱 Terreno</option>
          <option value="habitacion">🛌 Habitación</option>
          <option value="otro">❓ Otro</option>
        </select>
      </div>

      {/* ── Data Table ── */}
      <div 
        data-shepherd="assigned-catalog"
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-renta-500">
                    <Loader2 className="mx-auto h-8 w-8 text-renta-200 mb-3 animate-spin" />
                    {t('prop_cargando', 'Sincronizando inventario real...')}
                  </td>
                </tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-renta-500">
                    <MapPin className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    {t('prop_vacio', 'No se encontraron propiedades.')}
                  </td>
                </tr>
              ) : (
                filteredProperties?.map((p) => (
                   <tr key={p?.uid_prop} className="hover:bg-admin-surface-hover transition-colors group">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-medium text-renta-950">
                           <Home className="h-4 w-4 text-renta-400" /> {p?.direccion || p?.titulo || 'Sin dirección'}
                        </div>
                        <div className="text-[10px] text-renta-500 mt-0.5 uppercase tracking-wider">{p?.propietario_nombre || 'Sin propietario'}</div>
                     </td>
                     
                     <td className="px-6 py-4">
                       <div className="flex flex-col items-center justify-center gap-0.5">
                          <div className="text-xs font-bold text-renta-950">{p?.mts2 || 0} m²</div>
                          <div className="text-[10px] text-renta-500 flex items-center gap-1 font-semibold">
                             <span>{p?.ambientes || 0} AMB</span> • <span>{p?.habitaciones || 0} DORM</span>
                          </div>
                       </div>
                     </td>

                     {/* Monitor de Servicios (Luz, Gas, Agua, etc) */}
                     <td className="px-6 py-4">
                        <div 
                          data-shepherd="service-icons"
                          className="flex items-center gap-1.5">
                           <Zap className={cn("h-3.5 w-3.5", p?.has_luz ? "text-amber-500" : "text-gray-200")} />
                           <Flame className={cn("h-3.5 w-3.5", p?.has_gas ? "text-orange-500" : "text-gray-200")} />
                           <Droplets className={cn("h-3.5 w-3.5", p?.has_agua ? "text-blue-500" : "text-gray-200")} />
                           <FileText className={cn("h-3.5 w-3.5", p?.has_expensas ? "text-purple-500" : "text-gray-200")} />
                        </div>
                     </td>

                     <td className="px-6 py-4">
                       <span className={cn(
                         "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                         p?.status === 'DISPONIBLE' && "bg-green-50 text-green-700 border border-green-100",
                         p?.status === 'ALQUILADA' && "bg-blue-50 text-blue-700 border border-blue-100",
                         ["VENTA","RESERVADA","VENDIDA"].includes(p?.status) && "bg-amber-50 text-amber-700 border border-amber-100",
                       )}>
                         {p?.status || 'SIN ESTADO'}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-renta-900 font-bold">
                       ${Number(p?.valor_alquiler || 0).toLocaleString('es-AR')}
                     </td>
                     <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1.5">
                         {/* Booster Button — Solo para propiedades DISPONIBLE o VENTA */}
                         {['DISPONIBLE', 'VENTA'].includes(p?.status) && (
                           <button 
                             data-shepherd="booster-action"
                             onClick={() => setBoosterModal({ uid: p?.uid_prop, direccion: p?.direccion })}
                             title="Asignar puntos de visibilidad"
                             className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all hover:scale-110"
                           >
                             <Rocket className="h-4 w-4" />
                           </button>
                         )}
                         <button 
                           data-shepherd="contact-action"
                           title="Click para llamar (E.164)"
                           className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                         >
                           <Phone className="h-4 w-4" />
                         </button>
                         <button 
                           onClick={() => navigate(`/propiedades/${p?.uid_prop}`)}
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

      {/* ── Modal: Asignar Puntos ── */}
      {boosterModal && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md my-auto overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-renta-950 to-renta-800 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg">
                  <Rocket className="h-5 w-5 text-amber-950" />
                </div>
                <div>
                  <h3 className="text-white font-bold font-jakarta">Asignar Puntos Booster</h3>
                  <p className="text-white/60 text-[10px] uppercase tracking-wider">Visibilidad Premium</p>
                </div>
              </div>
              <button onClick={() => setBoosterModal(null)} className="text-white/50 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="bg-renta-50 rounded-xl p-4 border border-admin-border-subtle">
                <p className="text-[10px] font-bold text-renta-400 uppercase tracking-widest mb-1">Propiedad Seleccionada</p>
                <p className="text-sm font-bold text-renta-950 flex items-center gap-2">
                  <Home className="h-4 w-4 text-renta-400" /> {boosterModal.direccion}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-renta-600 uppercase tracking-widest">Puntos a Asignar</label>
                <input 
                  type="number"
                  min={1}
                  value={boosterPuntos}
                  onChange={(e) => setBoosterPuntos(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl border border-admin-border px-4 py-3 text-2xl font-black font-jakarta text-renta-950 outline-none focus:ring-2 focus:ring-amber-400 text-center"
                />
                <p className="text-[10px] text-renta-400 text-center">
                  Se descontarán del balance total de su inmobiliaria.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button 
                onClick={() => setBoosterModal(null)}
                className="flex-1 py-3 rounded-xl border border-admin-border text-sm font-bold text-renta-600 hover:bg-renta-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAssignPoints}
                disabled={isAssigning || boosterPuntos <= 0}
                className="flex-1 py-3 rounded-xl bg-amber-400 text-amber-950 text-sm font-bold hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAssigning ? 'Asignando...' : (
                  <><Rocket className="h-4 w-4" /> Aplicar Booster</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
