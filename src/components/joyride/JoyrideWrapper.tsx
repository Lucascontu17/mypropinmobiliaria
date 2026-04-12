import React, { useMemo, useCallback } from 'react';
import { Joyride, type Step, STATUS, ACTIONS, EVENTS, type CallBackProps } from 'react-joyride';
import { useJoyride } from '@/providers/JoyrideProvider';
import { useRegion } from '@/hooks/useRegion';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';

export function JoyrideWrapper() {
  const { run, stepIndex, stopTour, nextStep, prevStep } = useJoyride();
  const { t } = useRegion();
  const { role } = useInmobiliaria();

  // ═══════════════════════════════════════════════════════════════════
  // SUPERADMIN TOUR
  // ═══════════════════════════════════════════════════════════════════
  const superadminSteps: Step[] = useMemo(() => [
    {
      target: '[data-joyride="kpi-grid"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sa_kpi_title', 'Centro de Control Financiero')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sa_kpi_desc', 'Métricas globales en tiempo real. Observe el estado de su rentabilidad por país, filtrado estrictamente bajo el Master Filter de su franquicia.')}
        </div>
      ),
      placement: 'bottom' as const,
      disableBeacon: true,
    },
    {
      target: '[data-joyride="nav-propiedades"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_nav_propiedades_title', 'Inventario de Propiedades')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_nav_propiedades_desc', 'Administre sus propiedades y utilice el ícono 🚀 para asignar Puntos Booster a los activos que desee destacar en el ecosistema.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="nav-cobranzas"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_nav_cobranzas_title', 'Motor Financiero')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_nav_cobranzas_desc', 'Gestione pagos, ejecute el Rollover mensual (ACID) y controle la morosidad de los inquilinos desde aquí.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="nav-marketplace"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sa_mkt_title', 'Marketplace de Crecimiento')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sa_mkt_desc', 'Adquiera Funciones Extra para potenciar su suscripción y compre Puntos Booster para aumentar la visibilidad de sus propiedades.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
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
          {t('tour_sub_nav_desc', 'Visualice el desglose de su próximo pago y consulte el historial completo de transacciones del Marketplace.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="nav-equipo"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_equipo_title', 'Gestión de Equipos')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_equipo_desc', 'Centralice la administración de sus colaboradores. Invite Administradores y Vendedores con permisos granulares.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="nav-configuracion"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sa_saas_title', 'Configuración y Salud SaaS')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sa_saas_desc', 'Configure notificaciones automáticas y personalice los parámetros operativos de su inmobiliaria.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="user-profile"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sa_roles_title', 'Su Identidad')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          <span className="font-playfair italic text-renta-950 block mb-2">{t('tour_sa_welcome', 'Bienvenido, Director.')}</span>
          {t('tour_sa_roles_desc', 'Sesión activa como SUPERADMIN. Desde aquí administra su cuenta y delega permisos.')}
        </div>
      ),
      placement: 'bottom' as const,
      disableScrolling: true,
    },
  ], [t]);

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN TOUR
  // ═══════════════════════════════════════════════════════════════════
  const adminSteps: Step[] = useMemo(() => [
    {
      target: '[data-joyride="kpi-grid"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sa_kpi_title', 'Panel de Control')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sa_kpi_desc', 'Métricas clave de su inmobiliaria en tiempo real.')}
        </div>
      ),
      placement: 'bottom' as const,
      disableBeacon: true,
    },
    {
      target: '[data-joyride="nav-propiedades"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_nav_propiedades_title', 'Gestión de Propiedades')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_nav_propiedades_desc', 'Administre sus propiedades, cargue carpetas digitales y destaque activos disponibles.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="nav-cobranzas"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_nav_cobranzas_title', 'Cobranzas y Rollover')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_nav_cobranzas_desc', 'Registre pagos parciales y ejecute el cierre de periodo mensual.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="nav-marketplace"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sa_mkt_title', 'Marketplace')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sa_mkt_desc', 'Compre puntos Booster y active funciones premium para su suscripción.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
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
          {t('tour_sub_nav_desc', 'Consulte el desglose de su próximo pago y el historial de transacciones.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="nav-equipo"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_equipo_title', 'Su Equipo')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_equipo_desc', 'Administre los Vendedores de su sucursal y monitoree sus cuentas.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
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
          {t('tour_adm_hierarchy_desc', 'Como Administrador, gestionas el corazón operativo de esta inmobiliaria.')}
        </div>
      ),
      placement: 'bottom' as const,
      disableScrolling: true,
    },
  ], [t]);

  // ═══════════════════════════════════════════════════════════════════
  // VENDEDOR TOUR
  // ═══════════════════════════════════════════════════════════════════
  const vendedorSteps: Step[] = useMemo(() => [
    {
      target: '[data-joyride="nav-propiedades"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          <span className="font-playfair italic block text-xl mb-1">{t('tour_ven_welcome', 'Bienvenido, Agente.')}</span>
          {t('tour_ven_catalog_title', 'Su Catálogo de Propiedades')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_ven_catalog_desc', 'Desde aquí gestiona las propiedades bajo su responsabilidad. El Master Filter asegura el aislamiento de datos.')}
        </div>
      ),
      placement: 'right' as const,
      disableBeacon: true,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="nav-contratos"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_ven_contratos_title', 'Contratos')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_ven_contratos_desc', 'Gestione los contratos de alquiler y venta vinculados a sus propiedades.')}
        </div>
      ),
      placement: 'right' as const,
      disableScrolling: true,
    },
    {
      target: '[data-joyride="user-profile"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_ven_contact_title', 'Su Perfil')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_ven_contact_desc', 'Gestione su sesión y contacte directamente usando el estándar E.164.')}
        </div>
      ),
      placement: 'bottom' as const,
      disableScrolling: true,
    },
  ], [t]);

  // Selección lógica de pasos basada en el rol (con useMemo para referencia estable)
  const finalSteps = React.useMemo(() => {
    if (role === 'superadmin') return superadminSteps;
    if (role === 'admin') return adminSteps;
    if (role === 'vendedor') return vendedorSteps;
    return [];
  }, [role, superadminSteps, adminSteps, vendedorSteps]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      stopTour();
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.NEXT) {
        nextStep();
      } else if (action === ACTIONS.PREV) {
        prevStep();
      }
    }
  }, [stopTour, nextStep, prevStep]);

  if (!finalSteps.length) return null;

  return (
    <Joyride
      steps={finalSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showSkipButton
      disableScrollParentFix
      floaterProps={{
        disableAnimation: true
      }}
      locale={{
        back: t('tour_btn_back', 'Anterior'),
        close: t('tour_btn_close', 'Cerrar'),
        last: t('tour_btn_finish', 'Finalizar'),
        next: t('tour_btn_next', 'Siguiente'),
        skip: t('tour_btn_skip', 'Saltar Tour'),
      }}
      styles={{
        options: {
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(16, 35, 36, 0.6)',
          primaryColor: '#102324',
          textColor: '#213d3d',
          zIndex: 5000,
        },
        tooltip: {
          borderRadius: '1rem',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        tooltipContent: {
          padding: '8px 0',
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
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
}
