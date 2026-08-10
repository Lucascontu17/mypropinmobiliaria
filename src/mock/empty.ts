// Mock de @elysiajs/eden para rama MOCK - Datos enriquecidos
function mockRes<T>(d: T) { return { data: d, error: null, status: 200, headers: new Headers() }; }

// ─── PROPIETARIOS ───
const OWNER_NAMES = ["Roberto Álvarez", "Marcela Bianchi", "Héctor Campos", "Adriana Delgado", "Oscar Espinosa", "Norma Fuentes", "Gustavo Gallardo", "Patricia Heredia", "Ignacio Ibáñez", "Karina Juárez", "Luis Kessler", "Mónica Ledesma", "Néstor Moreno", "Olga Navarro", "Pedro Ortega", "Rosa Peralta", "Sergio Quiroga", "Tamara Roldán", "Ulises Salas", "Viviana Tapia", "Walter Uribe", "Ximena Vargas"];
const EMAIL_DOMAINS = ["@gmail.com", "@hotmail.com", "@yahoo.com.ar", "@fibertel.com.ar", "@outlook.com", "@live.com.ar", "@gmail.com", "@hotmail.com", "@gmail.com", "@empresa.com.ar"];
const OWNERS = OWNER_NAMES.map((nombre, i) => ({
  id: `prop-${i + 1}`,
  nombre,
  dni: `${18000000 + i * 1200000}`,
  email: `${nombre.toLowerCase().split(" ")[0]}${EMAIL_DOMAINS[i % EMAIL_DOMAINS.length]}`,
  celular: `+54 9 11 ${3000 + i * 1111}`,
  telefono: `+54 11 ${5000 + i * 99}`,
  cbu: `${10000000000000000 + i * 111111}`,
  propiedades_count: i < 8 ? 3 : i < 14 ? 2 : 1,
  clerk_id: i < 19 ? `clerk_user_${1000 + i}` : undefined,
  commission_type: i % 3 === 0 ? "percent" : "fixed",
  commission_value: i % 3 === 0 ? 3 + (i % 5) : 15000 + i * 2500,
}));

// ─── INQUILINOS ───
const TENANT_NAMES = ["Mariana González", "Carlos Rodríguez", "Lucía Fernández", "Juan Pablo Martínez", "Florencia López", "Diego García", "Valeria Sánchez", "Martín Pérez", "Carolina Díaz", "Fernando Torres", "Gabriela Romero", "Alejandro Ruiz", "Natalia Suárez", "Esteban Morales", "Cecilia Álvarez", "Ricardo Benítez", "Paula Giménez", "Leonardo Acosta", "Antonella Medina", "Santiago Herrera", "Romina Castro", "Pablo Mendoza", "Andrea Vega", "Gustavo Paz", "Laura Ríos", "Javier Duarte", "Silvina Correa", "Omar Sosa", "Daniela Ferro", "Matías Luna"];
const PROFESIONES = ["Abogado/a", "Médico/a", "Ingeniero/a", "Contador/a", "Arquitecto/a", "Docente", "Comerciante", "Diseñador/a Gráfico", "Programador/a", "Psicólogo/a", "Administrativo/a", "Chef", "Periodista", "Veterinario/a", "Kinesiólogo/a"];
const SCORING = ["Excelente", "Muy Bueno", "Bueno", "Bueno", "Regular", "Regular"];

const TENANTS = TENANT_NAMES.map((nombre, i) => ({
  id: `inq-${i + 1}`,
  nombre,
  dni: `${20000000 + i * 1500000}`,
  email: `${nombre.toLowerCase().split(" ")[0]}${EMAIL_DOMAINS[i % EMAIL_DOMAINS.length]}`,
  celular: `+54 9 11 ${5000 + i * 1111}`,
  telefono: `+54 11 ${4000 + i * 111}`,
  client_number: `TN-${String(1000 + i).padStart(4, "0")}`,
  clerk_id: i < 25 ? `clerk_user_tn_${2000 + i}` : undefined,
  profesion: PROFESIONES[i % PROFESIONES.length],
  scoring_pago: SCORING[i % SCORING.length],
}));

