// Mock del cliente Eden para mypropinmobiliaria - rama MOCK
// Devuelve los datos con las formas exactas que esperan las páginas del panel.

function mockRes<T>(data: T) {
  return { data, error: null, status: 200, headers: new Headers() };
}

// ─── ARRAYS BASE ───
const BARRIOS = ["Palermo", "Belgrano", "Recoleta", "Caballito", "Villa Urquiza", "Almagro", "Colegiales", "Nuñez", "Saavedra", "Villa Crespo", "San Telmo", "Puerto Madero", "Barrio Norte", "Boedo", "Flores", "Devoto", "Villa del Parque", "Vicente López", "San Isidro", "Tigre", "Martínez", "Olivos", "Lanús", "Lomas de Zamora", "Avellaneda", "Quilmes", "Ramos Mejía", "Morón"];
const CALLES = ["Av. Santa Fe", "Av. Corrientes", "Av. Córdoba", "Av. Cabildo", "Av. Rivadavia", "Jorge Luis Borges", "Honduras", "Gorriti", "Paraguay", "Guatemala", "Av. Libertador", "Av. Las Heras", "Av. Callao", "Costa Rica", "El Salvador", "Nicaragua", "Av. Juan B. Justo", "Av. Scalabrini Ortiz"];
const NOMBRES_INQUILINOS = ["Mariana González", "Carlos Rodríguez", "Lucía Fernández", "Juan Pablo Martínez", "Florencia López", "Diego García", "Valeria Sánchez", "Martín Pérez", "Carolina Díaz", "Fernando Torres", "Gabriela Romero", "Alejandro Ruiz", "Natalia Suárez", "Esteban Morales", "Cecilia Álvarez", "Ricardo Benítez", "Paula Giménez", "Leonardo Acosta", "Antonella Medina", "Santiago Herrera", "Romina Castro", "Pablo Mendoza", "Andrea Vega", "Gustavo Paz", "Laura Ríos", "Javier Duarte", "Silvina Correa", "Omar Sosa", "Daniela Ferro", "Matías Luna"];
const NOMBRES_PROPIETARIOS = ["Roberto Álvarez", "Marcela Bianchi", "Héctor Campos", "Adriana Delgado", "Oscar Espinosa", "Norma Fuentes", "Gustavo Gallardo", "Patricia Heredia", "Ignacio Ibáñez", "Karina Juárez", "Luis Kessler", "Mónica Ledesma", "Néstor Moreno", "Olga Navarro", "Pedro Ortega", "Rosa Peralta", "Sergio Quiroga", "Tamara Roldán", "Ulises Salas", "Viviana Tapia", "Walter Uribe", "Ximena Vargas"];

// ─── PROPIEDADES (forma PropertyResponse) ───
export const MOCK_PROPIEDADES = Array.from({ length: 35 }, (_, i) => {
  const tipo_inmueble = i < 25 ? "departamento" : i < 30 ? "casa" : i < 33 ? "ph" : "local";
  const estados = ["DISPONIBLE", "ALQUILADA", "VENTA", "RESERVADA", "VENDIDA"];
  const operacion = i % 3 === 0 ? "venta" : "alquiler";
  const direccion = `${CALLES[i % CALLES.length]} ${1000 + i * 137}`;
  return {
    uid_prop: `prop-imm-${i + 1}`,
    owner_id: `propietario-${(i % 22) + 1}`,
    inmobiliaria_id: "imm_001",
    direccion,
    titulo: `${tipo_inmueble === "departamento" ? "Depto" : tipo_inmueble === "casa" ? "Casa" : tipo_inmueble === "ph" ? "PH" : "Local"} en ${BARRIOS[i % BARRIOS.length]}`,
    propietario_nombre: NOMBRES_PROPIETARIOS[i % 22],
    tipo_inmueble,
    operacion,
    moneda: i < 10 ? "USD" : "ARS",
    valor_alquiler: 85000 + i * 12000,
    valor_venta: operacion === "venta" ? 85000000 + i * 5000000 : null,
    mts2: 35 + (i * 5) % 150,
    habitaciones: (i % 3) + 1,
    ambientes: (i % 3) + 1,
    banos: i % 2 === 0 ? 1 : 2,
    antiguedad: i % 20,
    cocheras: i % 2,
    has_luz: true,
    has_gas: i % 2 === 0,
    has_agua: true,
    has_expensas: i % 2 === 0,
    valor_expensas: i % 2 === 0 ? 8000 + i * 700 : null,
    has_abl: true,
    tipo_abl: "fijo",
    valor_abl: 5000 + i * 100,
    status: estados[i % estados.length],
    barrio: BARRIOS[i % BARRIOS.length],
    ciudad: i < 28 ? "CABA" : BARRIOS[i % BARRIOS.length],
    provincia: i < 28 ? "CABA" : "Buenos Aires",
    imagenes: [],
    latitud: null,
    longitud: null,
    descripcion: null,
    created_at: `2025-0${6 + (i % 3)}-${String(1 + (i % 28)).padStart(2, "0")}T10:00:00Z`,
    updated_at: "2025-08-01T10:00:00Z",
  };
});

