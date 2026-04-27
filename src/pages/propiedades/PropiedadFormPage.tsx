import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PropertyForm } from '@/components/propiedades/PropertyForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEden } from '@/services/eden';

export function PropiedadFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { client, isReady } = useEden();
  
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isEditing = Boolean(id && id !== 'nueva');

  useEffect(() => {
    if (isReady) {
      fetchData();
    }
  }, [isReady, client]);

  const fetchData = async () => {
    try {
      // @ts-ignore
      const { data, error } = await client.admin.owners.get();
      if (!error && data && Array.isArray(data.owners)) {
        setOwners(data.owners);
      } else if (!error && Array.isArray(data)) {
        // Fallback for cases where it might return the array directly
        setOwners(data);
      }
    } catch (err) {
      console.error("[PropiedadFormPage] Fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
        <p className="mt-4 text-sm text-renta-500">Cargando propietarios reales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/propiedades')}
          className="p-2 bg-white border border-admin-border rounded-xl text-renta-500 hover:text-renta-900 hover:bg-renta-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">
             {isEditing ? 'Editar Propiedad' : 'Nueva Propiedad'}
          </h1>
          <p className="text-sm text-renta-600 font-inter mt-1">
             Complete la Ficha Técnica para el Inventario.
          </p>
        </div>
      </div>

      <PropertyForm 
        owners={owners}
        onCancel={() => navigate('/propiedades')}
        onSubmitSuccess={() => navigate('/propiedades')}
      />
    </div>
  );
}