// ─── PROPIEDADES (enriquecidas, con propietario vinculado) ───
const BARRIOS = ["Palermo", "Belgrano", "Recoleta", "Caballito", "Villa Urquiza", "Almagro", "Colegiales", "Nuñez", "Saavedra", "Villa Crespo", "San Telmo", "Boedo", "Flores", "Devoto", "Villa del Parque", "Barrio Norte", "Retiro", "San Nicolás"];
const CALLES = ["Av. Santa Fe", "Av. Corrientes", "Av. Córdoba", "Av. Cabildo", "Av. Rivadavia", "Av. Las Heras", "Av. Libertador", "Av. Juan B. Justo", "Av. Pueyrredón", "Jorge Luis Borges", "Honduras", "Gorriti", "Paraguay", "Guatemala", "El Salvador", "Nicaragua", "Costa Rica", "Thames", "Fitz Roy", "Bonpland"];
const ORIENTACIONES = ["Norte", "Sur", "Este", "Oeste", "Noreste", "Noroeste", "Contrafrente"];
const ESTADOS = ["disponible", "alquilado", "alquilado", "alquilado", "reservado", "alquilado", "alquilado", "en_refaccion", "alquilado", "alquilado"];

const STATUS_OPTIONS = ["DISPONIBLE", "ALQUILADA", "VENTA", "RESERVADA", "VENDIDA", "ALQUILADA", "ALQUILADA", "DISPONIBLE", "ALQUILADA", "ALQUILADA"];
const OPERACION_OPTIONS = ["alquiler", "alquiler", "alquiler", "venta", "alquiler", "alquiler", "venta", "alquiler", "alquiler", "venta"];

