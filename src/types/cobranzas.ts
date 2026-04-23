import { z } from 'zod';

export const MetodoPagoEnum = z.enum([
  'EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'OTRO'
]);

/**
 * Zod Schema para Registrar Ingresos (Transacciones de pago)
 * Frontend -> POST /api/v1/transacciones
 */
export const transaccionSchema = z.object({
  inmobiliaria_id: z.string().uuid().optional(), // Inyectado programáticamente, NO por UI
  pago_id: z.string().uuid({ message: "Se requiere un ID de pago/cuota válido." }),
  
  monto: z.coerce.number().positive("El monto a registrar debe ser numérico y mayor a $0"),
  metodo: MetodoPagoEnum.default('TRANSFERENCIA'),
  
  fecha: z.string()
    .min(10, "Fecha inválida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Debe ser YYYY-MM-DD")
});

export type TransaccionFormData = z.infer<typeof transaccionSchema>;


/**
 * Zod Schema para el Cierre de Periodo (Rollover Action)
 * Frontend -> POST /api/v1/pagos/generar-siguiente
 */
export const cierrePeriodoSchema = z.object({
  inmobiliaria_id: z.string().uuid().optional(), // Inyectado programáticamente, NO por UI
  periodo_actual: z.string()
    .regex(/^\d{4}-\d{2}$/, "El periodo debe ser YYYY-MM (Ej. 2026-04)")
});

export type CierrePeriodoData = z.infer<typeof cierrePeriodoSchema>;

// Tipo visual para la Tabla Cuenta Corriente UI
export interface PagoEnCuenta {
  pago_id: string;
  contrato_id: string;
  inmobiliaria_id: string;
  periodo: string; // YYYY-MM
  nombre_inquilino: string;
  detalle_propiedad: string;
  
  monto_a_abonar: number; // Monto Base + Mora N + Deuda Arrastrada N-1 + Expensas
  monto_abonado: number;  // Sumatoria real pagada
  monto_alquiler_base?: number; // Desglose: Alquiler puro
  monto_expensas?: number;      // Desglose: Expensas Comunes
  
  // Estado Dinámico: 
  // 'PAGADO' (a_abonar <= abonado), 
  // 'PARCIAL' (abonado > 0 y < a_abonar), 
  // 'PENDIENTE' (abonado == 0 y periodo == actual)
  // 'VENCIDO' (saldo > 0 y periodo < actual)
  status: 'PAGADO' | 'PARCIAL' | 'PENDIENTE' | 'VENCIDO';
}
