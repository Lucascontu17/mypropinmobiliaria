import { useNavigate } from 'react-router-dom';
import { ContratoForm } from '@/components/contratos/ContratoForm';
import { ArrowLeft } from 'lucide-react';

const MOCK_PROPIEDADES_DISPONIBLES = [
  { uid_prop: '1', direccion: 'Av. Callao 1234, CABA' },
  { uid_prop: '2', direccion: 'San Salvador 332, Corrientes' },
];

const MOCK_INQUILINOS = [
  { uid_inq: '1', nombre: 'Martin Lopez', dni: '35123456' },
  { uid_inq: '2', nombre: 'Empresa Constructora S.A.', dni: '30712345678' }
];

export function ContratoFormPage() {
  const navigate = useNavigate();
  
  // En el futuro:
  // const { data: propsDisponibles } = useSWR('/api/properties?status=DISPONIBLE', fetcher)
  // const { data: inquilinos } = useSWR('/api/inquilinos', fetcher)

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
        propiedadesDisponibles={MOCK_PROPIEDADES_DISPONIBLES}
        inquilinosSeleccionables={MOCK_INQUILINOS}
        onCancel={() => navigate('/contratos')}
        onSubmitSuccess={() => navigate('/contratos')}
      />
    </div>
  );
}