const PROPIEDADES = Array.from({ length: 35 }, (_, i) => {
  const barrioIdx = i % BARRIOS.length;
  const barrio = BARRIOS[barrioIdx];
  const calle = CALLES[i % CALLES.length];
  const altura = 200 + Math.floor(Math.random() * 5800);
  const piso = 1 + Math.floor(Math.random() * 14);
  const depto = "ABCDEFGH".charAt(i % 8);
  const ambientes = i < 10 ? 1 : i < 20 ? 2 : i < 28 ? 3 : 4;
  const habitaciones = ambientes;
  const banos = ambientes === 1 ? 1 : ambientes >= 3 ? 2 : 1;
  const sup = ambientes === 1 ? 28 + Math.floor(Math.random() * 20) : ambientes === 2 ? 45 + Math.floor(Math.random() * 25) : ambientes === 3 ? 62 + Math.floor(Math.random() * 35) : 80 + Math.floor(Math.random() * 50);
  const ownerIdx = i < 22 ? i : i - 22;
  const owner = OWNERS[ownerIdx];
  const cochera = i % 3 === 0;
  const mascotas = i % 4 !== 0;
  const aptoProf = i % 5 === 0;

  const zonaCara = ["Palermo", "Belgrano", "Recoleta", "Barrio Norte", "Puerto Madero", "Retiro"].includes(barrio);
  const operacion = OPERACION_OPTIONS[i % OPERACION_OPTIONS.length];
  const baseAlquiler = zonaCara ? 180000 : ambientes === 1 ? 95000 : ambientes === 2 ? 140000 : ambientes === 3 ? 220000 : 300000;
  const valorAlquiler = baseAlquiler + Math.floor(Math.random() * baseAlquiler * 0.6);
  const valorVenta = operacion === 'venta' ? (zonaCara ? 90000000 : 55000000) + Math.floor(Math.random() * (zonaCara ? 110000000 : 45000000)) : undefined;
  const status = operacion === 'venta' ? (i % 3 === 0 ? 'VENTA' : i % 3 === 1 ? 'RESERVADA' : 'VENDIDA') : STATUS_OPTIONS[i % STATUS_OPTIONS.length];

  const amenitiesPool = ["Parrilla", "Pileta climatizada", "Gimnasio completo", "Balcón con vista", "Cochera fija", "Seguridad 24hs", "Terraza panorámica", "Lavadero", "SUM", "Ascensor", "Aire acondicionado frío/calor", "Amoblado", "Baulera", "Jardín", "Quincho", "Sauna", "Hidromasaje", "Laundry"];
  const ams: string[] = [];
  const numAms = 3 + Math.floor(Math.random() * 6);
  for (let a = 0; a < numAms; a++) {
    const am = amenitiesPool[Math.floor(Math.random() * amenitiesPool.length)];
    if (!ams.includes(am)) ams.push(am);
  }
  const serviciosStr = ams.join(", ");

  return {
    uid_prop: `prop-imm-${i + 1}`,
    id: `prop-imm-${i + 1}`,
    titulo: `${ambientes === 1 ? "Monoambiente" : ambientes === 2 ? "Departamento de 2 ambientes" : ambientes === 3 ? "Departamento de 3 ambientes" : "Departamento de 4 ambientes"} en ${barrio}`,
    tipo: i < 28 ? "departamento" : i < 32 ? "casa" : "ph",
    direccion: `${calle} ${altura}, Piso ${piso}º "${depto}"`,
    barrio,
    ciudad: i < 30 ? "Ciudad Autónoma de Buenos Aires" : "Vicente López",
    provincia: i < 30 ? "CABA" : "Buenos Aires",
    pais: "AR",
    operacion,
    status,
    ambientes,
    habitaciones,
    dormitorios: habitaciones,
    banos,
    mts2: sup,
    superficie_total: sup + (Math.random() > 0.5 ? Math.floor(Math.random() * 8) : 0),
    superficie_cubierta: sup,
    antiguedad: Math.floor(Math.random() * 55) + 1,
    orientacion: ORIENTACIONES[i % ORIENTACIONES.length],
    piso_numero: piso,
    piso_depto: depto,
    cochera: cochera ? (Math.random() > 0.5 ? 1 : 2) : 0,
    mascotas,
    apto_profesional: aptoProf,
    valor_alquiler: valorAlquiler,
    valor_venta: valorVenta,
    precio_alquiler: valorAlquiler,
    precio_venta: valorVenta,
    moneda: operacion === 'venta' ? "USD" : "ARS",
    expensas: Math.floor(valorAlquiler * (zonaCara ? 0.1 : 0.07)),
    estado: status,
    has_luz: true,
    has_gas: i % 5 !== 0,
    has_agua: true,
    has_expensas: true,
    servicios: serviciosStr,
    amenities: ams,
    fotos: [] as string[],
    destacado: i < 8,
    puntos: Math.floor(Math.random() * 500),
    propietario_id: owner.id,
    propietario_nombre: owner.nombre,
    inmobiliaria_id: "imm_001",
    descripcion: `${ambientes === 1 ? "Excelente monoambiente" : ambientes === 2 ? "Hermoso departamento de 2 ambientes" : ambientes === 3 ? "Amplio departamento de 3 ambientes" : "Espectacular departamento de 4 ambientes"} ubicado en el corazón de ${barrio}. ${cochera ? "Cuenta con cochera fija. " : ""}${mascotas ? "Se aceptan mascotas. " : ""}${aptoProf ? "Apto uso profesional. " : ""}Excelente luminosidad gracias a su orientación ${ORIENTACIONES[i % ORIENTACIONES.length].toLowerCase()}. Servicios incluidos: ${serviciosStr}. A pasos de transporte público, comercios y espacios verdes. Edificio de categoría. Ideal para ${ambientes === 1 ? "estudiantes o profesionales" : ambientes === 2 ? "parejas" : "familias"} que buscan calidad de vida.`,
    created_at: `2025-0${6 + (i % 3)}-${String(1 + (i % 28)).padStart(2, "0")}T10:00:00Z`,
  };
});

