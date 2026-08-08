export const MOCK_DATA = {
  metrics: {
    success: true,
    data: {
      totalPropiedades: 42,
      totalInquilinos: 28,
      cobranzaMes: 154500,
      tasaOcupacion: 85
    }
  },
  equipo: {
    success: true,
    data: [
      { id: '1', nombre: 'Lucas Contu', email: 'lucas@zonatia.com', role: 'admin', estado: 'activo', fecha_alta: '2024-01-15' },
      { id: '2', nombre: 'Maria Garcia', email: 'maria@zonatia.com', role: 'vendedor', estado: 'activo', fecha_alta: '2024-02-01' },
      { id: '3', nombre: 'Juan Perez', email: 'juan@zonatia.com', role: 'vendedor', estado: 'activo', fecha_alta: '2024-03-10' }
    ]
  },
  owners: {
    success: true,
    data: [
      { id: '1', nombre: 'Roberto Gomez', email: 'roberto@gmail.com', dni: '20.123.456', celular: '1122334455' },
      { id: '2', nombre: 'Elena Rodriguez', email: 'elena@hotmail.com', dni: '25.987.654', celular: '1199887766' }
    ]
  },
  propiedades: {
    success: true,
    data: [
      { uid_prop: 'p1', direccion: 'Av. Libertador 1200', tipo_inmueble: 'departamento', valor_alquiler: '50000', status: 'ALQUILADO' },
      { uid_prop: 'p2', direccion: 'Calle Falsa 123', tipo_inmueble: 'casa', valor_alquiler: '75000', status: 'DISPONIBLE' },
      { uid_prop: 'p3', direccion: 'Juramento 2500', tipo_inmueble: 'oficina', valor_alquiler: '120000', status: 'DISPONIBLE' }
    ]
  },
  inquilinos: {
    success: true,
    data: [
      { id: 'i1', nombre: 'Carlos Sanchez', email: 'carlos@gmail.com' },
      { id: 'i2', nombre: 'Ana Lopez', email: 'ana@gmail.com' }
    ]
  },
  contratos: {
    success: true,
    data: [
      { id: 'c1', propiedad: 'Av. Libertador 1200', inquilino: 'Carlos Sanchez', fecha_inicio: '2024-01-01', precio: 50000, estado: 'ACTIVO' },
      { id: 'c2', propiedad: 'Calle Falsa 123', inquilino: 'Ana Lopez', fecha_inicio: '2024-02-15', precio: 75000, estado: 'ACTIVO' }
    ]
  },
  visitas: {
    success: true,
    data: [
      { id: 'v1', propiedad_id: 'p2', nombre_interesado: 'Julian Rossi', fecha: '2024-04-25', status: 'PENDIENTE' }
    ]
  },
  pagos: {
    success: true,
    data: [
      { pago_id: 'pa1', nombre_inquilino: 'Carlos Sanchez', detalle_propiedad: 'Av. Libertador 1200', monto_a_abonar: 50000, monto_abonado: 50000, status: 'PAGADO', periodo: '2024-04' },
      { pago_id: 'pa2', nombre_inquilino: 'Ana Lopez', detalle_propiedad: 'Calle Falsa 123', monto_a_abonar: 75000, monto_abonado: 0, status: 'PENDIENTE', periodo: '2024-04' }
    ]
  }
};
