import { useState, useEffect, useCallback } from 'react';
import { Joyride, type Step, STATUS, ACTIONS, EVENTS, type CallBackProps } from 'react-joyride';
import { useRegion } from '@/hooks/useRegion';

interface LocalJoyrideProps {
  steps: Step[];
  storageKey: string;
}

/**
 * LocalJoyride — Micro-Tour contextualmente atado a una página.
 * Solo se dispara si en localStorage no existe la clave solicitada.
 * Se inicia con un delay de 800ms para permitir a la página completar
 * sus animaciones de entrada (fade-in) antes de montar el overlay.
 */
export function LocalJoyride({ steps, storageKey }: LocalJoyrideProps) {
  const { t } = useRegion();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Verificar si ya se completó el tour
    const isCompleted = localStorage.getItem(storageKey) === 'true';
    
    if (!isCompleted && steps.length > 0) {
      // Retrasar el inicio para evitar parpadeos y solapamientos
      // con las animaciones de carga de la propia página.
      const timer = setTimeout(() => {
        setRun(true);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [storageKey, steps]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, status, type, index, lifecycle } = data;

    // Tour completado o saltado
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem(storageKey, 'true');
      return;
    }

    // Avanzar de paso sincronizadamente
    if (type === EVENTS.STEP_AFTER || (type === EVENTS.TARGET_NOT_FOUND && lifecycle === 'ready')) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(nextIndex);
    }
  }, [storageKey]);

  if (steps.length === 0 || !run) return null;

  const finalSteps = steps.map(step => ({ ...step, disableBeacon: true }));

  return (
    <Joyride
      steps={finalSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showSkipButton
      disableScrollParentFix
      spotlightClicks={true}
      disableOverlayClose={false}
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
          overlayColor: 'rgba(16, 35, 36, 0.5)',
          primaryColor: '#102324',
          textColor: '#213d3d',
          zIndex: 9999,
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