// ─── CONTRATOS (enriquecidos) ───
const GARANTES_NOMBRES = ["José Luis Pérez", "María Elena Sosa", "Ramón Castillo", "Teresa Olmos", "Fabián Duarte", "Claudia Rinaldi", "Hugo Montenegro", "Liliana Baez", "Emilio Fontana", "Graciela Lugo", "Daniel Coria", "Andrea Mansilla"];
const CONTRATOS = Array.from({ length: 28 }, (_, i) => {
  const prop = PROPIEDADES[i % 35];
  const tenant = TENANTS[i % 30];
  const inicioAnio = 2023 + Math.floor(i / 10);
  const inicioMes = ((i * 3) % 12) + 1;
  const duracion = [24, 24, 36, 36, 36, 24, 36][i % 7];
  const vencAnio = inicioAnio + Math.floor((inicioMes + duracion - 1) / 12);
  const vencMes = ((inicioMes + duracion - 1) % 12) + 1;

  return {
    id: `contrato-${i + 1}`,
    propiedad_id: prop.id,
    propiedad: prop.direccion,
    propiedad_titulo: prop.titulo,
    propiedad_direccion: prop.direccion,
    inquilino: tenant.nombre,
    inquilino_id: tenant.id,
    inquilino_nombre: tenant.nombre,
    propietario_id: prop.propietario_id,
    propietario_nombre: prop.propietario_nombre,
    precio: prop.precio_alquiler,
    monto_mensual: prop.precio_alquiler,
    moneda: "ARS",
    indice_ajuste: i % 3 === 0 ? "ICL" : i % 3 === 1 ? "IPC" : "Mixto ICL+IPC",
    duracion_meses: duracion,
    fecha_inicio: `${inicioAnio}-${String(inicioMes).padStart(2, "0")}-01`,
    fecha_fin: `${vencAnio}-${String(vencMes).padStart(2, "0")}-01`,
    fecha_vencimiento: `${vencAnio}-${String(vencMes).padStart(2, "0")}-01`,
    estado: i < 18 ? "ACTIVO" : i < 22 ? "proximo_a_vencer" : i < 25 ? "vencido" : "renovado",
    deposito: prop.precio_alquiler,
    propietario: prop.propietario_nombre,
    reglas_aumento: {
      aplicar_aumento: true,
      tipo_aumento: i % 2 === 0 ? "PORCENTAJE" : "MONTO_FIJO",
      periodicidad: i % 3 === 0 ? "cada_6_meses" : "cada_12_meses",
      porcentaje: i % 2 === 0 ? 25 + (i % 6) * 5 : undefined,
      monto_fijo: i % 2 !== 0 ? 15000 + i * 2000 : undefined,
    },
    reglas_mora: {
      aplicar_mora: i % 4 !== 0,
      periodicidad: i % 3 === 0 ? "diario" : "mensual",
      porcentaje: i % 3 === 0 ? 0.5 : 5,
      dias_gracia: 5 + (i % 5),
    },
    garantes: [
      { nombre: GARANTES_NOMBRES[(i * 2) % GARANTES_NOMBRES.length], dni: `${28000000 + i * 700}`, vinculo: "Familiar" },
      { nombre: GARANTES_NOMBRES[(i * 2 + 1) % GARANTES_NOMBRES.length], dni: `${29000000 + i * 800}`, vinculo: i % 2 === 0 ? "Laboral" : "Familiar" },
    ],
    created_at: `202${3 + Math.floor(i / 10)}-${String(inicioMes).padStart(2, "0")}-05T10:00:00Z`,
  };
});

// ─── PAGOS / COBRANZAS ───
const PAGOS = Array.from({ length: 65 }, (_, i) => {
  const contrato = CONTRATOS[i % 28];
  const mes = 6 + Math.floor(i / 22);
  const anio = 2025;
  const periodo = `${anio}-${String(mes).padStart(2, "0")}`;
  const montoBase = contrato.monto_mensual;
  const expensas = Math.floor(montoBase * 0.08);
  const abl = Math.floor(2500 + Math.random() * 5000);
  const comision = Math.floor(montoBase * 0.06);
  const mora = i % 7 === 0 ? Math.floor(montoBase * 0.05) : 0;
  const montoAbonar = montoBase + expensas + abl + comision + mora;
  const pagado = i % 7 === 0 ? 0 : i % 10 === 0 ? Math.floor(montoAbonar * 0.5) : montoAbonar;

  return {
    pago_id: `pago-${i + 1}`,
    id: `pago-${i + 1}`,
    contrato_id: contrato.id,
    inmobiliaria_id: "imm_001",
    periodo,
    nombre_inquilino: contrato.inquilino_nombre,
    detalle_propiedad: contrato.propiedad_direccion,
    monto_a_abonar: montoAbonar,
    monto_abonado: pagado,
    monto_alquiler_base: montoBase,
    monto_expensas: expensas,
    tipo_abl: i % 2 === 0 ? 'fijo' : 'variable',
    monto_abl: abl,
    comision_administracion: comision,
    status: pagado === 0 ? 'PENDIENTE' : pagado < montoAbonar ? 'PARCIAL' : 'PAGADO',
    fecha_vencimiento: `${periodo}-10`,
    fecha_pago: pagado > 0 ? `${periodo}-${String(1 + (i % 10)).padStart(2, "0")}` : null,
    metodo_pago: ["TRANSFERENCIA", "EFECTIVO", "MERCADO_PAGO", "OTRO"][i % 4],
    moneda: "ARS",
  };
});

