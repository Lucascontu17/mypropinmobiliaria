import { z } from 'zod';

/**
 * Enums de Periodicidad para Aumentos e Intereses.
 * Deben coincidir con los de `mypropAPI` (El Búnker).
 */
export const IncreasePeriodEnum = z.enum([
  'mensual', 'bimestral', 'trimestral', 'cuatrimestral', 'semestral', 'anual'
]);

export const PenaltyPeriodEnum = z.enum([
  'diario', 'semanal', 'mensual'
]);

export const TipoAumentoEnum = z.enum(['PORCENTAJE_MANUAL', 'INDICE_ICL_IPC']);

/**
 * Zod Schema para Contratos (Transacción Atómica de Alquiler)
 * Garantiza integridad antes de enviar al Endpoint `POST /api/v1/contratos`.
 */
export const contratoSchema = z.object({
  inmobiliaria_id: z.string().uuid().optional(), // Inyectado programáticamente, NO por UI
  
  // Vínculos Atómicos
  uid_propiedad: z.string().uuid({ message: "Debe seleccionar una propiedad DISPONIBLE." }),
  uid_inquilino: z.string().uuid({ message: "Debe asignar un inquilino válido (con DNI)." }),
  
  // Ciclo de Vida del Contrato
  fecha_inicio: z.string()
    .min(10, "Fecha de inicio inválida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "El formato debe ser YYYY-MM-DD"),
  fecha_fin: z.string()
    .min(10, "Fecha de fin inválida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "El formato debe ser YYYY-MM-DD"),
  
  monto_inicial: z.coerce.number().positive("El monto de alquiler base debe ser mayor a 0"),

  // Reglas de Rentabilidad: Aumentos
  reglas_aumento: z.object({
    aplicar_aumento: z.boolean().default(false),
    tipo_aumento: TipoAumentoEnum.optional(), // Switch entre Manual y Referencia IPC/ICL
    periodicidad: IncreasePeriodEnum.optional(),
  }),

  // Reglas de Rentabilidad: Intereses Morosos (Deuda)
  reglas_mora: z.object({
    aplicar_mora: z.boolean().default(false),
    periodicidad: PenaltyPeriodEnum.optional(),
    porcentaje: z.coerce.number().min(0.1, "Debe especificar un porcentaje válido").optional(),
    dias_gracia: z.coerce.number().min(0).default(5)
  })
}).superRefine((data, ctx) => {
  // Validaciones custom condicionales
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
