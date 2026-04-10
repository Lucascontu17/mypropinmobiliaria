import { z } from 'zod';
import type { CountryCode } from '@/types/region';

/**
 * Validaciones Strictes (El Búnker v3.4.5)
 * DNI obligatorio para todos los actores.
 * Teléfonos bajo formato E.164 (Ej: +5491100000000)
 */

const e164Regex = /^\+[1-9]\d{1,14}$/;

export const ownerSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  dni: z.string()
    .min(7, 'El DNI/CUIT debe tener al menos 7 dígitos')
    .max(20, 'El DNI/CUIT es demasiado largo')
    .regex(/^\d+$/, 'El DNI/CUIT debe contener solo números'),
  email: z.string().email('Formato de email inválido'),
  celular: z.string()
    .regex(e164Regex, 'El celular debe tener formato internacional (Ej: +549...)'),
  cbu: z.string().min(5, 'CBU/Alias incompleto').optional().or(z.literal('')),
  comision_tipo: z.enum(['percent', 'fixed']),
  comision_valor: z.coerce.number()
    .min(0, 'La comisión no puede ser un valor negativo'),
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;

/** Payload final para Clerk + PostgreSQL (El Búnker) */
export const ownerCreateSchema = ownerSchema.extend({
  country_code: z.enum(['AR', 'MX', 'US']),
  role: z.literal('propietario'), 
  inmobiliaria_id: z.string().uuid()
});

export type OwnerCreatePayload = z.infer<typeof ownerCreateSchema>;

export const tenantSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  dni: z.string()
    .min(7, 'El DNI debe tener al menos 7 dígitos')
    .max(20, 'El DNI es demasiado largo')
    .regex(/^\d+$/, 'El DNI debe contener solo números')
    .optional()
    .or(z.literal('')), // Support empty initial state for Clients
  email: z.string().email('Formato de email inválido'),
  celular: z.string()
    .regex(e164Regex, 'El celular debe tener formato internacional (Ej: +549...)'),
  dni_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  contrato_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

/** Payload final para Clerk + PostgreSQL (El Búnker) */
export const tenantCreateSchema = tenantSchema.extend({
  country_code: z.enum(['AR', 'MX', 'US']),
  role: z.literal('inquilino'),
  inmobiliaria_id: z.string().uuid()
});

export type TenantCreatePayload = z.infer<typeof tenantCreateSchema>;
