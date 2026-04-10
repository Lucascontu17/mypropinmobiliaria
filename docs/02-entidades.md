# 02-ENTIDADES DE NEGOCIO

El sistema se basa en un grafo de relaciones centrado en la Inmobiliaria (Tenant).

## Inmobiliaria (Tenant)
El nivel raíz del sistema.
- **Identificador**: `inmobiliaria_id` (injectado vía Clerk).
- **Alcance**: Delimita todos los datos visibles y operables en la sesión actual.

## Propiedad (Inventario)
Unidad física gestionada.
- **Relación**: Pertenece a una Inmobiliaria; tiene un Propietario asignado.
- **Estados**: Disponible, Alquilada, Reservada.
- **Atributos**: GPS coords, Imágenes, Servicios, Comodidades (Amenities).

## Actor (Persona/Entidad)
Engloba a Inquilinos y Propietarios.
- **Atributos**: DNI/CUIT (obligatorio), Email, Teléfono (E.164), Dirección.
- **Vínculos**: Un Inquilino se vincula a una Propiedad mediante un Contrato; un Propietario es dueño de N Propiedades.

## Contrato (Acuerdo)
Vínculo legal y financiero.
- **Atributos**: Fechas, Montos iniciales, Moneda, Periodicidad (mensual, bimestral, etc).
- **Indexación**: Configuración de aumentos (ICL, IPC, Manual).
- **Vigencia**: Controla si la propiedad está en estado "Alquilada".

## Booster (Producto de Visibilidad)
Entidad del Marketplace.
- **Uso**: Consumo de puntos para mejorar el posicionamiento en `mypropLand`.
- **Atributos**: Puntos, Precio regionalizado, Vigencia.
