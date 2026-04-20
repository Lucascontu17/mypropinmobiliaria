import { useState } from 'react';
import { useRegion } from '@/hooks/useRegion';
import { X, Save, UserPlus, Shield, ShieldCheck, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { CountryPhoneSelector } from '../common/CountryPhoneSelector';
import type { UserRole } from '@/hooks/useInmobiliaria';

const miembroSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
  celular: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Formato E.164 requerido (Ej: +5491112345678)'),
  role: z.enum(['admin', 'vendedor']),
});

export interface MiembroData {
  id?: string;
  nombre: string;
  email: string;
  celular: string;
  role: UserRole;
  estado?: 'activo' | 'inactivo';
  fecha_alta?: string;
}

interface MiembroFormProps {
  initialData?: MiembroData | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string; icon: React.ElementType; color: string }[] = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso total excepto configuración técnica. Gestiona propiedades, cobranzas e inquilinos.',
    icon: ShieldCheck,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    value: 'vendedor',
    label: 'Vendedor',
    description: 'Acceso limitado a propiedades, contratos y propietarios asignados.',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
];

export function MiembroForm({ initialData, onCancel, onSuccess }: MiembroFormProps) {
  const { t, config } = useRegion();
  const isEditing = !!initialData?.id;

  const [nombre, setNombre] = useState(initialData?.nombre ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [celular, setCelular] = useState(initialData?.celular ?? config.phone_prefix);
  const [role, setRole] = useState<UserRole>(initialData?.role ?? 'vendedor');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = miembroSchema.safeParse({ nombre, email, celular, role });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    // Simular API call — reemplazar con Eden/SWR
    setTimeout(() => {
      setIsSaving(false);
      onSuccess();
    }, 800);
  };

  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-xl overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-renta-950 to-renta-800 px-6 py-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-white font-jakarta flex items-center gap-2.5">
          <UserPlus className="h-5 w-5 text-renta-400" />
          {isEditing
            ? t('equipo_form_editar', 'Editar Miembro del Equipo')
            : t('equipo_form_nuevo', 'Nuevo Miembro del Equipo')}
        </h2>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 font-inter">
        {/* Selector de Rol */}
        <div data-shepherd="form-rol" className="space-y-3">
          <label className="text-sm font-bold text-renta-950 flex items-center gap-2">
            <Shield className="h-4 w-4 text-renta-600" />
            {t('equipo_form_rol', 'Rol / Jerarquía')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={cn(
                    'relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-[1.01]',
                    isSelected
                      ? 'border-renta-500 bg-renta-50/50 shadow-md shadow-renta-200/30'
                      : 'border-admin-border bg-white hover:border-renta-300 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-lg border', opt.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn('text-sm font-bold', isSelected ? 'text-renta-950' : 'text-renta-700')}>
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-renta-500 leading-relaxed">{opt.description}</p>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-renta-500 border-2 border-white shadow-sm flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {errors.role && <p className="text-[10px] text-red-500 font-medium">{errors.role}</p>}
        </div>

        <div data-shepherd="form-contacto" className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-renta-950">
              {t('equipo_form_nombre', 'Nombre Completo')}
            </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: María García"
            className={cn(
              'w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-1 bg-admin-surface transition-all',
              errors.nombre ? 'border-red-400 focus:border-red-500' : 'border-admin-border focus:border-renta-400'
            )}
          />
          {errors.nombre && <p className="text-[10px] text-red-500 font-medium">{errors.nombre}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-renta-950">
            {t('equipo_form_email', 'Email Corporativo')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maria@inmobiliaria.com"
            className={cn(
              'w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-1 bg-admin-surface transition-all',
              errors.email ? 'border-red-400 focus:border-red-500' : 'border-admin-border focus:border-renta-400'
            )}
          />
          {errors.email && <p className="text-[10px] text-red-500 font-medium">{errors.email}</p>}
          <p className="text-[10px] text-renta-500">
            {t('equipo_form_email_desc', 'Se enviará una invitación por email para unirse al Búnker.')}
          </p>
        </div>

          {/* Celular */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-renta-950">
              {t('equipo_form_celular', 'Celular (E.164)')}
            </label>
            <CountryPhoneSelector 
              value={celular}
              onChange={setCelular}
            />
            {errors.celular && <p className="text-[10px] text-red-500 font-medium">{errors.celular}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-admin-border-subtle pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold text-renta-600 rounded-xl hover:bg-renta-50 transition-colors"
          >
            {t('equipo_form_cancelar', 'Cancelar')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-renta-950 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-renta-800 transition-colors shadow-lg shadow-renta-950/20 disabled:opacity-50"
          >
            {isSaving ? (
              t('equipo_form_guardando', 'Guardando...')
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing
                  ? t('equipo_form_actualizar', 'Actualizar Miembro')
                  : t('equipo_form_crear', 'Crear Miembro')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
