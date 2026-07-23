import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PropertyForm } from '@/components/propiedades/PropertyForm';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useEden } from '@/services/eden';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { toast } from 'sonner';

export function PropiedadFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { client, isReady } = useEden();
  const { inmobiliaria_id } = useInmobiliaria();
  
  const [owners, setOwners] = useState<any[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isEditing = Boolean(id && id !== 'nueva');

  useEffect(() => {
    if (isReady) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Owners
      // @ts-expect-error - Eden Treaty dynamic path
      const { data: ownersRes, error: ownersErr } = await client.admin.owners.get();
      if (!ownersErr && ownersRes) {
        if (Array.isArray(ownersRes.owners)) {
          setOwners(ownersRes.owners);
        } else if (Array.isArray(ownersRes)) {
          setOwners(ownersRes);
        }
      }

      // 2. Fetch Property if editing
      if (isEditing) {
        // @ts-expect-error - Eden Treaty dynamic path
        const { data: propRes, error: propErr } = await client.admin.propiedades[id].get();
        if (!propErr && propRes?.data) {
          // 🔧 NORMALIZE: la BD puede tener nulls que Zod no tolera
          const raw = propRes.data as Record<string, any>;
          const normalized = {
            ...raw,
            // 🐛 FIX CAMPOS EN ROJO: Zod requiere estos campos y la BD puede devolver null
            imagenes: Array.isArray(raw.imagenes) ? raw.imagenes : [],
            direccion: raw.direccion ?? '',
            tipo_inmueble: raw.tipo_inmueble ?? 'otro',
            moneda: raw.moneda ?? 'ARS',
            mts2: raw.mts2 ?? '0',
            habitaciones: raw.habitaciones ?? 0,
            ambientes: raw.ambientes ?? 1,
            banos: raw.banos ?? 0,
            antiguedad: raw.antiguedad ?? 0,
            cocheras: raw.cocheras ?? 0,
            latitud: raw.latitud ?? null,
            longitud: raw.longitud ?? null,
            provincia: raw.provincia ?? '',
            ciudad: raw.ciudad ?? '',
            barrio: raw.barrio ?? '',
            titulo: raw.titulo ?? '',
            descripcion: raw.descripcion ?? '',
            valor_alquiler: raw.valor_alquiler ?? '0',
            valor_venta: raw.valor_venta ?? '0',
            valor_expensas: raw.valor_expensas ?? '',
            valor_abl: raw.valor_abl ?? '',
            tipo_abl: raw.tipo_abl ?? null,
          };
          setProperty(normalized);
        } else {
          // BUG #M-8 fix: si la propiedad no existe, informar y redirigir
          console.error('[PropiedadFormPage] Property not found:', propErr);
          toast.error('Propiedad no encontrada o sin acceso.', {
            description: 'Serás redirigido al inventario.'
          });
          navigate('/propiedades');
          return;
        }
      }
    } catch (err) {
      console.error('[PropiedadFormPage] Fetch failed:', err);
      toast.error('Error de conectividad al cargar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  // BUG #A-4 fix: inmobiliaria_id puede no estar disponible si el usuario
  // no completó el onboarding o si hubo un error de sync con Clerk.
  if (!inmobiliaria_id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-10 w-10 text-amber-400" />
        <h2 className="text-lg font-bold text-renta-950 font-jakarta">Configuración Incompleta</h2>
        <p className="text-sm text-renta-600 text-center max-w-sm">
          Tu cuenta no tiene una inmobiliaria asociada. Completá el proceso de onboarding para continuar.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 px-5 py-2 bg-renta-900 text-white rounded-xl text-sm font-semibold hover:bg-renta-800 transition-colors"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
        <p className="mt-4 text-sm text-renta-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/propiedades')}
          className="p-2 bg-white ring-1 ring-inset ring-admin-border border-transparent rounded-xl text-renta-500 hover:text-renta-900 hover:bg-renta-50 transition-colors"
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
        initialData={property}
        owners={owners}
        tenantId={inmobiliaria_id}  // garantizado no-undefined por el guard de arriba
        onCancel={() => navigate('/propiedades')}
        onSubmitSuccess={() => navigate('/propiedades')}
      />
    </div>
  );
}
