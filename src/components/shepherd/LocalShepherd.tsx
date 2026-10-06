import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { useRegion } from '@/hooks/useRegion';

/**
 * ShepherdStep — definición de un paso del tour.
 * 'content' acepta HTML plano para aprovechar las clases `.zt-row`, `.zt-hint`, etc.
 */
export interface ShepherdStep {
  target: string;
  title?: string;
  content: string;          // Puede ser HTML
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

interface LocalShepherdProps {
  steps: ShepherdStep[];
  storageKey: string;
}

/**
 * Inyecta una barra de progreso con dots animados y etiqueta "Paso N de M"
 * directamente dentro del tooltip de Shepherd, antes del texto.
 */
function injectProgress(tour: Shepherd.Tour, currentIndex: number, total: number) {
  const stepEl = document.querySelector('.shepherd-content');
  if (!stepEl) return;

  // Eliminar progreso previo si existe
  const prev = stepEl.querySelector('.zt-shepherd-progress');
  if (prev) prev.remove();

  const bar = document.createElement('div');
  bar.className = 'zt-shepherd-progress';

  const dots = document.createElement('div');
  dots.className = 'zt-shepherd-dots';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    dot.className = 'zt-shepherd-dot' + (i === currentIndex ? ' active' : '');
    dots.appendChild(dot);
  }

  const label = document.createElement('span');
  label.className = 'zt-shepherd-step-label';
  label.textContent = `${currentIndex + 1} / ${total}`;

  bar.appendChild(dots);
  bar.appendChild(label);

  // Insertar antes del .shepherd-text
  const text = stepEl.querySelector('.shepherd-text');
  if (text) stepEl.insertBefore(bar, text);
}

/**
 * LocalShepherd — Motor de tour guiado con diseño premium Zonatia.
 * • Barra de progreso con dots animados
 * • Soporte de contenido HTML enriquecido en los pasos
 * • Botones jerárquicos: Saltar · Anterior · Siguiente/Finalizar
 * • Animación slide-up al aparecer
 * • Persistencia local vía localStorage
 */
export function LocalShepherd({ steps, storageKey }: LocalShepherdProps) {
  const { t } = useRegion();
  const tourRef = useRef<Shepherd.Tour | null>(null);

  useEffect(() => {
    const isSeen = localStorage.getItem(storageKey) === 'true';
    if (isSeen || steps.length === 0) return;

    const timer = setTimeout(() => {
      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          scrollTo: { behavior: 'smooth', block: 'center' },
          classes: 'zonatia-shepherd-tooltip',
        },
      });

      const total = steps.length;

      steps.forEach((step, index) => {
        const isLast  = index === total - 1;
        const isFirst = index === 0;

        const buttons: Shepherd.Step.StepOptionsButton[] = [];

        // Saltar (solo si no es el último)
        if (!isLast) {
          buttons.push({
            action() { tour.complete(); },
            classes: 'shepherd-button-skip',
            text: t('tour_btn_skip', 'Saltar'),
          });
        }

        // Anterior
        if (!isFirst) {
          buttons.push({
            action() { tour.back(); },
            classes: 'shepherd-button-secondary',
            text: `← ${t('tour_btn_back', 'Anterior')}`,
          });
        }

        // Siguiente / Finalizar
        buttons.push({
          action() { isLast ? tour.complete() : tour.next(); },
          classes: 'shepherd-button-primary',
          text: isLast
            ? `✓ ${t('tour_btn_finish', 'Finalizar')}`
            : `${t('tour_btn_next', 'Siguiente')} →`,
        });

        tour.addStep({
          id: `step-${index}`,
          title: step.title ?? '',
          text: step.content,   // Acepta HTML
          attachTo: {
            element: step.target,
            on: step.placement ?? 'bottom',
          },
          buttons,
          when: {
            show() {
              localStorage.setItem(storageKey, 'true');
              // Pequeño rAF para que el DOM del tooltip esté listo
              requestAnimationFrame(() => injectProgress(tour, index, total));
            },
          },
        });
      });

      tour.start();
      tourRef.current = tour;
    }, 850);

    return () => {
      clearTimeout(timer);
      tourRef.current?.complete();
    };
  }, [steps, storageKey, t]);

  return null;
}
