import { eden } from './eden';

export interface GeocoderResult {
  latitud: number;
  longitud: number;
}

/**
 * MapsService - Frontend Wrapper
 * El frontend solo envía la dirección y el country_code; la mypropAPI (El Búnker) v1.7.0
 * selecciona la Google Maps API Key regional correspondiente y retorna coordenadas
 * de alta precisión (10,8) y (11,8).
 */
export const geocodeAddress = async (
  direccion: string, 
  inmobiliariaId: string,
  countryCode: string = 'AR'
): Promise<GeocoderResult | null> => {
  try {
    // El backend usa la API Key regional basada en el country_code
    // @ts-ignore
    const { data, error } = await eden.maps.geocode.post({
      direccion,
      inmobiliaria_id: inmobiliariaId,
      country_code: countryCode
    });

    if (error) {
      console.warn("MapsService Error (Graceful Degradation):", error.value);
      return null;
    }

    // Esperamos recibir { latitud, longitud } o algo similar del Server Proxy
    if (data?.latitud && data?.longitud) {
       return {
         latitud: Number(data.latitud),
         longitud: Number(data.longitud)
       };
    }

    return null;
  } catch (err) {
    console.error("Critical failure during geolocation:", err);
    // Graceful Degradation: si falla, devolvemos null para que el usuario guarde sin coordenadas
    return null;
  }
};