// ─── CONTRATOS (forma que consume ContratosPage + ContratoDetailsModal) ───
export const MOCK_CONTRATOS = Array.from({ length: 28 }, (_, i) => ({
  id: `contrato-${i + 1}`,
  propiedad: `${CALLES[i % CALLES.length]} ${1000 + i * 137}, ${BARRIOS[i % BARRIOS.length]}`,
  propietario: NOMBRES_PROPIETARIOS[i % 22],
  inquilino: NOMBRES_INQUILINOS[i],
  fecha_inicio: `202${Math.floor(i / 10) + 2}-0${((i % 12) + 1).toString().padStart(2, "0")}-01`,
  fecha_fin: `202${Math.floor(i / 10) + 3}-0${((i % 12) + 1).toString().padStart(2, "0")}-01`,
  precio: 85000 + i * 15000,
  monto_mensual: 85000 + i * 15000,
  moneda: "ARS",
  indice_ajuste: i % 3 === 0 ? "ICL" : i % 3 === 1 ? "IPC" : "mixto",
  estado: i < 22 ? "ACTIVO" : i < 25 ? "PROXIMO_A_VENCER" : "VENCIDO",
  reglas_aumento: {
    aplicar_aumento: true,
    tipo_aumento: "INDICE_ICL",
    periodicidad: "semestral",
    porcentaje: 55 + (i % 4) * 5,
    monto_fijo: null,
  },
  reglas_mora: {
    aplicar_mora: true,
    periodicidad: "diario",
    porcentaje: 0.1,
    dias_gracia: 5,
  },
  contrato_url: null,
  dni_url: null,
}));

// ─── INQUILINOS ───
export const MOCK_INQUILINOS = Array.from({ length: 30 }, (_, i) => ({
  id: `inq-${i + 1}`,
  nombre: NOMBRES_INQUILINOS[i],
  dni: `${20000000 + i * 1500000}`,
  celular: `+54 11 ${4000 + i * 111}`,
  email: `inquilino${i + 1}@email.com`,
  client_number: `C-${1000 + i}`,
  status: i % 4 === 0 ? "CLIENT" : "ACTIVE",
  clerk_id: i % 3 === 0 ? `user_inq_${i}` : null,
  contrato_activo: i < 18 ? `contrato-${i + 1}` : null,
}));

// ─── PROPIETARIOS / OWNERS (endpoint admin.owners) ───
export const MOCK_PROPIETARIOS = Array.from({ length: 22 }, (_, i) => ({
  id: `propietario-${i + 1}`,
  nombre: NOMBRES_PROPIETARIOS[i],
  dni: `${18000000 + i * 1200000}`,
  celular: `+54 11 ${5000 + i * 99}`,
  telefono: `+54 11 ${5000 + i * 99}`,
  email: `propietario${i + 1}@email.com`,
  clerk_id: i % 4 === 0 ? `user_prop_${i}` : null,
  commission_type: i % 2 === 0 ? "percent" : "fixed",
  commission_value: i % 2 === 0 ? 8 : 25000,
  propiedades_ids: [MOCK_PROPIEDADES[i % 35].uid_prop],
}));

