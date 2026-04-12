import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface JoyrideContextType {
  run: boolean;
  stepIndex: number;
  totalSteps: number;
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  resetTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  isTourCompleted: boolean;
  setTotalSteps: (steps: number) => void;
}

const JoyrideContext = createContext<JoyrideContextType | undefined>(undefined);

const STORAGE_KEY_BASE = 'myprop_joyride_completed';

/**
 * JoyrideProvider — Manejador global del estado del tour de onboarding.
 * Gestiona la persistencia en localStorage para evitar repeticiones innecesarias.
 */
import { useInmobiliaria } from '@/hooks/useInmobiliaria';

export function JoyrideProvider({ children }: { children: React.ReactNode }) {
  const { role, isSignedIn } = useInmobiliaria();
  const STORAGE_KEY = `${STORAGE_KEY_BASE}_${role}`;

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [isTourCompleted, setIsTourCompleted] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  // Sincronizar estado de completado cuando cambia la key (por cambio de rol)
  useEffect(() => {
    setIsTourCompleted(localStorage.getItem(STORAGE_KEY) === 'true');
  }, [STORAGE_KEY]);

  // Iniciar automáticamente si no se ha completado
  useEffect(() => {
    if (!isTourCompleted && role && isSignedIn && !run) {
      // Pequeño delay para asegurar que el DOM esté listo y las animaciones de entrada terminen
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTourCompleted, role, isSignedIn, run]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setRun(true);
  }, []);

  const stopTour = useCallback(() => {
    setRun(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsTourCompleted(true);
  }, [STORAGE_KEY]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsTourCompleted(false);
    setStepIndex(0);
    setRun(true);
  }, [STORAGE_KEY]);

  const pauseTour = useCallback(() => setRun(false), []);
  const resumeTour = useCallback(() => setRun(true), []);

  const nextStep = useCallback(() => setStepIndex(prev => prev + 1), []);
  const prevStep = useCallback(() => setStepIndex(prev => Math.max(0, prev - 1)), []);

  return (
    <JoyrideContext.Provider
      value={{
        run,
        stepIndex,
        totalSteps,
        startTour,
        stopTour,
        nextStep,
        prevStep,
        resetTour,
        pauseTour,
        resumeTour,
        isTourCompleted,
        setTotalSteps,
      }}
    >
      {children}
    </JoyrideContext.Provider>
  );
}

export function useJoyride() {
  const context = useContext(JoyrideContext);
  if (!context) {
    throw new Error('useJoyride must be used within a JoyrideProvider');
  }
  return context;
}