// ─── EQUIPO ───
const EQUIPO = [
  { id: "u1", nombre: "Martín Gutiérrez", role: "superadmin", email: "martin@propiedadesdelplata.com", celular: "+54 9 11 3123-4567", telefono: "+54 11 4500-1001", estado: "activo", fecha_alta: "2026-04-03" },
  { id: "u2", nombre: "Carolina Mendez", role: "admin", email: "caro@propiedadesdelplata.com", celular: "+54 9 11 4234-5678", telefono: "+54 11 4500-1002", estado: "activo", fecha_alta: "2026-04-15" },
  { id: "u3", nombre: "Alejandro Paz", role: "admin", email: "ale@propiedadesdelplata.com", celular: "+54 9 11 5345-6789", telefono: "+54 11 4500-1003", estado: "activo", fecha_alta: "2026-05-02" },
  { id: "u4", nombre: "Laura Esquivel", role: "vendedor", email: "laura@propiedadesdelplata.com", celular: "+54 9 11 6456-7890", telefono: "+54 11 4500-1004", estado: "activo", fecha_alta: "2026-05-10" },
  { id: "u5", nombre: "Diego Ramírez", role: "vendedor", email: "diego@propiedadesdelplata.com", celular: "+54 9 11 7567-8901", telefono: "+54 11 4500-1005", estado: "suspendido", fecha_alta: "2026-05-18" },
  { id: "u6", nombre: "Sofía Castellano", role: "vendedor", email: "sofi@propiedadesdelplata.com", celular: "+54 9 11 8678-9012", telefono: "+54 11 4500-1006", estado: "activo", fecha_alta: "2026-05-28" },
  { id: "u7", nombre: "Germán Oliva", role: "vendedor", email: "ger@propiedadesdelplata.com", celular: "+54 9 11 9789-0123", telefono: "+54 11 4500-1007", estado: "activo", fecha_alta: "2026-06-07" },
  { id: "u8", nombre: "Marcela Duarte", role: "admin", email: "marce@propiedadesdelplata.com", celular: "+54 9 11 1548-9876", telefono: "+54 11 4500-1008", estado: "activo", fecha_alta: "2026-06-21" },
];

// ─── VISITAS ───
const VISITAS = [
  { id: "visita-1", propiedad: { direccion: PROPIEDADES[0].direccion, titulo: PROPIEDADES[0].titulo }, cliente: { nombre: "Mariana López", celular: "+54 9 11 5678-1234", email: "mariana.lopez@gmail.com" }, fecha: "2025-08-11", hora: "10:00", status: "PROGRAMADA", mensaje_visitante: "Busco monoambiente para mudarme en septiembre, idealmente con balcón.", propiedad_id: PROPIEDADES[0].id },
  { id: "visita-2", propiedad: { direccion: PROPIEDADES[2].direccion, titulo: PROPIEDADES[2].titulo }, cliente: { nombre: "Carlos Pérez", celular: "+54 9 11 6789-2345", email: "cperez@hotmail.com" }, fecha: "2025-08-11", hora: "14:00", status: "PENDIENTE", mensaje_visitante: "Somos una pareja con un hijo de 3 años, necesitamos mínimo 2 ambientes y que acepten mascotas.", propiedad_id: PROPIEDADES[2].id },
  { id: "visita-3", propiedad: { direccion: PROPIEDADES[5].direccion, titulo: PROPIEDADES[5].titulo }, cliente: { nombre: "Lucía Gómez", celular: "+54 9 11 7890-3456", email: "luciag@fibertel.com.ar" }, fecha: "2025-08-12", hora: "11:30", status: "PROGRAMADA", mensaje_visitante: "Vengo con garantía propietaria de mi viejo. Ingresaría en octubre. Estoy vendiendo mi depto actual.", propiedad_id: PROPIEDADES[5].id },
  { id: "visita-4", propiedad: { direccion: PROPIEDADES[10].direccion, titulo: PROPIEDADES[10].titulo }, cliente: { nombre: "Diego Fernández", celular: "+54 9 11 8901-4567", email: "diegof@gmail.com" }, fecha: "2025-08-12", hora: "16:00", status: "REALIZADA", mensaje_visitante: "Ya hice la visita, me gustó mucho la propiedad. Estoy evaluando con mi abogado el contrato.", propiedad_id: PROPIEDADES[10].id },
  { id: "visita-5", propiedad: { direccion: PROPIEDADES[15].direccion, titulo: PROPIEDADES[15].titulo }, cliente: { nombre: "Valeria Ruiz", celular: "+54 9 11 9012-5678", email: "valeriaruiz@hotmail.com" }, fecha: "2025-08-13", hora: "09:00", status: "CANCELADA", mensaje_visitante: "Tuve que cancelar por un imprevisto familiar. Me gustaría reprogramar para la semana que viene.", propiedad_id: PROPIEDADES[15].id },
  { id: "visita-6", propiedad: { direccion: PROPIEDADES[1].direccion, titulo: PROPIEDADES[1].titulo }, cliente: { nombre: "Federico Aguirre", celular: "+54 9 11 3456-7890", email: "fedeaguirre@yahoo.com.ar" }, fecha: "2025-08-13", hora: "15:30", status: "PROGRAMADA", mensaje_visitante: "Primera vez que alquilo solo. Vengo de Zona Norte, busco algo luminoso, con cochera si es posible.", propiedad_id: PROPIEDADES[1].id },
  { id: "visita-7", propiedad: { direccion: PROPIEDADES[8].direccion, titulo: PROPIEDADES[8].titulo }, cliente: { nombre: "Paula Mendoza", celular: "+54 9 11 4567-8901", email: "paulamendozarg@gmail.com" }, fecha: "2025-08-14", hora: "11:00", status: "PENDIENTE", mensaje_visitante: "Estoy buscando comprar, no alquilar. Tengo un presupuesto de hasta USD 120.000. ¿Tienen opciones?", propiedad_id: PROPIEDADES[8].id },
];

