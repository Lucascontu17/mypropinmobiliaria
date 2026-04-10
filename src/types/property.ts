import { z } from 'zod';

/**
 * Zod Schema para la creación y edición de Propiedades
 * Diseñado para la v3.4.5 de mypropDB.
 */

// Custom file validation en frontend para asegurar que sean archivos
const isBrowser = typeof window !== 'undefined';
const fileSchema = isBrowser ? z.instanceof(File) : z.any();

export const propertySchema = z.object({
  uid_prop: z.string().uuid().optional(), // Creado por backend
  owner_id: z.string().uuid({ message: "Debe seleccionar un propietario válido." }), // FK Vidu
  inmobiliaria_id: z.string().uuid().optional(), // Master Filter

  // Datos Generales
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres."),
  status: z.enum(['DISPONIBLE', 'ALQUILADA', 'VENTA', 'RESERVADA', 'VENDIDA']).default('DISPONIBLE'),
  valor_alquiler: z.string().min(1, "El valor es requerido."),

  // Soporte Geoespacial
  latitud: z.coerce.number()
    .min(-90, "Latitud mínima es -90")
    .max(90, "Latitud máxima es 90")
    .nullable()
    .optional(),
  longitud: z.coerce.number()
    .min(-180, "Longitud mínima es -180")
    .max(180, "Longitud máxima es 180")
    .nullable()
    .optional(),

  // Multimedia
  imagenes: z.array(fileSchema)
    .min(4, "Debe subir al menos 4 imágenes (Quality Minimum).")
    .max(20, "El límite máximo es 20 imágenes por propiedad."),

  // Detalles Técnicos (v1.9.0 Bunker Expansion)
  mts2: z.string().min(1, "La superficie es requerida"),
  habitaciones: z.coerce.number().int().min(0, "Mínimo 0 habitaciones"),
  ambientes: z.coerce.number().int().min(1, "Al menos 1 ambiente."),
  banos: z.coerce.number().int().min(0, "Mínimo 0 baños"),
  antiguedad: z.coerce.number().int().min(0, "Antigüedad no puede ser negativa"),
  cocheras: z.coerce.number().int().min(0, "Mínimo 0 cocheras").default(0),

  // Servicios (1:1 Parity Refactor)
  has_luz: z.boolean().default(false),
  has_gas: z.boolean().default(false),
  has_agua: z.boolean().default(false),
  has_expensas: z.boolean().default(false),
  has_abl: z.boolean().default(false),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

// Tipo devuelto por la API
export interface PropertyResponse {
  uid_prop: string;
  owner_id: string;
  inmobiliaria_id: string;
  direccion: string;
  status: 'DISPONIBLE' | 'ALQUILADA' | 'VENTA' | 'RESERVADA' | 'VENDIDA';
  valor_alquiler: string; // numeric(12,2) returned as string
  latitud: number | null;
  longitud: number | null;
  imagenes: string[]; 
  
  // Detalles Técnicos
  mts2: string;
  habitaciones: number;
  ambientes: number;
  banos: number;
  antiguedad: number;
  cocheras: number;

  // 1:1 Parity Columns
  has_luz: boolean;
  has_gas: boolean;
  has_agua: boolean;
  has_expensas: boolean;
  has_abl: boolean;

  created_at: string;
  updated_at: string;
}