// ─── PAGOS (forma PagoEnCuenta) ───
export const MOCK_COBRANZAS = Array.from({ length: 65 }, (_, i) => {
  const montoBase = 85000 + (i % 28) * 15000;
  const montoExpensas = 8000 + (i % 10) * 500;
  const montoAbl = 4000;
  const total = montoBase + montoExpensas + montoAbl;
  const abonado = i % 7 === 0 ? 0 : i % 10 === 0 ? Math.round(total * 0.5) : total;
  const status = abonado === 0 ? (i % 3 === 0 ? "VENCIDO" : "PENDIENTE") : abonado >= total ? "PAGADO" : "PARCIAL";
  return {
    pago_id: `pago-${i + 1}`,
    contrato_id: `contrato-${(i % 28) + 1}`,
    inmobiliaria_id: "imm_001",
    periodo: i % 5 === 0 ? "2026-07" : "2026-08",
    nombre_inquilino: NOMBRES_INQUILINOS[i % 30],
    detalle_propiedad: `${CALLES[i % CALLES.length]} ${1000 + i * 137}, ${BARRIOS[i % BARRIOS.length]}`,
    monto_a_abonar: total,
    monto_abonado: abonado,
    monto_alquiler_base: montoBase,
    monto_expensas: montoExpensas,
    tipo_abl: "fijo",
    monto_abl: montoAbl,
    comision_administracion: Math.round(montoBase * 0.08),
    status,
  };
});

// ─── EQUIPO (forma que consume EquipoPage: data.data) ───
export const MOCK_EQUIPO = [
  { id: "u1", nombre: "Martín Gutiérrez", role: "superadmin", email: "martin@propdelplata.com", celular: "+54 11 4500-0001", estado: "activo", fecha_alta: "2022-03-15" },
  { id: "u2", nombre: "Carolina Mendez", role: "admin", email: "caro@propdelplata.com", celular: "+54 11 4500-0002", estado: "activo", fecha_alta: "2022-06-01" },
  { id: "u3", nombre: "Alejandro Paz", role: "admin", email: "ale@propdelplata.com", celular: "+54 11 4500-0003", estado: "activo", fecha_alta: "2022-09-20" },
  { id: "u4", nombre: "Laura Esquivel", role: "vendedor", email: "laura@propdelplata.com", celular: "+54 11 4500-0004", estado: "activo", fecha_alta: "2023-01-10" },
  { id: "u5", nombre: "Diego Ramírez", role: "vendedor", email: "diego@propdelplata.com", celular: "+54 11 4500-0005", estado: "activo", fecha_alta: "2023-04-05" },
  { id: "u6", nombre: "Sofía Castellano", role: "vendedor", email: "sofi@propdelplata.com", celular: "+54 11 4500-0006", estado: "activo", fecha_alta: "2023-07-22" },
  { id: "u7", nombre: "Germán Oliva", role: "vendedor", email: "ger@propdelplata.com", celular: "+54 11 4500-0007", estado: "activo", fecha_alta: "2024-02-14" },
  { id: "u8", nombre: "Marcela Duarte", role: "vendedor", email: "marce@propdelplata.com", celular: "+54 11 4500-0008", estado: "inactivo", fecha_alta: "2024-11-01" },
];

// ─── VISITAS (forma Visita de VisitasPage) ───
export const MOCK_VISITAS = Array.from({ length: 12 }, (_, i) => {
  const estados = ["PENDIENTE", "PROGRAMADA", "REALIZADA", "CANCELADA"];
  return {
    id: `visita-${i + 1}`,
    fecha_programada: `2026-08-${String(8 + i).padStart(2, "0")}T15:00:00Z`,
    status: estados[i % estados.length],
    mensaje_visitante: "Hola, quiero coordinar una visita para conocer la propiedad.",
    created_at: "2026-08-01T10:00:00Z",
    propiedad: { id: `prop-imm-${(i % 35) + 1}`, direccion: `${CALLES[i % CALLES.length]} ${1000 + i * 137}` },
    cliente: { id: `cliente-${i + 1}`, nombre: NOMBRES_INQUILINOS[i], celular: `+54 11 ${4000 + i * 13}`, email: `visitante${i + 1}@email.com` },
  };
});