// ─── MARKETPLACE ───
const MARKETPLACE = Array.from({ length: 20 }, (_, i) => ({
  id: `mp-${i + 1}`,
  nombre: ["Fotografía profesional HD con drone", "Recorrido virtual 3D Matterport", "Cartelería LED para fachada", "Seguro de caución alquileres", "Marketing digital inmobiliario", "Verificación de antecedentes penales", "Home staging profesional", "Video institucional con drone 4K", "Escribanía para compraventa", "Mudanza premium puerta a puerta", "Pintura integral de interiores", "Plomería general certificada", "Instalación eléctrica completa", "Gasista matriculado 24hs", "Limpieza profunda post-obra", "Jardinería y paisajismo", "Sistema de alarmas monitoreadas", "Tasación oficial martillero", "Cerramientos de balcón en aluminio", "Impermeabilización de terrazas"][i],
  categoria: ["Fotografía", "Tecnología", "Cartelería", "Seguros", "Marketing", "Verificación", "Decoración", "Fotografía", "Escribanía", "Mudanzas", "Refacciones", "Plomería", "Electricidad", "Gas", "Limpieza", "Jardinería", "Seguridad", "Tasaciones", "Construcción", "Construcción"][i],
  proveedor: ["DroneView S.A.", "3D Tours Argentina", "Cartelería Integral BA", "Seguros La Confianza", "MKT Inmobiliario", "VerifYA", "Home Staging Pro", "Aerial Films", "Torres & Asoc.", "Mudanzas Express", "Pinturería del Plata", "Plomería Total", "ElectroNorte", "Gas Natural Serv.", "CleanPro", "VerdeVida", "Shield Seguridad", "Tasaciones GBA", "Cerramientos YA", "ImperTech"][i],
  precio_referencia: [45000, 80000, 120000, 35000, 25000, 15000, 60000, 90000, 50000, 180000, 75000, 40000, 55000, 35000, 30000, 45000, 80000, 30000, 100000, 60000][i],
  moneda: "ARS",
  activo: i < 17,
}));

// ─── AUMENTOS ICL ───
const AUMENTOS = Array.from({ length: 12 }, (_, m) => {
  const base = 85000 + m * 12000;
  const icl = 45 + m * 6;
  return {
    mes: m + 1,
    anio: 2026,
    porcentaje_icl: icl,
    monto_actual: base,
    monto_proyectado: Math.floor(base * (1 + icl / 100)),
    diferencia: Math.floor(base * (icl / 100)),
  };
});

