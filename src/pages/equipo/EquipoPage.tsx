import { useState, useEffect } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import {
  Plus,
  Search,
  UsersRound,
  Edit2,
  Trash2,
  ShieldCheck,
  Briefcase,
  Shield,
  MoreVertical,
  Mail,
  Phone,
  UserX,
  UserCheck as UserCheckIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MiembroForm, type MiembroData } from '@/components/equipo/MiembroForm';
import type { UserRole } from '@/hooks/useInmobiliaria';
import { LocalShepherd, type ShepherdStep } from '@/components/shepherd/LocalShepherd';
import { useEden } from '@/services/eden';
import { toast } from 'sonner';

const ROLE_META = {
  superadmin: {
    label: 'Superadmin',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Shield,
  },
  admin: {
    label: 'Administrador',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ShieldCheck,
  },
  vendedor: {
    label: 'Vendedor',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Briefcase,
  },
};

export function EquipoPage() {
  const { hasPermission, role: currentRole } = useInmobiliaria();
  const { t } = useRegion();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<MiembroData | null>(null);
  const [filterRole, setFilterRole] = useState<UserRole | 'todos'>('todos');
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<MiembroData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const eden = useEden();

  const fetchEquipo = async () => {
    setIsLoading(true);
    try {
        const { data, error } = await eden.admin.equipo.get();
        if (error) {
            toast.error('No se pudo cargar el equipo');
        } else {
            setMiembros(data.data as MiembroData[]);
        }
    } catch (err) {
        toast.error('Error al conectar con el servidor');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipo();
  }, [eden]);

  const equipo = miembros.filter((m) => {
    const matchesSearch =
      m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'todos' || m.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Stats
  const totalAdmins = miembros.filter((m) => m.role === 'admin' || m.role === 'superadmin').length;
  const totalVendedores = miembros.filter((m) => m.role === 'vendedor').length;
  const totalActivos = miembros.filter((m) => m.estado === 'activo').length;

  const shepherdSteps: ShepherdStep[] = [
    {
      target: '[data-shepherd="equipo-header"]',
      title: t('tour_equipo_header_title', 'Su Equipo'),
      content: t('tour_equipo_header_desc', 'Desde aquí podrá gestionar todos los agentes inmobiliarios y administradores afiliados a su franquicia. Tenga en cuenta que un Vendedor de la sucursal 1 NO verá data de la sucursal 2 (Master Filter).'),
      placement: 'bottom',
    },
    {
      target: '[data-shepherd="equipo-kpis"]',
      title: t('tour_equipo_kpis_title', 'Estado de la Fuerza de Ventas'),
      content: t('tour_equipo_kpis_desc', 'Métricas rápidas que muestran cuántos colaboradores tienen acceso activo a su plataforma, divididos por el rol asignado.'),
      placement: 'bottom',
    },
    {
      target: '[data-shepherd="btn-nuevo-miembro"]',
      title: t('tour_equipo_invite_title', 'Reclutamiento Rápido'),
      content: t('tour_equipo_invite_desc', 'Haga clic aquí para enviar una invitación de onboarding por email a su nuevo vendedor o administrador. Ellos cargarán sus propios datos y contraseña.'),
      placement: 'left',
    }
  ];

  return (
    <div className="space-y-6">
      <LocalShepherd steps={shepherdSteps} storageKey="enjoy_local_equipo" />
      {/* ── Header ── */}
      <div 
        data-shepherd="equipo-header"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up"
      >
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">
            {t('equipo_titulo', 'Gestión de Equipo')}
          </h1>
          <p className="text-sm text-renta-600 font-inter mt-1">
            {t('equipo_subtitulo', 'Administra los miembros de tu inmobiliaria: administradores y vendedores.')}
          </p>
        </div>

        {hasPermission(['superadmin', 'admin']) && (
          <button
            data-shepherd="btn-nuevo-miembro"
            onClick={() => {
              setEditingData(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-renta-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-renta-950/20 transition-all hover:bg-renta-800 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            {t('equipo_nuevo', 'Nuevo Miembro')}
          </button>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div
        data-shepherd="equipo-kpis"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex items-center gap-4 rounded-2xl border border-admin-border bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-renta-400">
              {t('equipo_kpi_admins', 'Administradores')}
            </p>
            <p className="text-xl font-bold text-renta-950 font-jakarta">{totalAdmins}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-admin-border bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200">
            <Briefcase className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-renta-400">
              {t('equipo_kpi_vendedores', 'Vendedores')}
            </p>
            <p className="text-xl font-bold text-renta-950 font-jakarta">{totalVendedores}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-admin-border bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
            <UserCheckIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-renta-400">
              {t('equipo_kpi_activos', 'Activos')}
            </p>
            <p className="text-xl font-bold text-renta-950 font-jakarta">
              {totalActivos}
              <span className="text-sm font-medium text-renta-400 ml-1">/ {miembros.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in-up"
        style={{ animationDelay: '160ms' }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-renta-400" />
          <input
            type="text"
            placeholder={t('equipo_buscar', 'Buscar por nombre o email...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-admin-border bg-white pl-10 pr-4 py-2 text-sm text-renta-900 placeholder:text-renta-400 focus:border-renta-300 focus:ring-1 focus:ring-renta-200 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['todos', 'admin', 'vendedor'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterRole(filter)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                filterRole === filter
                  ? 'bg-renta-950 text-white border-renta-950 shadow-sm'
                  : 'bg-white text-renta-600 border-admin-border hover:border-renta-300 hover:text-renta-900'
              )}
            >
              {filter === 'todos'
                ? t('equipo_filtro_todos', 'Todos')
                : filter === 'admin'
                  ? t('equipo_filtro_admins', 'Admins')
                  : t('equipo_filtro_vendedores', 'Vendedores')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Data Table ── */}
      <div
        className="rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden animate-fade-in-up"
        style={{ animationDelay: '240ms' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-inter">
            <thead className="bg-renta-50/50 text-renta-600 border-b border-admin-border">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('equipo_th_miembro', 'Miembro')}</th>
                <th className="px-6 py-4 font-semibold">{t('equipo_th_rol', 'Rol')}</th>
                <th className="px-6 py-4 font-semibold">{t('equipo_th_contacto', 'Contacto')}</th>
                <th className="px-6 py-4 font-semibold">{t('equipo_th_estado', 'Estado')}</th>
                <th className="px-6 py-4 font-semibold">{t('equipo_th_alta', 'Fecha de Alta')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('equipo_th_acciones', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 text-renta-400 animate-spin mb-2" />
                    <p className="text-sm text-renta-500">Cargando equipo real...</p>
                  </td>
                </tr>
              ) : equipo.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-renta-500">
                    <UsersRound className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    {t('equipo_vacio', 'No se encontraron miembros del equipo.')}
                  </td>
                </tr>
              ) : (
                equipo.map((m) => {
                  const roleMeta = ROLE_META[m.role];
                  const RoleIcon = roleMeta.icon;
                  return (
                    <tr key={m.id} className="hover:bg-admin-surface-hover transition-colors group">
                      {/* Miembro */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-renta-200 to-renta-300 text-sm font-bold text-renta-800">
                            {m.nombre
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-renta-950">{m.nombre}</p>
                            <p className="text-[11px] text-renta-500">{m.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                            roleMeta.badgeClass
                          )}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* Contacto */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-renta-700">
                            <Phone className="h-3 w-3 text-renta-400" />
                            {m.celular}
                          </span>
                          <span className="flex items-center gap-1.5 text-renta-500 text-xs">
                            <Mail className="h-3 w-3 text-renta-300" />
                            {m.email}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                            m.estado === 'activo'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-50 text-gray-500 border border-gray-200'
                          )}
                        >
                          {m.estado === 'activo' ? (
                            <UserCheckIcon className="h-3 w-3" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          {m.estado === 'activo'
                            ? t('equipo_estado_activo', 'Activo')
                            : t('equipo_estado_inactivo', 'Inactivo')}
                        </span>
                      </td>

                      {/* Fecha de Alta */}
                      <td className="px-6 py-4 text-renta-600">
                        {m.fecha_alta
                          ? new Date(m.fecha_alta).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingData(m);
                              setIsFormOpen(true);
                            }}
                            className="p-2 text-renta-400 hover:text-renta-700 hover:bg-renta-50 rounded-lg transition-colors"
                            title={t('equipo_accion_editar', 'Editar')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {hasPermission(['superadmin']) && (
                            <button
                              className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('equipo_accion_eliminar', 'Eliminar')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setContextMenu(contextMenu === m.id ? null : m.id!)}
                            className="p-2 text-renta-300 hover:text-renta-600 hover:bg-renta-50 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Context Menu */}
                          {contextMenu === m.id && (
                            <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-admin-border rounded-xl shadow-lg py-1 min-w-[180px] animate-fade-in">
                              <button
                                onClick={() => setContextMenu(null)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-renta-700 hover:bg-renta-50 transition-colors"
                              >
                                {m.estado === 'activo' ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5" />
                                    {t('equipo_accion_desactivar', 'Desactivar Cuenta')}
                                  </>
                                ) : (
                                  <>
                                    <UserCheckIcon className="h-3.5 w-3.5" />
                                    {t('equipo_accion_activar', 'Reactivar Cuenta')}
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setContextMenu(null)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-renta-700 hover:bg-renta-50 transition-colors"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                {t('equipo_accion_reenviar', 'Reenviar Invitación')}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Permisos Info ── */}
      <div
        className="rounded-2xl border border-admin-border-subtle bg-renta-50/30 p-5 animate-fade-in-up"
        style={{ animationDelay: '320ms' }}
      >
        <h3 className="text-xs font-bold text-renta-700 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          {t('equipo_permisos_titulo', 'Matriz de Permisos por Rol')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-inter">
          <div className="bg-white rounded-xl border border-purple-100 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-purple-600" />
              <span className="font-bold text-purple-700">Superadmin</span>
            </div>
            <ul className="space-y-1 text-renta-600 text-[11px]">
              <li>✓ Configuración técnica (API Keys)</li>
              <li>✓ Gestión completa del equipo</li>
              <li>✓ Marketplace y Boosters</li>
              <li>✓ Acceso total al Búnker</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-bold text-amber-700">Administrador</span>
            </div>
            <ul className="space-y-1 text-renta-600 text-[11px]">
              <li>✓ Propiedades, Contratos, Cobranzas</li>
              <li>✓ Inquilinos y Propietarios</li>
              <li>✓ Marketplace (adquisición)</li>
              <li>✗ Sin acceso a Configuración</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-blue-100 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-bold text-blue-700">Vendedor</span>
            </div>
            <ul className="space-y-1 text-renta-600 text-[11px]">
              <li>✓ Propiedades asignadas</li>
              <li>✓ Contratos y Propietarios</li>
              <li>✗ Sin Cobranzas ni Inquilinos</li>
              <li>✗ Sin Marketplace</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Modal Form ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-renta-950/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <MiembroForm
              initialData={editingData}
              onCancel={() => setIsFormOpen(false)}
              onSuccess={() => {
                setIsFormOpen(false);
                fetchEquipo();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
