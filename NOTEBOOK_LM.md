# MYPROPINMOBILIARIAS — PANEL ADMINISTRATIVO
## Documentación Técnica para NotebookLM

### Descripción
Panel administrativo del ecosistema MyProp. Permite a las inmobiliarias gestionar sus propiedades, inquilinos, cobranzas y configuración desde una interfaz web premium con diseño Luxury Minimalist.

### Stack Técnico
- **Runtime**: Bun 1.3.10
- **Bundler**: Vite 6 (plugin @tailwindcss/vite para TW4)
- **Framework**: React 19 + TypeScript 5.7 (strict mode)
- **Estilos**: Tailwind CSS v4 con paleta Renta520
- **UI Components**: Shadcn/ui (estilo new-york)
- **API Client**: Eden Treaty → mypropAPI v1.6.0 (El Búnker)
- **Auth**: Clerk React (publicMetadata → inmobiliaria_id)
- **Validación**: Zod v4

### Arquitectura de Datos
- **Master Filter**: `inmobiliaria_id` — Todo request al API incluye este filtro obligatorio
- **Fuente**: `user.publicMetadata.inmobiliaria_id` (Clerk JWT)
- **Hook**: `useInmobiliaria()` — Punto único de acceso al tenant context

### Paleta Visual (Renta520)
| Token | Hex | Uso |
|---|---|---|
| renta-50 | #f5f8f8 | Background principal |
| renta-200 | #c2e1df | Borders, selections |
| renta-400 | #5ea8a6 | Accents, active states |
| renta-600 | #34706f | Primary actions |
| renta-950 | #102324 | Sidebar, dark surfaces |

### Tipografías
| Familia | Rol |
|---|---|
| Plus Jakarta Sans | Títulos y headings |
| Inter | Body, formularios, tablas |
| Playfair Display | Detalles luxury, emphasis |

### Estructura de Carpetas
```
src/
├── components/     → UI components (layout/, ui/, feature-specific/)
├── pages/          → Route-level components
├── providers/      → Context providers (Clerk, etc.)
├── hooks/          → Custom hooks (useInmobiliaria, etc.)
├── services/       → API clients (Eden Treaty)
├── lib/            → Utilities (cn, formatters)
├── types/          → TypeScript type definitions
└── styles/         → CSS design system
```

### Branching
- `main` → Producción (solo vía PR)
- `dev` → Staging + Desarrollo activo
