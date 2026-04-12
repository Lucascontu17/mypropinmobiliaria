import { Joyride, type Step, STATUS, ACTIONS, EVENTS, type CallBackProps } from 'react-joyride';
import { useJoyride } from '@/providers/JoyrideProvider';
import { useRegion } from '@/hooks/useRegion';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Mapeo de selectores a rutas de la aplicación.
 */
const getPathForTarget = (target: string): string | null => {
  if (target.includes('saas-grace-period')) return '/configuracion';
  if (target.includes('map-picker-container') || target.includes('gallery-uploader')) return '/propiedades/nueva';
  if (target.includes('btn-cierre-periodo') || target.includes('table-cobranzas')) return '/cobranzas';
  if (target.includes('assigned-catalog') || target.includes('service-icons') || target.includes('contact-action') || target.includes('booster-action')) return '/propiedades';
  if (target.includes('kpi-grid')) return '/';
  if (target.includes('equipo-header') || target.includes('equipo-kpis') || target.includes('btn-nuevo-miembro')) return '/equipo';
  if (target.includes('mkt-balance') || target.includes('mkt-tabs') || target.includes('nav-marketplace')) return '/marketplace';
  if (target.includes('sub-desglose') || target.includes('sub-historial') || target.includes('nav-suscripcion')) return '/suscripcion';
  return null;
};

/**
 * JoyrideWrapper — Componente de inyección del Engine de Joyride.
 * Aplica el estándar visual Luxury Minimalist (Emerald/Teal #102324).
 * Utiliza Plus Jakarta Sans para títulos e Inter para descripciones.
 */
