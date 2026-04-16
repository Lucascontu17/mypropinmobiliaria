import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { useRegion } from '@/hooks/useRegion';

/**
 * Shepherd Step Compatibility Layer
 */
export interface ShepherdStep {
  target: string;
  title?: React.ReactNode | string;
  content: React.ReactNode | string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

interface LocalShepherdProps {
  steps: ShepherdStep[];
  storageKey: string;
}

/**
 * LocalShepherd — Migración de Joyride a Shepherd.js.
 * Mantiene la lógica de persistencia local y el diseño premium.
 */
export function LocalShepherd({ steps, storageKey }: LocalShepherdProps) {
  const { t } = useRegion();
  const tourRef = useRef<Shepherd.Tour | null>(null);

  useEffect(() => {
    // 1. Verificar si ya se completó el tour
    const isSeen = localStorage.getItem(storageKey) === 'true';
    if (isSeen || steps.length === 0) return;

    // 2. Esperar delay para animaciones de entrada de la página
    const timer = setTimeout(() => {
      // 3. Inicializar el Tour
      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: {
            enabled: true,
          },
          scrollTo: { behavior: 'smooth', block: 'center' },
          classes: 'zonatia-shepherd-tooltip',
        },
      });

      // 4. Agregar pasos mapeados
      steps.forEach((step, index) => {
        const isLast = index === steps.length - 1;
        const isFirst = index === 0;

        const buttons = [];

        // Botón Saltar (solo si no es el último)
        if (!isLast) {
          buttons.push({
            action: () => tour.complete(),
            classes: 'shepherd-button-skip',
            text: t('tour_btn_skip', 'Saltar'),
          });
        }

        // Botón Anterior
        if (!isFirst) {
          buttons.push({
            action: () => tour.back(),
            classes: 'shepherd-button-secondary',
            text: t('tour_btn_back', 'Anterior'),
          });
        }

        // Botón Siguiente / Finalizar
        buttons.push({
          action: () => isLast ? tour.complete() : tour.next(),
          classes: 'shepherd-button-primary',
          text: isLast ? t('tour_btn_finish', 'Finalizar') : t('tour_btn_next', 'Siguiente'),
        });

        tour.addStep({
          id: `step-${index}`,
          title: typeof step.title === 'string' ? step.title : '', // Shepherd titles are strings or elements
          text: typeof step.content === 'string' ? step.content : '',
          attachTo: {
            element: step.target,
            on: step.placement || 'bottom',
          },
          buttons,
          when: {
            show: () => {
              // Marcar como visto apenas inicia el primer paso o avanza
              localStorage.setItem(storageKey, 'true');
            }
          }
        });
      });

      tour.start();
      tourRef.current = tour;
    }, 800);

    return () => {
      clearTimeout(timer);
      if (tourRef.current) {
        tourRef.current.complete();
      }
    };
  }, [steps, storageKey, t]);

  return null;
}