// ─── DASHBOARD / METRICS ───
export const MOCK_METRICS = {
  totalPropiedades: 35,
  cobranzaMes: 1850000,
  deudaPendiente: 320000,
  tasaOcupacion: 94,
  comisionesEstimadas: 148000,
  proximosVencimientos: 4,
  visitasHoy: 5,
  suscripcion: {
    is_vip: false,
    status: "activa",
    fecha_vencimiento: "2026-06-15",
    monto_base: 25000,
    acumulado_ia: 4800,
    total_proximo: 29800,
  },
};

export const MOCK_SUSCRIPCION = {
  plan: "profesional",
  status: "activa",
  isBlocked: false,
  is_vip: false,
  fecha_vencimiento: "2026-06-15",
  proximo_pago: "2026-05-15",
  monto: 25000,
  moneda: "ARS",
};

// ─── MARKETPLACE (catálogo: addons + packages + balance) ───
export const MOCK_CATALOG = {
  addons: [
    { id: "addon-1", nombre: "Logo Personalizado en Panel", descripcion: "Muestra el logo propio de tu inmobiliaria en el panel de gestión.", icon_tag: "🏢", costo_mensual: 15000, active: true, is_acquired: true },
    { id: "addon-2", nombre: "Zonatia AI Copilot", descripcion: "Genera descripciones atractivas y optimizadas para SEO en cada propiedad.", icon_tag: "🤖", costo_mensual: 300, active: true, is_acquired: false },
    { id: "addon-3", nombre: "Recorrido Virtual 3D", descripcion: "Publica recorridos virtuales 360° para tus propiedades.", icon_tag: "🎥", costo_mensual: 12000, active: true, is_acquired: false },
    { id: "addon-4", nombre: "Booster de Visibilidad", descripcion: "Destaca tus propiedades en los primeros resultados de búsqueda.", icon_tag: "🚀", costo_mensual: 9000, active: true, is_acquired: false },
    { id: "addon-5", nombre: "Reportes Financieros Avanzados", descripcion: "Exporta reportes detallados de cobranza y rentabilidad.", icon_tag: "📊", costo_mensual: 7000, active: true, is_acquired: true },
    { id: "addon-6", nombre: "Firma Digital de Contratos", descripcion: "Firma contratos y documentos de forma 100% digital.", icon_tag: "✍️", costo_mensual: 5000, active: true, is_acquired: false },
  ],
  packages: [
    { id: "pack-1", nombre: "Pack Bronce", puntos: 100, precio: 10000, tier: "bronze", active: true },
    { id: "pack-2", nombre: "Pack Plata", puntos: 300, precio: 27000, tier: "silver", active: true },
    { id: "pack-3", nombre: "Pack Oro", puntos: 600, precio: 50000, tier: "gold", active: true },
  ],
  balance: 350,
};

// ─── BILLING (Suscripción) ───
export const MOCK_BILLING_SUMMARY = {
  total_amount: 25000,
  moneda: "ARS",
  proximo_vencimiento: "2026-05-15",
  estado: "activa",
  addons_total: 22000,
};

export const MOCK_BILLING_HISTORY = Array.from({ length: 6 }, (_, i) => ({
  id: `invoice-${i + 1}`,
  periodo: `2026-0${6 - i}`,
  monto: 25000 + i * 5000,
  moneda: "ARS",
  estado: i === 0 ? "pendiente" : "pagado",
  fecha_pago: i === 0 ? null : `2026-0${5 - i}-15`,
}));

