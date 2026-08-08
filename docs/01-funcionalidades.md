# 01-FUNCIONALIDADES POR MÓDULO

## Dashboard Principal
Vista consolidada con KPIs clave (Propiedades, Inquilinos, Cobranzas, Ocupación). Indicadores visuales de estado y accesos directos configurados vía `useInmobiliaria()`.

## Módulo de Propiedades (`/propiedades`)
Gestión integral (CRUD) del inventario inmobiliario.
- **Formularios Dinámicos**: Configurados con Zod para validación estricta y visualización Luxury Minimalist.
- **Geocodificación**: Integración con Google Maps para ubicación automática lat/lng.
- **Galería de Imágenes**: Subida local (4-20 imágenes) con previsualización reactiva.

## Actor Management (`/inquilinos`, `/propietarios`)
Administración de personas físicas y jurídicas.
- **Validación E.164**: Teléfonos formateados para integración futura con Twilio.
- **Multi-Tenant**: Aislamiento forzoso por `inmobiliaria_id`.
- **Ficha Digital**: Enlaces para DNI y contratos (pre-Storage).

## Cobranzas y Cuentas Corrientes (`/cobranzas`)
Motor financiero centralizado.
- **Estado de Cuenta**: Filtros "Al Día", "Con Deuda" y "Saldos a Favor".
- **Pagos Parciales**: Registro de múltiples abonos para una única cuota.
- **Cierre de Periodo**: Rollover masivo de deudas (Acción atómica ACID en El Búnker).

## Marketplace de Boosters (`/marketplace`)
Sistema de monetización y visibilidad.
- **Planes Dinámicos**: Fetch desde API v1.7.0 basado en región.
- **Integración Mercado Pago**: Flujo seguro para compra de puntos de visibilidad.

## Configuración y Auditoría (`/configuracion`)
Ajustes globales y herramientas de desarrollo.
- **Notificaciones**: Control centralizado de Webhooks (WhatsApp/Email).
- **Modo Auditoría**: Selector regional (dev-only) para simular diferentes mercados (AR/MX/US) en tiempo real.
- **Personalización PWA**: Estado de registro del Service Worker y capacidades offline.
