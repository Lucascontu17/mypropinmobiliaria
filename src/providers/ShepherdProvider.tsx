import React, { createContext, useContext, useCallback } from 'react';

interface ShepherdContextType {
  resetTour: () => void;
}

const ShepherdContext = createContext<ShepherdContextType | undefined>(undefined);

/**
 * ShepherdProvider — Manejador de estado para los LocalShepherds.
 * Su única responsabilidad ahora es proveer un mecanismo global para resetear
 * todos los micro-tours de la aplicación y volver a mostrarlos.
 */
export function ShepherdProvider({ children }: { children: React.ReactNode }) {
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
    <ShepherdContext.Provider value={{ resetTour }}>
      {children}
    </ShepherdContext.Provider>
  );
}

export function useShepherd() {
  const context = useContext(ShepherdContext);
  if (!context) {
    throw new Error('useShepherd must be used within a ShepherdProvider');
  }
  return context;
}
