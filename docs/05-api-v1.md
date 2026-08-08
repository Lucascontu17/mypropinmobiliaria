# 05-INTEGRACIÓN CON EL BÚNKER (API V1)

El Panel Administrativo actúa como un cliente ligero de la API centralizada **mypropAPI (El Búnker)**, utilizando **Eden Treaty** para garantizar seguridad de tipos de extremo a extremo.

## Cliente Eden Treaty
- **Instancia**: Localizada en `src/services/eden.ts`.
- **Base URL**: Configurada vía `VITE_API_URL` (default: `localhost:3000/api/v1`).
- **Autenticación**: Los tokens de Clerk se adjuntan en los headers de cada request (manejado por el middleware de `mypropAPI`).

## Servicios Especializados

### MapsService (`src/services/mapsService.ts`)
Geocodificación delegada al servidor.
- **Flujo**: El frontend envía `direccion` + `inmobiliaria_id` + `country_code`.
- **Backend**: Selecciona la API Key regional de Google Maps basada en el `country_code` y retorna coordenadas `lat/lng`.
- **Graceful Degradation**: Si el servicio falla, el frontend permite guardar la propiedad con coordenadas nulas para no bloquear la operación.

### MarketplaceService
Fetch dinámico de planes de visibilidad.
- **Endpoint**: `GET /marketplace/plans?country_code={REGION}`.
- **Respuesta**: Retorna planes con precios en la moneda local detectada.

## Patrones de Consumo de Datos
- **SWR (Stale-While-Revalidate)**: Utilizado para listados (Propiedades, Inquilinos, Cobranzas) para ofrecer una experiencia reactiva y rápida.
- **Inyección de Master Filter**: Todo POST/PUT inyecta el `inmobiliaria_id` antes de realizar el envío, el cual es validado estrictamente en El Búnker.

## Manejo de Errores
- Los errores 401/403 (Unauthorized/Forbidden) son interceptados para redirigir al flujo de Login de Clerk.
- Errores de validación (422) del backend se mapean a los campos de los formularios de Shadcn/ui.
