import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContratoForm } from '@/components/contratos/ContratoForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEden } from '@/services/eden';

export function ContratoFormPage() {
  const navigate = useNavigate();
  const { client, isReady } = useEden();
  
  const [propiedades, setPropiedades] = useState<any[]>([]);
  const [inquilinos, setInquilinos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isReady) {
      fetchData();
    }
  }, [isReady, client]);

  const fetchData = async () => {
    try {
      // @ts-ignore
      const [resProps, resInqs] = await Promise.all([
        client.admin.propiedades.get(),
        client.admin.inquilinos.get()
      ]);

      if (!resProps.error && resProps.data) {
        // Filtrar solo las disponibles para nuevos contratos
        const disponibles = resProps.data.filter((p: any) => p.status === 'DISPONIBLE' || p.status === 'Venta');
        setPropiedades(disponibles);
      }

      if (!resInqs.error && resInqs.data) {
        setInquilinos((resInqs.data as any)?.data?.inquilinos ?? (resInqs.data as any)?.inquilinos ?? resInqs.data ?? []);
      }
    } catch (err) {
      console.error("[ContratoFormPage] Fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
        <p className="mt-4 text-sm text-renta-500">Cargando inventario real...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/contratos')}
          className="p-2 bg-white border border-admin-border rounded-xl text-renta-500 hover:text-renta-900 hover:bg-renta-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">
             Transacción de Nuevo Alquiler
          </h1>
          <p className="text-sm text-renta-600 font-inter mt-1">
             Complete la vinculación y configure las reglas financieras para este contrato.
          </p>
        </div>
      </div>

      <ContratoForm 
        propiedadesDisponibles={propiedades}
        inquilinosSeleccionables={inquilinos}
        onCancel={() => navigate('/contratos')}
        onSubmitSuccess={() => navigate('/contratos')}
      />
    </div>
  );
}
