import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * AccessDenied — Componente Minimalista B2B
 * Renderizado por <ProtectedRoute> cuando la UI no concuerda con `allowedRoles`.
 */
export function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-renta-50 px-6 animate-fade-in-up">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 mb-6 shadow-sm border border-red-100">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold font-jakarta text-renta-950 mb-2">
          Acceso Denegado
        </h1>
        <p className="text-renta-600 mb-8 font-inter text-sm leading-relaxed">
          Tu rol actual no tiene los permisos suficientes para visualizar este módulo.
          Si consideras que se trata de un error, por favor contacta al administrador de la Inmobiliaria.
        </p>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-xl bg-renta-950 hover:bg-renta-800 transition-colors px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-renta-950/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}
