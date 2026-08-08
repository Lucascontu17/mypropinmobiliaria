# 90-DECISIONES TÉCNICAS Y ARQUITECTURA

El desarrollo del Panel Administrativo de MyProp ha seguido principios de **minimalismo de lujo**, **seguridad por diseño** y **localización nativa**.

## Stack Tecnológico Principal

### Bun 1.3.10 (Runtime)
- **Razón**: Rapidez en la ejecución de scripts, manejo nativo de paquetes y bundler integrado. Permite una experiencia de desarrollo más fluida.

### Vite 6 + React 19 (Frontend Core)
- **Vite 6**: Rendimiento de desarrollo insuperable con HMR extremadamente rápido.
- **React 19**: Uso de hooks modernos y mejoras en el renderizado concurrente.

### Tailwind CSS v4 (Styling)
- **Motor**: Usa el nuevo plugin de Vite para TW4, eliminando la necesidad de archivos de configuración pesados.
- **Paleta Renta520**: Sistema de colores teal/esmeralda personalizado para la identidad de marca de MyProp.

### Clerk (Auth & Multi-tenancy)
- **Identity Provider**: Manejo de autenticación stateless.
- **Metadata**: Se utiliza `publicMetadata` para inyectar el `inmobiliaria_id` en el JWT del usuario, permitiendo un filtrado de datos inalterable desde el cliente.

### Eden Treaty (API Client)
- **Consistencia**: Al compartir el mismo ecosistema que `mypropAPI` (ElysiaJS), Eden permite compartir los tipos del backend directamente, eliminando errores por desincronización de esquemas.

## Arquitectura de Localización (Dialect Engine)
A diferencia de sistemas tradicionales como `react-i18next`, se optó por un **motor de dialectos basado en Markdown**:
1.  **Mantenibilidad**: Los archivos `.md` son legibles por no-desarrolladores (ej. personal de marketing).
2.  **Rendimiento**: Carga dinámica por país (`ar.md`, `mx.md`, `us.md`).
3.  **Flexibilidad**: Permite definir no solo textos, sino también configuraciones regionales (moneda, prefijos, labels fiscales) en el frontmatter YAML.

## Decisiones de Diseño UI (Luxury Minimalist)
- **Tipografías**: Triada de fuentes (Plus Jakarta Sans para títulos, Inter para datos, Playfair Display para énfasis luxury).
- **Componentes**: Shadcn/ui para consistencia y personalización precisa del diseño.
- **Principios**: Espaciado generoso, bordes sutiles y micro-animaciones refinadas.
