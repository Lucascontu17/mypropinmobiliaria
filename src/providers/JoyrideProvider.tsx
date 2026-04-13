import React, { createContext, useContext, useCallback } from 'react';

interface JoyrideContextType {
  resetTour: () => void;
}

const JoyrideContext = createContext<JoyrideContextType | undefined>(undefined);

/**
 * JoyrideProvider — Manejador de estado para los LocalJoyrides.
 * Su única responsabilidad ahora es proveer un mecanismo global para resetear
 * todos los micro-tours de la aplicación y volver a mostrarlos.
 */
export function JoyrideProvider({ children }: { children: React.ReactNode }) {
  const resetTour = useCallback(() => {
    // Buscar todas las keys de localStorage que empiecen con enjoy_local_
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('enjoy_local_')) {
        keysToRemove.push(key);
      }
    }

    // Eliminarlas
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Refrescar para reiniciar el estado de los componentes
    window.location.reload();
  }, []);

  return (
    <JoyrideContext.Provider value={{ resetTour }}>
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
