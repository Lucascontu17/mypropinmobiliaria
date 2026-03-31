import { useUser } from '@clerk/clerk-react';

interface InmobiliariaMetadata {
  inmobiliaria_id: string;
  nombre: string;
  role: 'admin' | 'agent' | 'viewer';
}

/**
 * useInmobiliaria — Hook que extrae el Master Filter del usuario autenticado.
 * 
 * El inmobiliaria_id se almacena en Clerk publicMetadata y es la clave
 * que garantiza el aislamiento de datos multi-tenant en todas las queries
 * hacia el Búnker (mypropAPI).
 * 
 * @returns { inmobiliaria_id, nombre, role, isLoaded, isSignedIn }
 */
export function useInmobiliaria() {
  const { user, isLoaded, isSignedIn } = useUser();

  const metadata = (user?.publicMetadata ?? {}) as Partial<InmobiliariaMetadata>;

  return {
    inmobiliaria_id: metadata.inmobiliaria_id ?? null,
    nombre: metadata.nombre ?? 'Mi Inmobiliaria',
    role: metadata.role ?? 'viewer',
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    user,
  };
}
