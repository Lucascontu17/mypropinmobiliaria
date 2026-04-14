import { useState, useEffect, useCallback, useRef } from 'react';
import { Joyride, type Step, STATUS, type CallBackProps } from 'react-joyride';
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
 *
 * El tour se marca como "visto" apenas arranca, de modo que si el usuario
 * navega fuera antes de completar los pasos, no vuelve a aparecer el beacon
 * al regresar.
 */
export function LocalJoyride({ steps, storageKey }: LocalJoyrideProps) {
  const { t } = useRegion();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Verificar si ya se completó (o se vio) el tour
    const isSeen = localStorage.getItem(storageKey) === 'true';
    
    if (!isSeen && steps.length > 0) {
      // Retrasar el inicio para evitar parpadeos y solapamientos
      const timer = setTimeout(() => {
        // En lugar de marcarlo "visto" inmediatamente, esperamos a que inicie 
        // y lo manejamos en el callback de mount.
        setStepIndex(0);
        setRun(true);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [storageKey, steps]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, action, index } = data;

    // Al arrancar o pasar pasos, aseguramos que quede persistido
    // Para que si el usuario navega fuera por la mitad, no vuelva a verse
    if (type === 'step:after' || type === 'tour:start') {
       localStorage.setItem(storageKey, 'true');
    }

    if (type === 'step:after') {
      // Control de avance/retroceso explícito
      if (action === 'next') setStepIndex(index + 1);
      if (action === 'prev') setStepIndex(index - 1);
    }

    // Tour completado, saltado o reseteado por Joyride internamente
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem(storageKey, 'true');
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
        beacon: {
          display: 'none', // Forzar ocultamiento del dot incial
          opacity: 0,
          visibility: 'hidden'
        },
        beaconInner: { display: 'none' },
        beaconOuter: { display: 'none' },
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
