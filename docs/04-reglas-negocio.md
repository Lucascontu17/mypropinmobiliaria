# 04-REGLAS DE NEGOCIO Y LÓGICA CENTRAL

El Panel Administrativo de MyProp implementa reglas críticas para la integridad de los datos y el cumplimiento multi-tenant.

## Seguridad "Zero Leaks" (Master Filter)
Toda consulta (GET, POST, etc.) a "El Búnker" (mypropAPI) debe incluir obligatoriamente el `inmobiliaria_id`.
- **Implementación**: Se extrae de `user.publicMetadata` de Clerk.
- **Hook**: `useInmobiliaria()` centraliza esta inyección garantizando que un usuario nunca pueda ver o modificar datos de otra inmobiliaria.

## Sistema Multi-Región (Dialectos .md)
El sistema detecta automáticamente la región según el TLD del navegador (ej. `.com.ar` -> AR).
- **Dialectos**: Se cargan archivos Markdown dinámicos (`locales/ar.md`, `locales/mx.md`, `locales/us.md`).
- **Moneda**: Se utiliza `Intl.NumberFormat` regionalizado basado en el `country_code` detectado.
- **Audit Mode**: Permite a administradores cambiar manualmente la región visual solo en entorno de desarrollo (`VITE_FORCE_REGION`).

## Ciclo de Vida de los Pagos
- **Registro de Pagos**: Admite pagos parciales. El estado de la cuota cambia a "PAGADA" solo cuando la suma de pagos alcanza o supera el monto base + punitorios.
- **Saldos a Favor**: El excedente en un pago parcial se computa como "saldo a favor" que reduce la base imponible del siguiente periodo.
- **Rollover (Generación Masiva)**: El cierre de periodo es una operación transaccional ACID. Genera las nuevas cuotas para todas las propiedades alquiladas y consolida deudas pendientes.

## Reglas de Marketplace
- **Precios Dinámicos**: Los planes de Boosters se obtienen de la API v1.7.0. El precio se ajusta según el `country_code` del usuario.
- **Verificación de Pagos**: Una vez realizado el pago en Mercado Pago, se requiere la confirmación vía Webhook HMAC (backend) antes de acreditar los puntos en el panel.

## Offline / PWA
- **Estrategia**: Stale-While-Revalidate.
- **Recursos**: Tipografías (Inter, Plus Jakarta Sans, Playfair Display) y assets estáticos se cachean para permitir el acceso al panel en condiciones de baja conectividad.