export function JoyrideWrapper() {
  const { run, stepIndex, stopTour, nextStep, prevStep, pauseTour, resumeTour } = useJoyride();
  const { t } = useRegion();
  const { role } = useInmobiliaria();
  const navigate = useNavigate();
  const location = useLocation();

  // Definición de pasos base
  const steps: Step[] = [
    {
      target: '[data-joyride="search-bar"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_search_title', 'Búsqueda Inteligente')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_search_desc', 'Localiza propiedades, inquilinos o contratos en segundos desde cualquier parte del panel.')}
        </div>
      ),
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-joyride="nav-propiedades"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_nav_propiedades_title', 'Gestión de Inventario')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_nav_propiedades_desc', 'Administra tus propiedades, carga carpetas digitales y gestiona estados de disponibilidad.')}
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-joyride="user-profile"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_profile_title', 'Tu Identidad')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_profile_desc', 'Sesión iniciada con rol {{role}}. Todas tus acciones quedan registradas en el Audit Log.').replace('{{role}}', role.toUpperCase())}
        </div>
      ),
      placement: 'bottom',
    },
  ];

  // Pasos específicos para Superadmin
  const superadminSteps: Step[] = [
    {
      target: '[data-joyride="kpi-grid"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sa_kpi_title', 'Centro de Control Financiero')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed font-medium">
          {t('tour_sa_kpi_desc', 'Métricas globales en tiempo real. Observe el estado de su rentabilidad por país, filtrado estrictamente bajo el Master Filter de su franquicia.')}
        </div>
      ),
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-joyride="saas-grace-period"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sa_saas_title', 'Salud SaaS y Días de Gracia')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed font-medium">
          {t('tour_sa_saas_desc', 'Su suscripción cuenta con 7 días de gracia ante expiraciones. Actúe preventivamente para evitar el bloqueo en cascada.')}
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-joyride="nav-marketplace"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950 flex items-center gap-2">
          {t('tour_sa_mkt_title', 'Motor de Crecimiento')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed font-medium">
          {t('tour_sa_mkt_desc', 'Adquiera funciones extra y compre puntos Booster para aumentar la visibilidad de sus propiedades.')}
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-joyride="mkt-balance"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_mkt_balance_title', 'Balance de Puntos')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_mkt_balance_desc', 'Este es el saldo global de puntos de su inmobiliaria. Puede comprar puntos por paquetes o de forma personalizada y luego distribuirlos en las propiedades que desee destacar.')}
        </div>
      ),
      placement: 'left',
    },
    {
      target: '[data-joyride="mkt-tabs"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_mkt_tabs_title', 'Secciones del Marketplace')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_mkt_tabs_desc', 'El Marketplace tiene dos secciones: "Funciones Extra" le permite agregar herramientas premium a su suscripción mensual, y "Comprar Puntos" le permite adquirir créditos de visibilidad para sus propiedades.')}
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-joyride="booster-action"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_booster_title', 'Booster de Propiedades')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_booster_desc', 'Este ícono aparece en propiedades disponibles o en venta. Utilícelo para asignar puntos de visibilidad y posicionar mejor sus activos en el ecosistema MyProp.')}
        </div>
      ),
      placement: 'left',
    },
    {
      target: '[data-joyride="nav-suscripcion"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sub_nav_title', 'Mi Suscripción')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sub_nav_desc', 'Desde aquí puede visualizar el desglose de su próximo pago y el historial completo de transacciones del Marketplace.')}
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-joyride="sub-desglose"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sub_desglose_title', 'Desglose de Facturación')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sub_desglose_desc', 'Aquí verá el total de su próxima cuota: Plan Base más las funciones extra que haya adquirido. Las funciones nuevas se cobran a partir del ciclo siguiente a su activación.')}
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-joyride="sub-historial"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sub_historial_title', 'Historial de Transacciones')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sub_historial_desc', 'Registro cronológico de todas las operaciones realizadas en el Marketplace: compras de puntos, activación de funciones y distribución de puntos a propiedades.')}
        </div>
      ),
      placement: 'left',
    },
    {
      target: '[data-joyride="equipo-header"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_equipo_title', 'Gestión de Equipos')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_equipo_desc', 'Centralice la administración de sus colaboradores. El Búnker le permite delegar responsabilidades manteniendo la soberanía de los datos.')}
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-joyride="equipo-kpis"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_equipo_kpi_title', 'Métricas del Staff')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_equipo_kpi_desc', 'Visualice la distribución de roles y el estado de activación de sus cuentas en tiempo real.')}
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-joyride="btn-nuevo-miembro"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_equipo_nuevo_title', 'Expansión de Fuerza de Venta')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_equipo_nuevo_desc', 'Invite a nuevos Administradores o Vendedores. Recuerde que cada rol tiene permisos granulares predefinidos.')}
        </div>
      ),
      placement: 'left',
    },
    {
      target: '[data-joyride="user-profile"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sa_roles_title', 'Gestión de Jerarquías')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed font-medium">
          <span className="font-playfair italic text-renta-950 block mb-2">{t('tour_sa_welcome', 'Bienvenido, Director.')}</span>
          {t('tour_sa_roles_desc', 'Desde aquí administra su cuenta SUPERADMIN. Mantenga bajo control a sus Vendedores delegando permisos desde El Búnker.')}
        </div>
      ),
      placement: 'bottom',
    },
  ];

  // Pasos específicos para Administradores
  const adminSteps: Step[] = [
    {
      target: '[data-joyride="map-picker-container"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_adm_map_title', 'Precisión Geoespacial')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_adm_map_desc', 'La carga técnica requiere precisión GPS. El Búnker utiliza numeric(10,8) para evitar errores de coma flotante.')}
        </div>
      ),
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-joyride="gallery-uploader"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_adm_docs_title', 'Legajo Digital & E.164')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_adm_docs_desc', 'Cargue documentos mandatorios y valide teléfonos bajo el estándar E.164 para asegurar las notificaciones automáticas vía Twilio.')}
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-joyride="btn-cierre-periodo"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_adm_rollover_title', 'Motor Financiero: Rollover')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed font-semibold">
          {t('tour_adm_rollover_desc', 'El Cierre de Periodo es una acción manual ACID que consolida deudas para el mes N+1.')}
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-joyride="table-cobranzas"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_adm_audit_title', 'Auditoría de Pagos Parciales')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_adm_audit_desc', 'Controle ingresos parciales y saldos a favor desde aquí.')}
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-joyride="equipo-header"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_equipo_title', 'Gestión de Equipos')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_equipo_desc', 'Administre los Vendedores de su sucursal. Asigne propiedades y monitoree el estado de sus cuentas.')}
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-joyride="btn-nuevo-miembro"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_equipo_nuevo_title', 'Alta de Colaboradores')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_equipo_nuevo_desc', 'Como Administrador puede invitar a nuevos Vendedores para potenciar su inmobiliaria.')}
        </div>
      ),
      placement: 'left',
    },
    {
      target: '[data-joyride="user-profile"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_adm_hierarchy_title', 'Identidad Administrativa')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed italic">
          {t('tour_adm_hierarchy_desc', 'Como Administrador, gestionas el corazón operativo. Nota: El Superadmin es una jerarquía inamovible.')}
        </div>
      ),
      placement: 'bottom',
    },
  ];

  // Pasos específicos para Vendedores
  const vendedorSteps: Step[] = [
    {
      target: '[data-joyride="assigned-catalog"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          <span className="font-playfair italic block text-xl mb-1">{t('tour_ven_welcome', 'Bienvenido, Agente.')}</span>
          {t('tour_ven_catalog_title', 'Catálogo de Activos Asignados')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_ven_catalog_desc', 'Desde aquí gestiona únicamente las propiedades bajo su ala. El Master Filter asegura el aislamiento de datos.')}
        </div>
      ),
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-joyride="service-icons"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_ven_services_title', 'Monitoreo de Servicios (Luz/Gas/Agua)')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed font-medium">
          {t('tour_ven_services_desc', 'Actúe como monitor preventivo antes de los vencimientos.')}
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-joyride="contact-action"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_ven_contact_title', 'Gestión de Contacto Directo')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_ven_contact_desc', 'Dispare llamadas o chats instantáneos usando el estándar E.164.')}
        </div>
      ),
      placement: 'left',
    },
  ];

  // Selección lógica de pasos basada en el rol (Seguridad RBAC)
  const finalSteps = role === 'superadmin' ? superadminSteps : (role === 'admin' ? adminSteps : (role === 'vendedor' ? vendedorSteps : steps));

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      stopTour();
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      const isNext = action === ACTIONS.NEXT;
      const nextIndex = isNext ? index + 1 : index - 1;

      // Bounds check
      if (nextIndex < 0 || nextIndex >= finalSteps.length) {
        stopTour();
        return;
      }

      // Check if navigation is needed for the NEXT step
      const nextStepData = finalSteps[nextIndex];
      const target = typeof nextStepData.target === 'string' ? nextStepData.target : '';
      const targetPath = getPathForTarget(target);
      const needsNavigation = targetPath && location.pathname !== targetPath;

      if (needsNavigation) {
        pauseTour();
        if (isNext) { nextStep(); } else { prevStep(); }
        navigate(targetPath);
        setTimeout(() => resumeTour(), 800);
      } else {
        if (isNext) { nextStep(); } else { prevStep(); }
      }
    }

    // When TARGET_NOT_FOUND fires, the current step target isn't in the DOM.
    // Navigate to the correct page and retry after the page renders.
    if (type === EVENTS.TARGET_NOT_FOUND) {
      const currentStepData = finalSteps[index];
      if (!currentStepData) { stopTour(); return; }

      const target = typeof currentStepData.target === 'string' ? currentStepData.target : '';
      const targetPath = getPathForTarget(target);

      if (targetPath && location.pathname !== targetPath) {
        pauseTour();
        navigate(targetPath);
        setTimeout(() => resumeTour(), 800);
      } else {
        // Target should be on this page but doesn't exist — skip this step
        if (index + 1 < finalSteps.length) {
          nextStep();
        } else {
          stopTour();
        }
      }
    }
  };

  return (
    <Joyride
      steps={finalSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showSkipButton
      disableScrollParentFix
      locale={{
        back: t('tour_btn_back', 'Anterior'),
        close: t('tour_btn_close', 'Cerrar'),
        last: t('tour_btn_finish', 'Finalizar'),
        next: t('tour_btn_next', 'Siguiente'),
        skip: t('tour_btn_skip', 'Saltar Tour'),
      }}
      options={{
        arrowColor: '#ffffff',
        backgroundColor: '#ffffff',
        overlayColor: 'rgba(16, 35, 36, 0.6)',
        primaryColor: '#102324',
        textColor: '#213d3d',
        zIndex: 5000,
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
      }}
      styles={{
        tooltip: {
          borderRadius: '1rem',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        buttonPrimary: {
          borderRadius: '0.75rem',
          padding: '10px 20px',
          fontWeight: 600,
          fontSize: '14px',
          backgroundColor: '#102324',
          transition: 'all 0.2s ease',
        },
        buttonBack: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#34706f',
          marginRight: '12px',
        },
        buttonSkip: {
          fontSize: '12px',
          color: '#5ea8a6',
        }
      }}
      callback={handleJoyrideCallback}
    />
  );
}