// ─── PROYECCIÓN DE AUMENTOS ───
export const MOCK_PROYECCION = {
  periodo_proyectado: "2026-09",
  total_contratos_con_aumento: 12,
  total_incremento_recaudacion: 450000,
  indices_vigentes: { IPC: 4.2, ICL: 3.8 },
  proyecciones: Array.from({ length: 12 }, (_, i) => {
    const montoActual = 85000 + i * 15000;
    const porcentaje = 45 + i * 6;
    const montoProyectado = Math.round(montoActual * (1 + porcentaje / 100));
    return {
      contrato_id: `contrato-${i + 1}`,
      periodo_proyectado: "2026-09",
      inquilino_nombre: NOMBRES_INQUILINOS[i],
      inquilino_email: `inquilino${i + 1}@email.com`,
      detalle_propiedad: `${CALLES[i % CALLES.length]} ${1000 + i * 137}, ${BARRIOS[i % BARRIOS.length]}`,
      tipo_inmueble: "departamento",
      monto_actual: montoActual,
      monto_proyectado: montoProyectado,
      diferencia: montoProyectado - montoActual,
      tipo_aumento: i % 3 === 0 ? "INDICE_ICL" : i % 3 === 1 ? "INDICE_IPC" : "PORCENTAJE_MANUAL",
      porcentaje_aplicado: porcentaje,
      indice_usado: i % 3 === 0 ? "ICL" : i % 3 === 1 ? "IPC" : null,
      periodicidad: "semestral",
      meses_transcurridos: 6,
    };
  }),
};

// ─── PROXY EDEN ───
const VERBS = new Set(["get", "post", "patch", "delete", "put"]);

const ROUTES: Record<string, () => unknown> = {
  "admin.me.get": () => mockRes({ success: true, data: { nombre: "Propiedades del Plata", logo_url: "", enviar_whatsapp_rollover: true, enviar_email_onboarding: true, twilio_phone: "+54 11 4500-1234", suscripcion: MOCK_SUSCRIPCION } }),
  "admin.metrics.get": () => mockRes({ metrics: MOCK_METRICS }),
  "admin.propiedades.get": () => mockRes({ propiedades: MOCK_PROPIEDADES }),
  "admin.owners.get": () => mockRes({ owners: MOCK_PROPIETARIOS }),
  "admin.contratos.get": () => mockRes({ contratos: MOCK_CONTRATOS }),
  "admin.inquilinos.get": () => mockRes({ inquilinos: MOCK_INQUILINOS }),
  "admin.pagos.get": () => mockRes({ pagos: MOCK_COBRANZAS, periodo_activo: "2026-08" }),
  "admin.equipo.get": () => mockRes({ data: MOCK_EQUIPO }),
  "admin.visitas.get": () => mockRes({ visitas: MOCK_VISITAS }),
  "admin.cobranzas.proyeccion-aumentos.get": () => mockRes({ data: MOCK_PROYECCION }),
  "admin.configuracion.get": () => mockRes({ inmobiliaria: { nombre: "Propiedades del Plata", direccion: "Av. Santa Fe 2500, CABA", telefono: "+54 11 4500-1234", email: "info@propiedadesdelplata.com", pais: "AR" }, suscripcion: MOCK_SUSCRIPCION }),
  "marketplace.catalog.get": () => mockRes(MOCK_CATALOG),
  "billing.summary.get": () => mockRes(MOCK_BILLING_SUMMARY),
  "billing.history.get": () => mockRes(MOCK_BILLING_HISTORY),
};

function createEdenProxy(): any {
  const makeProxy = (path: string[]): any => {
    const fn: any = function () {};
    return new Proxy(fn, {
      get(_t, prop) {
        if (prop === "then") return undefined;
        if (prop === Symbol.toPrimitive || prop === Symbol.toStringTag || prop === Symbol.iterator) return undefined;
        if (typeof prop !== "string") return undefined;
        return makeProxy([...path, prop]);
      },
      apply(_t, _this, args) {
        const last = path[path.length - 1];
        if (VERBS.has(last)) {
          const key = path.join(".");
          const route = ROUTES[key];
          return route ? route() : mockRes(null);
        }
        // Ruta dinámica (Eden style): ej. client.admin.visitas({ id }).patch(...)
        const extra: string[] = [];
        const first = args[0];
        if (first && typeof first === "object" && !Array.isArray(first)) {
          for (const v of Object.values(first as Record<string, unknown>)) {
            if (typeof v === "string" || typeof v === "number") extra.push(String(v));
          }
        }
        return makeProxy([...path, ...extra]);
      },
    });
  };
  return makeProxy([]);
}

export const mockEden = createEdenProxy();



