import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { Settings, BellRing, Mail, MessageSquare, Save, ShieldAlert, Globe, RotateCcw, Building2, Lock, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useSWRConfig } from 'swr';
import { useEden } from '@/services/eden';
import { useActiveAddons } from '@/hooks/useActiveAddons';
import { COUNTRY_FLAG, type CountryCode } from '@/types/region';
import { LocalShepherd, type ShepherdStep } from '@/components/shepherd/LocalShepherd';
import { useShepherd } from '@/providers/ShepherdProvider';
import { CountryPhoneSelector } from '@/components/common/CountryPhoneSelector';

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
  const { role, nombre: nombreInmoActual, logo_url: logoInmoActual } = useInmobiliaria();
  const { t, country_code, flag, isAuditOverride, setAuditRegion, config } = useRegion();
  const { resetTour } = useShepherd();
  const { client } = useEden();
  const { mutate } = useSWRConfig();
  const { hasAddon } = useActiveAddons();

  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const canViewConfig = isSuperadmin || isAdmin;
  const canEditConfig = isSuperadmin; // Solo Superadmin guarda cambios técnicos
  
  const hasLogoAddon = hasAddon('Logo Personalizado en Panel');

  const [nombreAgencia, setNombreAgencia] = useState(nombreInmoActual);
  const [logoUrl, setLogoUrl] = useState(logoInmoActual || '');
  const [whatsappActivo, setWhatsappActivo] = useState(true);
  const [emailActivo, setEmailActivo] = useState(true);
  const [telefono, setTelefono] = useState(config.phone_prefix + '1100000000');
  const [errorTelefono, setErrorTelefono] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      configSchema.parse({
        enviar_whatsapp_rollover: whatsappActivo,
        enviar_email_onboarding: emailActivo,
        telefono_agencia: telefono
      });
      setErrorTelefono('');
      
      setIsSaving(true);
      
      // Update Branding if changed
      if (nombreAgencia !== nombreInmoActual || (hasLogoAddon && logoUrl !== logoInmoActual)) {
        const { error } = await client.admin.me.put({ 
          nombre: nombreAgencia,
          ...(hasLogoAddon ? { logo_url: logoUrl } : {})
        });
        if (error) {
          alert("Error al actualizar los datos de la agencia: " + error.value);
          setIsSaving(false);
          return;
        }
        // Force refresh all useInmobiliaria hooks
        mutate('/admin/me');
      }

      setTimeout(() => {
        setIsSaving(false);
        alert(t('config_guardar', 'Configuración guardada correctamente.'));
      }, 500);
    } catch (e) {
       if (e instanceof z.ZodError) {
         setErrorTelefono(e.issues[0]?.message || 'Número inválido.');
       }
       setIsSaving(false);
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

  const shepherdSteps: ShepherdStep[] = [
    {
      target: '[data-shepherd="saas-grace-period"]',
      title: t('tour_sa_saas_title', 'Configuración de Automatizaciones'),
      content: t('tour_sa_saas_desc', 'Desde aquí puede configurar las notificaciones automáticas (Twilio/SendGrid). Habilite o deshabilite el envío de mensajes por WhatsApp e email según las necesidades de su inmobiliaria.'),
      placement: 'bottom',
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <LocalShepherd steps={shepherdSteps} storageKey="enjoy_local_configuracion" />
      <div className="flex items-center justify-between border-b border-admin-border-subtle pb-6">
         <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-renta-950" />
            <h1 
              data-shepherd="saas-grace-period"
              className="text-2xl font-bold text-renta-950 font-jakarta">
              {t('config_titulo', 'Configuración del Búnker')}
            </h1>
         </div>

         {/* Reiniciar Onboarding - Herramienta de Soporte */}
         <button
            onClick={resetTour}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-renta-400 hover:text-renta-950 transition-colors bg-renta-50 px-3 py-1.5 rounded-lg border border-renta-100"
         >
            <RotateCcw className="h-3 w-3" />
            Reiniciar Onboarding
         </button>
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
          BRANDING DE LA AGENCIA
          ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
         <div className="bg-renta-50/50 px-6 py-4 flex items-center justify-between border-b border-admin-border-subtle">
            <h2 className="text-sm font-bold text-renta-950 font-jakarta flex items-center gap-2">
               <Building2 className="h-4 w-4 text-renta-600" />
               {t('config_branding', 'Branding de la Agencia')}
            </h2>
         </div>
         
         <div className="p-6 space-y-8 font-inter">
            {/* Nombre de la Agencia */}
            <div className="space-y-2">
               <label className="text-sm font-bold text-renta-950">
                 {t('config_nombre_agencia', 'Nombre de la Inmobiliaria')}
               </label>
               <input
                 type="text"
                 value={nombreAgencia}
                 onChange={(e) => setNombreAgencia(e.target.value)}
                 placeholder="Ej: Mi Inmobiliaria Prop"
                 className="w-full max-w-md h-10 px-4 rounded-xl border border-admin-border bg-white text-sm text-renta-900 focus:outline-none focus:ring-2 focus:ring-renta-500/20"
               />
               <p className="text-[10px] text-renta-500">
                 {t('config_nombre_agencia_desc', 'Este nombre aparecerá en la barra superior y en todas las comunicaciones oficiales.')}
               </p>
            </div>

            {/* Logo de la Agencia (Protegido por Add-on) */}
            <div className="border-t border-admin-border-subtle pt-6 space-y-4">
               <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-renta-950 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-renta-400" />
                    {t('config_logo', 'Logo de la Agencia')}
                  </label>
                  {!hasLogoAddon && (
                    <Link 
                      to="/marketplace"
                      className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      <Lock className="h-3 w-3" />
                      Add-on Requerido
                    </Link>
                  )}
               </div>

               <div className="flex items-center gap-6">
                  {/* Preview */}
                  <div className={cn(
                    "h-20 w-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-renta-50",
                    hasLogoAddon ? "border-renta-200" : "border-amber-200 opacity-60"
                  )}>
                    {logoUrl ? (
                      <img src={logoUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL || ''}${logoUrl}` : logoUrl} alt="Preview" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-renta-200" />
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                     <div className="relative group max-w-md">
                        <input
                          type="text"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          disabled={!hasLogoAddon}
                          placeholder={hasLogoAddon ? "URL del logo (png, jpg...)" : "Funcionalidad bloqueada"}
                          className={cn(
                            "w-full h-10 px-4 pr-10 rounded-xl border text-sm transition-all",
                            hasLogoAddon 
                              ? "border-admin-border bg-white text-renta-900 focus:ring-2 focus:ring-renta-500/20" 
                              : "border-amber-100 bg-amber-50/30 text-amber-400 cursor-not-allowed"
                          )}
                        />
                        {!hasLogoAddon && (
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                        )}
                     </div>
                     <p className="text-[10px] text-renta-500 leading-relaxed">
                       {hasLogoAddon 
                         ? t('config_logo_desc', 'Ingrese la URL directa de su logo o utilice el uploader de propiedades para generar una. Recomendado: 400x400px fondo transparente.')
                         : t('config_logo_bloqueado', 'Para personalizar el logo en el panel, debe adquirir el add-on "Logo Personalizado en Panel" desde el Marketplace.')}
                     </p>
                     {!hasLogoAddon && (
                       <Link 
                         to="/marketplace"
                         className="inline-flex items-center gap-1.5 text-[10px] font-bold text-renta-600 hover:text-renta-950 underline decoration-renta-200 underline-offset-4"
                       >
                         Explorar Marketplace <ExternalLink className="h-3 w-3" />
                       </Link>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>

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
               <div className="max-w-sm">
                 <CountryPhoneSelector 
                   value={telefono}
                   onChange={setTelefono}
                 />
               </div>
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