// ─── PROXY EDEN ───
function createMockEdenProxy(): Record<string, unknown> {
  return new Proxy({}, {
    get(_: unknown, p: string) {
      if (p === 'then') return undefined;
      if (p === 'admin') {
        return new Proxy({}, {
          get(_2, p2: string) {
            if (p2 === 'metrics') return { get: async () => mockRes({ metrics: { totalPropiedades: 35, cobranzaMes: 1850000, deudaPendiente: 320000, tasaOcupacion: 91, comisionesEstimadas: 222000, proximosVencimientos: 4, visitasHoy: 7, suscripcion: { is_vip: false, status: 'activa', monto_base: 25000, acumulado_ia: 12500, total_proximo: 37500, fecha_vencimiento: '2026-06-15' } } }) };
            if (p2 === 'owners' || p2 === 'propietarios') return { get: async () => mockRes({ owners: OWNERS }) };
            if (p2 === 'tenants' || p2 === 'inquilinos') return { get: async () => mockRes({ inquilinos: TENANTS }) };
            if (p2 === 'propiedades' || p2 === 'properties') return { get: async () => mockRes({ propiedades: PROPIEDADES }) };
            if (p2 === 'contratos' || p2 === 'contracts') return { get: async () => mockRes({ contratos: CONTRATOS }) };
            if (p2 === 'pagos') return { get: async () => mockRes({ pagos: PAGOS }) };
            if (p2 === 'cobranzas') {
              return new Proxy({}, {
                get(_3, p3: string) {
                  if (p3 === 'proyeccion-aumentos') {
                    return {
                      get: async () => mockRes({ data: {
                        periodo_proyectado: "2025-09",
                        total_contratos_con_aumento: 18,
                        total_incremento_recaudacion: 245000,
                        indices_vigentes: { ICL: 58.2, IPC: 4.6 },
                        proyecciones: Array.from({ length: 18 }, (_, i) => {
                          const contrato = CONTRATOS[i % 28];
                          return {
                            contrato_id: contrato.id,
                            periodo_proyectado: "2025-09",
                            inquilino_nombre: contrato.inquilino_nombre,
                            inquilino_email: TENANTS[i % 30].email,
                            detalle_propiedad: contrato.propiedad_direccion,
                            tipo_inmueble: PROPIEDADES[i % 35].tipo,
                            monto_actual: contrato.monto_mensual,
                            monto_proyectado: Math.floor(contrato.monto_mensual * 1.58),
                            diferencia: Math.floor(contrato.monto_mensual * 0.58),
                            tipo_aumento: (["INDICE_ICL", "INDICE_IPC", "PORCENTAJE_MANUAL", "MONTO_FIJO"] as const)[i % 4],
                            porcentaje_aplicado: [58.2, 4.6, 55, 0][i % 4],
                            indice_usado: i % 4 < 2 ? ["ICL", "IPC"][i % 2] : null,
                            periodicidad: i % 2 === 0 ? "cada_6_meses" : "cada_12_meses",
                            meses_transcurridos: 6 + (i % 6),
                          };
                        })
                      }})
                    };
                  }
                  return new Proxy({}, { get() { return async () => mockRes({}); } });
                },
              });
            }
            if (p2 === 'visitas') return { get: async () => mockRes({ visitas: VISITAS }) };
            if (p2 === 'equipo' || p2 === 'team') return { get: async () => mockRes({ data: EQUIPO }) };
            if (p2 === 'me') return { get: async () => mockRes({ nombre: "Propiedades del Plata", logo_url: "", suscripcion: { status: "activa", isBlocked: false, is_vip: false, fecha_vencimiento: "2026-06-15", proximo_pago: "2026-05-15" } }) };
            if (p2 === 'configuracion' || p2 === 'config') return { get: async () => mockRes({ inmobiliaria: { nombre: "Propiedades del Plata", logo_url: "", direccion: "Av. Santa Fe 2500, 2º Piso, CABA", telefono: "+54 11 4500-1234", email: "info@propiedadesdelplata.com", cuit: "30-71234567-8" }, suscripcion: { plan: "profesional", status: "activa", isBlocked: false, monto_mensual: 25000, moneda: "ARS", fecha_vencimiento: "2026-06-15", proximo_pago: "2026-05-15" } }) };
            if (p2 === 'suscripcion') return { get: async () => mockRes({ plan: "profesional", status: "activa", isBlocked: false, is_vip: false, monto: 25000, moneda: "ARS", fecha_vencimiento: "2026-06-15", proximo_pago: "2026-05-15" }) };
            return new Proxy({}, { get() { return async () => mockRes({}); } });
          },
        });
      }
      return new Proxy({}, { get() { return async () => mockRes({}); } });
    },
  }) as Record<string, unknown>;
}

export const mockEden = createMockEdenProxy();
export function treaty<T>(_url: string, _config?: unknown): T { return mockEden as unknown as T; }