import { useState } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { Settings, BellRing, Mail, MessageSquare, Save, ShieldAlert, Globe, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { COUNTRY_FLAG, type CountryCode } from '@/types/region';

const configSchema = z.object({
  enviar_whatsapp_rollover: z.boolean(),
  enviar_email_onboarding: z.boolean(),
  telefono_agencia: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Debe cumplir formato E.164 (Ej: +5491112345678)"),
});

const ALL_REGIONS: CountryCode[] = ['AR', 'MX', 'US'];
const REGION_NAMES: Record<CountryCode, string> = {
  AR: 'Argentina',
  MX: 'México',
  US: 'United States',
};

export function ConfiguracionPage() {
  const { role } = useInmobiliaria();
  const { t, country_code, flag, isAuditOverride, setAuditRegion, config } = useRegion();
  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const canViewConfig = isSuperadmin || isAdmin;
  const canEditConfig = isSuperadmin; // Solo Superadmin guarda cambios técnicos

  const [whatsappActivo, setWhatsappActivo] = useState(true);
  const [emailActivo, setEmailActivo] = useState(true);
  const [telefono, setTelefono] = useState(config.phone_prefix + '1100000000');
  const [errorTelefono, setErrorTelefono] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    try {
      configSchema.parse({
        enviar_whatsapp_rollover: whatsappActivo,
        enviar_email_onboarding: emailActivo,
        telefono_agencia: telefono
      });
      setErrorTelefono('');
      
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        alert(t('config_guardar', 'Configuración maestra de Notificaciones (Twilio/SendGrid) guardada para la Inmobiliaria.'));
      }, 1000);
    } catch (e) {
       if (e instanceof z.ZodError) {
         setErrorTelefono(e.issues[0]?.message || 'Número inválido.');
       }
    }
  };

  if (!canViewConfig) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold font-jakarta text-renta-950">
          {t('config_acceso_bloqueado', 'Acceso Configuración Bloqueado')}
        </h2>
        <p className="text-sm font-inter text-renta-600">
          {t('config_solo_superadmin', 'Solo perfiles con permisos de gestión pueden visualizar los parámetros operativos.')}
        </p>
      </div>
    );
  }

  const isDev = import.meta.env.DEV;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-3 border-b border-admin-border-subtle pb-6">
         <Settings className="h-6 w-6 text-renta-950" />
         <h1 
           data-joyride="saas-grace-period"
           className="text-2xl font-bold text-renta-950 font-jakarta">
           {t('config_titulo', 'Configuración del Búnker')}
         </h1>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODO AUDITORÍA REGIONAL — Solo visible en development (NODE_ENV)
          Directiva CTO: Permitir conmutar entre dialectos .md sin alterar 
          el Master Filter de la inmobiliaria.
          ══════════════════════════════════════════════════════════════════ */}
      {isDev && (
        <div className={cn(
          "rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-300",
          isAuditOverride 
            ? "border-amber-400 bg-amber-50/30" 
            : "border-renta-200 bg-white"
        )}>
          {/* Header */}
          <div className="bg-gradient-to-r from-renta-950 to-renta-800 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-jakarta flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-renta-400" />
              {t('config_region_titulo', 'Modo Auditoría Regional')}
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                DEV ONLY
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-lg">{flag}</span>
              <span className="text-xs font-bold text-white/70">{country_code}</span>
            </div>
          </div>

          <div className="p-6 space-y-6 font-inter">
            {/* Description */}
            <p className="text-xs text-renta-600 leading-relaxed max-w-2xl">
              {t('config_region_desc', 'Simule la experiencia de usuario para diferentes países. Este cambio solo afecta la capa de presentación (textos, moneda, formato). No altera el Master Filter ni los datos reales.')}
            </p>

            {/* Region Selector Grid */}
            <div className="grid grid-cols-3 gap-3">
              {ALL_REGIONS.map((regionCode) => {
                const isActive = country_code === regionCode;
                const regionFlag = COUNTRY_FLAG[regionCode];
                return (
                  <button
                    key={regionCode}
                    onClick={() => setAuditRegion(regionCode)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]",
                      isActive
                        ? "border-renta-500 bg-renta-50 shadow-md shadow-renta-200/30"
                        : "border-admin-border bg-white hover:border-renta-300 hover:shadow-sm"
                    )}
                  >
                    <span className="text-3xl">{regionFlag}</span>
                    <span className={cn(
                      "text-sm font-bold",
                      isActive ? "text-renta-950" : "text-renta-600"
                    )}>
                      {regionCode}
                    </span>
                    <span className="text-[10px] text-renta-500">{REGION_NAMES[regionCode]}</span>
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-renta-500 border-2 border-white shadow-sm flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Regional Info Panel */}
            <div className="bg-renta-50/50 rounded-xl border border-admin-border-subtle p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-renta-500">
                {t('config_region_actual', 'Región Activa')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-renta-400">Moneda:</span>
                  <p className="font-bold text-renta-900">{config.currency_code} ({config.currency_symbol})</p>
                </div>
                <div>
                  <span className="text-renta-400">Locale:</span>
                  <p className="font-bold text-renta-900">{config.currency_locale}</p>
                </div>
                <div>
                  <span className="text-renta-400">ID Fiscal:</span>
                  <p className="font-bold text-renta-900">{config.id_label}</p>
                </div>
                <div>
                  <span className="text-renta-400">Tel. Prefijo:</span>
                  <p className="font-bold text-renta-900">{config.phone_prefix}</p>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            {isAuditOverride && (
              <button
                onClick={() => setAuditRegion(null)}
                className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-lg transition-colors border border-amber-200"
              >
                <RotateCcw className="h-3 w-3" />
                {t('config_region_reset', 'Restablecer a TLD Real')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONFIGURACIÓN DE NOTIFICACIONES (Twilio & SendGrid) — Original
          ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
         <div className="bg-renta-50/50 px-6 py-4 flex items-center justify-between border-b border-admin-border-subtle">
            <h2 className="text-sm font-bold text-renta-950 font-jakarta flex items-center gap-2">
               <BellRing className="h-4 w-4 text-renta-600" />
               {t('config_motor', 'Motor de Automatización (Twilio & SendGrid)')}
            </h2>
         </div>
         
         <div className="p-6 space-y-8 font-inter">
            {/* Twilio WhatsApp */}
            <div className="flex items-start justify-between gap-6">
               <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-renta-950 flex items-center gap-2">
                     <MessageSquare className="h-4 w-4 text-emerald-500" />
                     {t('config_whatsapp', 'WhatsApp Automático por Rollover')}
                  </h3>
                  <p className="text-xs text-renta-600 leading-relaxed max-w-xl">
                     {t('config_whatsapp_desc', 'El sistema enviará de forma autónoma notificaciones a inquilinos si registran saldos adeudados (morosidad) tras ejecutarse el Rollover Mensual en el módulo de Cobranzas.')}
                  </p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={whatsappActivo} onChange={e => setWhatsappActivo(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
               </label>
            </div>

            {/* Email SendGrid */}
            <div className="flex items-start justify-between gap-6 border-t border-admin-border-subtle pt-6">
               <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-renta-950 flex items-center gap-2">
                     <Mail className="h-4 w-4 text-renta-500" />
                     {t('config_email', 'Email de Onboarding Tenant')}
                  </h3>
                  <p className="text-xs text-renta-600 leading-relaxed max-w-xl">
                     {t('config_email_desc', 'Envía las credenciales y el mini-portal de inquilinos de manera automática a los nuevos actores registrados en el sistema.')}
                  </p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={emailActivo} onChange={e => setEmailActivo(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-renta-600"></div>
               </label>
            </div>

            {/* E164 Input */}
            <div className="border-t border-admin-border-subtle pt-6 space-y-2">
               <label className="text-sm font-bold text-renta-950">
                 {t('config_telefono', 'Teléfono Corporativo para respuestas (WS/SMS)')}
               </label>
               <input 
                 type="text"
                 value={telefono}
                 onChange={e => setTelefono(e.target.value)}
                 className={cn(
                   "w-full max-w-sm rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 bg-admin-surface",
                   errorTelefono ? "border-red-400 focus:border-red-500" : "border-admin-border focus:border-renta-400"
                 )}
               />
               {errorTelefono && <p className="text-[10px] text-red-500 font-medium">{errorTelefono}</p>}
               <p className="text-[10px] text-renta-500">
                 {t('config_telefono_e164', 'Es obligatorio utilizar el estándar E.164.')} {t('config_telefono_e164', '')} Ejemplo: {config.phone_prefix}12345678.
               </p>
            </div>

         </div>
         
         {/* Footer Action */}
          <div className="bg-admin-surface-hover border-t border-admin-border-subtle px-6 py-4 flex items-center justify-between">
            {!canEditConfig && (
              <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                {t('config_admin_readonly', 'Modo Lectura: Solo el Superadmin puede modificar estas claves.')}
              </p>
            )}
            <button
               onClick={handleSave}
               disabled={isSaving || !canEditConfig}
               className="flex items-center gap-2 bg-renta-950 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-renta-800 transition-colors shadow-lg shadow-renta-950/20 disabled:opacity-50"
            >
               {isSaving ? t('config_guardando', 'Guardando...') : <><Save className="h-4 w-4" /> {t('config_guardar', 'Guardar Preferencias')}</>}
            </button>
          </div>
      </div>
    </div>
  );
}
