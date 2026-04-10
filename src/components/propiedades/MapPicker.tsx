import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapPin, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { geocodeAddress } from '@/services/mapsService';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { cn } from '@/lib/utils';

interface MapPickerProps {
  direccionFieldName?: string;
}

export function MapPicker({ direccionFieldName = 'direccion' }: MapPickerProps) {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const { inmobiliaria_id } = useInmobiliaria();
  const { t } = useRegion();
  const [isSearching, setIsSearching] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const direccion = watch(direccionFieldName);
  const latitud = watch('latitud');
  const longitud = watch('longitud');

  const latError = errors.latitud?.message as string;
  const lngError = errors.longitud?.message as string;

  const handleGeocode = async () => {
    if (!direccion || direccion.length < 5) return;
    
    setIsSearching(true);
    setGeocodeStatus('idle');
    
    try {
      const result = await geocodeAddress(direccion, inmobiliaria_id);
      if (result) {
        setValue('latitud', result.latitud, { shouldValidate: true });
        setValue('longitud', result.longitud, { shouldValidate: true });
        setGeocodeStatus('success');
      } else {
        setGeocodeStatus('error');
      }
    } catch (error) {
      setGeocodeStatus('error');
    } finally {
      setIsSearching(false);
    }
  };

  const hasCoords = latitud != null && longitud != null;

  return (
    <div 
      data-joyride="map-picker-container"
      className="space-y-4 font-inter">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-renta-900">{t('map_ubicacion', 'Ubicación Geoespacial (API Proxy)')}</label>
        {geocodeStatus === 'error' && (
          <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-200">
            <AlertTriangle className="h-3 w-3" /> {t('map_degradacion', 'Graceful Degradation Activa')}
          </span>
        )}
        {geocodeStatus === 'success' && (
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200">
            <CheckCircle2 className="h-3 w-3" /> {t('map_actualizado', 'Coordenadas Actualizadas')}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGeocode}
          disabled={!direccion || direccion.length < 5 || isSearching}
          className="flex-shrink-0 flex items-center gap-2 bg-renta-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-renta-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? <span className="animate-spin text-lg">⚙</span> : <Search className="h-4 w-4" />}
          {t('map_autocompletar', 'Autocompletar Coordenadas')}
        </button>
        <div className="flex-1 text-xs text-renta-500 flex items-center px-2">
          {t('map_ayuda', 'El Búnker procesará la dirección y buscará Lat/Lng exactas.')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-renta-700">Latitud</label>
          <input
            readOnly
            value={latitud ?? ''}
            className={cn(
              "w-full rounded-xl border bg-gray-50 px-4 py-2 text-sm text-renta-900",
              latError ? "border-red-400" : "border-admin-border"
            )}
            placeholder="-34.6037"
          />
          {latError && <p className="text-xs text-red-500 font-medium">{latError}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-renta-700">Longitud</label>
          <input
            readOnly
            value={longitud ?? ''}
            className={cn(
              "w-full rounded-xl border bg-gray-50 px-4 py-2 text-sm text-renta-900",
              lngError ? "border-red-400" : "border-admin-border"
            )}
            placeholder="-58.3816"
          />
          {lngError && <p className="text-xs text-red-500 font-medium">{lngError}</p>}
        </div>
      </div>

      {/* Visualización de Mapa en iFrame embebido */}
      <div className="mt-4 rounded-xl overflow-hidden border border-admin-border h-[250px] bg-renta-50 flex items-center justify-center relative">
        {hasCoords ? (
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no" 
            marginHeight={0} 
            marginWidth={0} 
            src={`https://maps.google.com/maps?q=${latitud},${longitud}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
            title="Previsualización GPS"
          ></iframe>
        ) : (
          <div className="text-center p-6">
            <div className="mx-auto w-12 h-12 bg-renta-100 rounded-full flex items-center justify-center mb-2">
              <MapPin className="h-6 w-6 text-renta-400" />
            </div>
            <p className="text-sm font-semibold text-renta-900">{t('map_nodisponible', 'Mapa no disponible')}</p>
            <p className="text-xs text-renta-500 mt-1">{t('map_busque', 'Busque las coordenadas para activar la previsualización satelital.')}</p>
          </div>
        )}
      </div>

    </div>
  );
}
