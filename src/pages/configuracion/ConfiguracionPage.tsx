import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { toast } from 'sonner';
import { Settings, BellRing, Mail, MessageSquare, Save, ShieldAlert, Globe, RotateCcw, Building2, Lock, Image as ImageIcon, ExternalLink, UploadCloud, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useSWRConfig } from 'swr';
import { useEden, BASE_URL } from '@/services/eden';
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
  const { client, token } = useEden();
  const { mutate } = useSWRConfig();
  const { hasAddon } = useActiveAddons();

  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const canViewConfig = isSuperadmin || isAdmin;
  const canEditConfig = isSuperadmin; // Solo Superadmin guarda cambios técnicos
  
  // NOTA: El add-on "Logo Personalizado en Panel" solo controla si el logo
  // se muestra en el Sidebar/Topbar. En Configuración siempre se permite
  // cargar/configurar el logo aunque no se tenga el add-on.
  // Ver Sidebar.tsx y Topbar.tsx para la lógica de visualización condicional.
  const hasLogoAddon = hasAddon('Logo Personalizado en Panel');



  const [nombreAgencia, setNombreAgencia] = useState(nombreInmoActual);
  const [logoUrl, setLogoUrl] = useState(logoInmoActual || '');
  const [whatsappActivo, setWhatsappActivo] = useState(false);
  const [emailActivo, setEmailActivo] = useState(false);
  const [telefono, setTelefono] = useState(config.phone_prefix);
  const [errorTelefono, setErrorTelefono] = useState('');

  // Cargar configuración de notificaciones desde la API
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const { data: response } = await client.admin.me.get();
        if (response?.success && response.data) {
          const d = response.data;
          setWhatsappActivo(d.enviar_whatsapp_rollover ?? false);
          setEmailActivo(d.enviar_email_onboarding ?? false);
          setTelefono(d.twilio_phone || config.phone_prefix);
        }
      } catch (err) {
        console.warn('[Config] Error cargando configuración:', err);
      }
    };
    cargarConfig();
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  // ── Logo uploader states ──
  const [logoSelectedFile, setLogoSelectedFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileSelect = useCallback((file: File) => {
    setLogoError(null);
    if (!file.type.startsWith('image/')) {
      setLogoError('Solo se permiten imágenes (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('La imagen no debe superar los 5MB');
      return;
    }
    setLogoSelectedFile(file);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoPreviewUrl(URL.createObjectURL(file));
  }, [logoPreviewUrl]);

  const onLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleLogoFileSelect(e.target.files[0]);
    e.target.value = '';
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleLogoFileSelect(e.dataTransfer.files[0]);
  };

  const clearLogoSelection = () => {
    setLogoSelectedFile(null);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoPreviewUrl(null);
    setLogoError(null);
  };

  const handleLogoUpload = async () => {
    if (!logoSelectedFile) return;
    setIsLogoUploading(true);
    setLogoError(null);
    const region = localStorage.getItem('zonatia_audit_region') || 'AR';
    try {
      const formData = new FormData();
      formData.append('file', logoSelectedFile);
      formData.append('folder', 'logos');
      const response = await fetch(`${BASE_URL}/api/v1/admin/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-region': region,
        },
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al subir el archivo');
      }
      const uploadRes = await response.json();
      if (!uploadRes?.url) throw new Error('No se recibió la URL del archivo');
      setLogoUrl(uploadRes.url);
      setLogoSelectedFile(null);
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
      toast.success('Logo subido correctamente. No olvides guardar los cambios.');
    } catch (err: any) {
      setLogoError(err.message || 'Error inesperado');
    } finally {
      setIsLogoUploading(false);
    }
  };

  // Sincronizar el estado local cuando los datos de la API se carguen asincrónicamente
  useEffect(() => {
    if (logoInmoActual) {
      setLogoUrl(logoInmoActual);
    }
  }, [logoInmoActual]);

  const handleSave = async () => {
    try {
      configSchema.parse({
        enviar_whatsapp_rollover: whatsappActivo,
        enviar_email_onboarding: emailActivo,
        telefono_agencia: telefono
      });
      setErrorTelefono('');
      
      setIsSaving(true);
      
      // Actualizar branding y configuración de notificaciones TODO junto
      const payload: Record<string, any> = {};
      
      if (nombreAgencia !== nombreInmoActual) payload.nombre = nombreAgencia;
      if (logoUrl !== logoInmoActual) payload.logo_url = logoUrl || null;
      
      // Siempre enviar las preferencias de notificación (vienen de los toggles)
      payload.enviar_whatsapp_rollover = whatsappActivo;
      payload.enviar_email_onboarding = emailActivo;
      payload.twilio_phone = telefono;
      
      const { error } = await client.admin.me.put(payload);

      if (error) {
        toast.error("Error al guardar la configuración: " + error.value);
        setIsSaving(false);
        return;
      }
      
      // Force refresh all useInmobiliaria hooks
      mutate('/admin/me');

      setTimeout(() => {
        setIsSaving(false);
        toast.success(t('config_guardar', 'Configuración guardada correctamente.'));
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
          "rounded-2xl border-2 border-dashed transition-all duration-300",
          isAuditOverride 
            ? "border-amber-400 bg-amber-50/30" 
            : "border-renta-200 bg-white"
        )}>
          {/* Header */}
          <div className="bg-gradient-to-r from-renta-950 to-renta-800 px-6 py-4 flex items-center justify-between rounded-t-[14px]">
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
            <div className="bg-renta-50/50 rounded-xl ring-1 ring-inset ring-admin-border border-transparent-subtle p-4 space-y-2">
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
      <div className="bg-white rounded-2xl ring-1 ring-inset ring-admin-border border-transparent shadow-sm">
         <div className="bg-renta-50/50 px-6 py-4 flex items-center justify-between border-b border-admin-border-subtle rounded-t-2xl">
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
                 className="w-full max-w-md h-10 px-4 rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white text-sm text-renta-900 focus:outline-none focus:ring-2 focus:ring-renta-500/20"
               />
               <p className="text-[10px] text-renta-500">
                 {t('config_nombre_agencia_desc', 'Este nombre aparecerá en la barra superior y en todas las comunicaciones oficiales.')}
               </p>
            </div>

            {/* Logo de la Agencia — Siempre editable. 
                El add-on "Logo Personalizado en Panel" solo controla 
                si se muestra en Sidebar/Topbar (ver Sidebar.tsx y Topbar.tsx) */}
            <div className="border-t border-admin-border-subtle pt-6 space-y-4">
               <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-renta-950 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-renta-400" />
                    {t('config_logo', 'Logo de la Agencia')}
                  </label>
                  {!hasLogoAddon && (
                    <Link 
                      to="/marketplace"
                      className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-renta-500 bg-renta-50 px-2.5 py-1 rounded-full border border-renta-200 hover:bg-renta-100 transition-colors"
                    >
                      <Lock className="h-3 w-3" />
                      No visible en Panel
                    </Link>
                  )}
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-6">
                     <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-renta-200 flex items-center justify-center overflow-hidden bg-renta-50 shrink-0">
                       {logoSelectedFile || logoPreviewUrl ? (
                         <img src={logoPreviewUrl || logoUrl} alt="Preview" className="h-full w-full object-contain" />
                       ) : logoUrl ? (
                         <img src={logoUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL || ''}${logoUrl}` : logoUrl} alt="Preview" className="h-full w-full object-contain" />
                       ) : (
                         <ImageIcon className="h-8 w-8 text-renta-200" />
                       )}
                     </div>
                     {!logoSelectedFile && (
                        <p className="text-[10px] text-renta-500 leading-relaxed">
                          Subí el logo de tu agencia desde tu computadora.{' '}
                          {!hasLogoAddon && (
                            <>El logo se guarda en la base de datos, pero para que se muestre en el panel (
                            <Link to="/marketplace" className="text-renta-600 hover:text-renta-950 underline underline-offset-2">
                              adquirir add-on
                            </Link>
                            ) "Logo Personalizado en Panel".</>
                          )}
                        </p>
                     )}
                  </div>
                  {!logoSelectedFile && !logoPreviewUrl ? (
                     <div
                       className={cn(
                         'relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer max-w-md',
                         isDragging
                           ? 'border-renta-500 bg-renta-50'
                           : 'border-admin-border bg-white hover:bg-renta-50/50'
                       )}
                       onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                       onDragLeave={() => setIsDragging(false)}
                       onDrop={handleLogoDrop}
                       onClick={() => fileInputRef.current?.click()}
                     >
                       <input
                         type="file"
                         accept="image/*"
                         className="hidden"
                         ref={fileInputRef}
                         onChange={onLogoFileChange}
                       />
                       <div className="h-10 w-10 rounded-full bg-renta-100 flex items-center justify-center mb-2">
                         <UploadCloud className="h-5 w-5 text-renta-600" />
                       </div>
                       <p className="text-xs font-semibold text-renta-950">
                         Arrastrá tu logo aquí
                       </p>
                       <p className="text-[10px] text-renta-500 mt-0.5">
                         o hacé clic para seleccionar (JPG, PNG, WebP. Max 5MB)
                       </p>
                     </div>
                  ) : (
                     <div className="flex items-center gap-3 max-w-md">
                        <button
                          type="button"
                          onClick={clearLogoSelection}
                          disabled={isLogoUploading}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-renta-600 bg-renta-50 rounded-xl hover:bg-renta-100 transition-colors disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          Cambiar archivo
                        </button>
                        <button
                          type="button"
                          onClick={handleLogoUpload}
                          disabled={isLogoUploading || !logoSelectedFile}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-renta-600 to-renta-700 rounded-xl hover:from-renta-700 hover:to-renta-800 transition-all disabled:opacity-60"
                        >
                          {isLogoUploading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-3 w-3" />
                              Subir Logo
                            </>
                          )}
                        </button>
                     </div>
                  )}
                  {logoError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200 max-w-md">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{logoError}</p>
                    </div>
                  )}
               </div>
            </div>

         </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CONFIGURACIÓN DE NOTIFICACIONES (Twilio & SendGrid) — Original
          ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl ring-1 ring-inset ring-admin-border border-transparent shadow-sm">
         <div className="bg-renta-50/50 px-6 py-4 flex items-center justify-between border-b border-admin-border-subtle rounded-t-2xl">
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
          <div className="bg-admin-surface-hover border-t border-admin-border-subtle px-6 py-4 flex items-center justify-between rounded-b-2xl">
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
