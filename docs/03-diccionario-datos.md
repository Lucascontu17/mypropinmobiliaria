# 03-DICCIONARIO DE DATOS (ESQUEMAS)

El sistema utiliza **Zod** para la validación en tiempo de ejecución y **TypeScript** para la seguridad estática.

## Esquema: Propiedad (`propertySchema`)
| Campo | Tipo | Validación | Descripción |
|---|---|---|---|
| `uid_prop` | UUID | opcional | ID único generado por el backend. |
| `owner_id` | UUID | requerido | FK del propietario (Vidu). |
| `inmobiliaria_id` | UUID | inyectado | Master Filter para multi-tenancy. |
| `direccion` | string | min(5) | Dirección física de la propiedad. |
| `status` | enum | DISPONIBLE, etc | Estado operativo actual. |
| `valor_alquiler` | number | positivo | Monto base de renta. |
| `latitud` / `longitud` | number | null/range | Coordenadas GPS (Google Maps). |
| `imagenes` | File[] | 4 a 20 | Array de archivos de imagen. |
| `servicios` | object | booleans | luz, gas, agua, expensas, abl. |

## Esquema: Región e Internacionalización
| Tipo / Constante | Valores | Uso |
|---|---|---|
| `CountryCode` | AR, MX, US | Código ISO del país activo. |
| `CurrencyCode` | ARS, MXN, USD | Moneda para transacciones. |
| `RegionalConfig` | Interface | Config del dialecto (tax_label, id_label). |
| `BoosterPlanAPI` | Interface | Estructura de planes del Marketplace. |

## Enumeraciones de Negocio
- **Estados Propiedad**: `DISPONIBLE`, `ALQUILADA`, `VENTA`, `RESERVADA`, `VENDIDA`.
- **Periodicidad Contrato**: `mensual`, `bimestral`, `trimestral`, `semestral`, `anual`.
- **Roles Clerk**: `superadmin`, `admin`, `vendedor`.

## Reglas de Validación Transversales
- **Teléfonos**: Deben cumplir con el formato E.164 (Ej: +54911...).
- **Emails**: Validación nativa de Zod `z.string().email()`.
- **Montos**: No se permiten valores negativos en liquidaciones o saldos de cuotas.
