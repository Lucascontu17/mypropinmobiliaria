import { useNavigate, useParams } from 'react-router-dom';
import { PropertyForm } from '@/components/propiedades/PropertyForm';
import { ArrowLeft } from 'lucide-react';

const MOCK_OWNERS = [
  { uid_propietario: '1', nombre: 'Juan Perez' },
  { uid_propietario: '2', nombre: 'Inversiones Global' },
];

export function PropiedadFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // En el futuro:
  // const { data: owners } = useSWR('/api/owners', fetcher)
  // const { data: property } = useSWR(id ? `/api/properties/${id}` : null, fetcher)

  const isEditing = Boolean(id && id !== 'nueva');

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
        owners={MOCK_OWNERS}
        onCancel={() => navigate('/propiedades')}
        onSubmitSuccess={() => navigate('/propiedades')}
      />
    </div>
  );
}
