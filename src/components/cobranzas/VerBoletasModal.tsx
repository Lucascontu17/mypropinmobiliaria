import { useState, useEffect } from 'react';
import { useEden } from '@/services/eden';
import { X, Zap, Flame, Droplets, Eye, Loader2, FileX } from 'lucide-react';

interface Boleta {
  id: string;
  tipo_servicio: 'LUZ' | 'GAS' | 'AGUA';
  url_archivo: string;
  created_at: string;
}

interface Props {
  pagoId: string;
  inquilinoNombre: string;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  LUZ: <Zap className="h-5 w-5 text-amber-500" />,
  GAS: <Flame className="h-5 w-5 text-orange-500" />,
  AGUA: <Droplets className="h-5 w-5 text-blue-500" />,
};

const LABEL_MAP: Record<string, string> = {
  LUZ: 'Luz / Electricidad',
  GAS: 'Gas Natural',
  AGUA: 'Agua Corriente',
};

const COLOR_MAP: Record<string, string> = {
  LUZ: 'border-amber-200 bg-amber-50/50',
  GAS: 'border-orange-200 bg-orange-50/50',
  AGUA: 'border-blue-200 bg-blue-50/50',
};

export function VerBoletasModal({ pagoId, inquilinoNombre, onClose }: Props) {
  const [boletas, setBoletas] = useState<Boleta[]>([]);
  const [loading, setLoading] = useState(true);
  const { client: eden } = useEden();

  useEffect(() => {
    fetchBoletas();
  }, [pagoId]);

  const fetchBoletas = async () => {
    try {
      setLoading(true);
      // @ts-ignore
      const { data, error } = await eden.admin.boletas[pagoId].get();
      if (!error && data?.data) {
        setBoletas(data.data);
      }
    } catch (err) {
      console.error('Error fetching boletas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (url: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://api.zonatia.com/api/v1';
    const fullUrl = url.startsWith('http') ? url : `${API_URL.replace('/v1', '').replace('/api', '')}${url}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-renta-950/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-admin-border overflow-hidden">
        
        <div className="bg-renta-50 px-6 py-4 flex items-center justify-between border-b border-admin-border-subtle">
          <div>
            <h3 className="font-jakarta text-lg font-bold text-renta-950">
              Boletas de Servicios
            </h3>
            <p className="text-xs text-renta-500 mt-0.5">{inquilinoNombre}</p>
          </div>
          <button onClick={onClose} className="text-renta-400 hover:text-red-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
              <p className="text-sm text-renta-400">Cargando boletas...</p>
            </div>
          ) : boletas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
              <div className="w-14 h-14 rounded-full bg-renta-50 flex items-center justify-center">
                <FileX className="h-7 w-7 text-renta-300" />
              </div>
              <h4 className="font-jakarta font-bold text-renta-950">Sin boletas cargadas</h4>
              <p className="text-xs text-renta-400 max-w-xs">
                El inquilino aún no ha subido las boletas de servicios para este periodo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {boletas.map((boleta) => (
                <div
                  key={boleta.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${COLOR_MAP[boleta.tipo_servicio] || 'border-admin-border bg-renta-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      {ICON_MAP[boleta.tipo_servicio]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-renta-950">
                        {LABEL_MAP[boleta.tipo_servicio] || boleta.tipo_servicio}
                      </p>
                      <p className="text-[10px] text-renta-400">
                        Subida el {new Date(boleta.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePreview(boleta.url_archivo)}
                    className="flex items-center gap-1.5 text-xs font-bold text-renta-700 bg-white border border-renta-200 px-3 py-1.5 rounded-lg hover:bg-renta-50 transition-colors active:scale-95"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
