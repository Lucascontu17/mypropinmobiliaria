import { z } from 'zod';

/**
 * Enums de Periodicidad para Aumentos e Intereses.
 * Deben coincidir con los de `mypropAPI` (El Búnker).
 */
export const IncreasePeriodEnum = z.enum([
  'mensual', 'bimestral', 'trimestral', 'cuatrimestral', 'semestral', 'anual'
], { invalid_type_error: "Seleccione una periodicidad válida para aumentos" });

export const PenaltyPeriodEnum = z.enum([
  'diario', 'semanal', 'mensual'
], { invalid_type_error: "Seleccione una periodicidad válida para la mora" });

export const TipoAumentoEnum = z.enum(['PORCENTAJE_MANUAL', 'INDICE_ICL_IPC', 'INDICE_IPC', 'INDICE_ICL'], { invalid_type_error: "Seleccione un tipo de aumento válido" });

/**
 * Zod Schema para Contratos (Transacción Atómica de Alquiler)
 * Garantiza integridad antes de enviar al Endpoint `POST /api/v1/contratos`.
 */
export const contratoSchema = z.object({
  inmobiliaria_id: z.string().uuid().optional().or(z.literal('')), // Inyectado programáticamente, NO por UI
  
  // Vínculos Atómicos
  uid_propiedad: z.string().uuid({ message: "Debe seleccionar una propiedad DISPONIBLE." }),
  
  // Selección o Creación de Inquilino
  is_nuevo_inquilino: z.boolean().default(false),
  uid_inquilino: z.string().uuid({ message: "ID de inquilino no es un UUID válido." }).optional().or(z.literal('')), 
  
  // Datos de Inquilino (Si se crea nuevo)
  nuevo_inquilino: z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional().or(z.literal('')),
    dni: z.string().min(7, 'DNI incompleto').optional().or(z.literal('')),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    celular: z.string().optional().or(z.literal('')),
    dni_url: z.any().optional(),
    contrato_url: z.any().optional(),
    client_number: z.string().optional().or(z.literal('')), // Para vinculación global
  }).optional(),
  
  // Ciclo de Vida del Contrato
  fecha_inicio: z.string({ required_error: "La fecha de inicio es requerida", invalid_type_error: "Formato de fecha de inicio inválido" })
    .min(10, "Fecha de inicio incompleta")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "El formato debe ser YYYY-MM-DD"),
  fecha_fin: z.string({ required_error: "La fecha de fin es requerida", invalid_type_error: "Formato de fecha de fin inválido" })
    .min(10, "Fecha de fin incompleta")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "El formato debe ser YYYY-MM-DD"),
  
  monto_inicial: z.coerce.number({ invalid_type_error: "Monto inválido" }).positive("El monto de alquiler base debe ser mayor a 0"),
  
  // Condición de Inserción
  pago_mes_curso: z.boolean().default(false),

  // Reglas de Rentabilidad: Aumentos
  reglas_aumento: z.object({
    aplicar_aumento: z.boolean().default(false),
    tipo_aumento: TipoAumentoEnum.optional().or(z.literal('')), // Switch entre Manual y Referencia IPC/ICL
    periodicidad: IncreasePeriodEnum.optional().or(z.literal('')),
    porcentaje: z.coerce.number({ invalid_type_error: "Porcentaje inválido" }).min(0.1, "El porcentaje debe ser mayor a 0").optional().or(z.literal('')),
  }),

  // Reglas de Rentabilidad: Intereses Morosos (Deuda)
  reglas_mora: z.object({
    aplicar_mora: z.boolean().default(false),
    periodicidad: PenaltyPeriodEnum.optional().or(z.literal('')),
    porcentaje: z.coerce.number({ invalid_type_error: "Porcentaje de mora inválido" }).min(0.1, "Debe especificar un porcentaje válido").optional().or(z.literal('')),
    dias_gracia: z.coerce.number({ invalid_type_error: "Días de gracia inválido" }).min(0, "Los días de gracia no pueden ser negativos").default(5)
  })
}).superRefine((data, ctx) => {
  // Validaciones custom condicionales
  if (data.is_nuevo_inquilino) {
    if (!data.nuevo_inquilino?.nombre) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nuevo_inquilino', 'nombre'], message: "El nombre es obligatorio." });
    }
    if (!data.nuevo_inquilino?.dni) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nuevo_inquilino', 'dni'], message: "El DNI es obligatorio." });
    }
  } else {
    if (!data.uid_inquilino) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['uid_inquilino'], message: "Debe seleccionar un inquilino." });
    }
  }

  if (data.reglas_aumento.aplicar_aumento) {
    if (!data.reglas_aumento.periodicidad) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reglas_aumento', 'periodicidad'],
        message: "Especifique cada cuánto tiempo se actualizará el alquiler."
      });
    }
    if (!data.reglas_aumento.tipo_aumento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reglas_aumento', 'tipo_aumento'],
        message: "Especifique la forma de ajuste (porcentaje mensual/fijo o mediante índice base)."
      });
    }
  }

  if (data.reglas_mora.aplicar_mora) {
    if (!data.reglas_mora.periodicidad) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reglas_mora', 'periodicidad'],
        message: "Especifique el plazo en el que corre el interés moroso."
      });
    }
    if (!data.reglas_mora.porcentaje) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reglas_mora', 'porcentaje'],
        message: "Especifique la tasa a cobrar (Ej. 1% diario)."
      });
    }
  }
  
  if (new Date(data.fecha_inicio) >= new Date(data.fecha_fin)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fecha_fin'],
      message: "La fecha de finalización debe ser posterior a la de inicio."
    });
  }
});

export type ContratoFormData = z.infer<typeof contratoSchema>;
