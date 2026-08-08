// Mock del cliente Eden para mypropinmobiliaria - rama MOCK
// Intercepta todas las llamadas a la API y devuelve datos mock argentinos

import { delay } from "./env";

function mockRes<T>(data: T) { return { data, error: null, status: 200, headers: new Headers() }; }

// ─── DATOS MOCK ───

export const MOCK_PROPIEDADES = Array.from({ length: 35 }, (_, i) => {
  const barrios = ["Palermo", "Belgrano", "Recoleta", "Caballito", "Villa Urquiza", "Almagro", "Colegiales", "Nuñez", "Saavedra", "Villa Crespo", "San Telmo", "Puerto Madero", "Barrio Norte", "Boedo", "Flores", "Devoto", "Villa del Parque", "Vicente López", "San Isidro", "Tigre", "Martínez", "Olivos", "Lanús", "Lomas de Zamora", "Avellaneda", "Quilmes", "Ramos Mejía", "Morón"];
  const tipos = i < 25 ? "departamento" : i < 30 ? "casa" : i < 33 ? "ph" : "local";
  const calles = ["Av. Santa Fe", "Av. Corrientes", "Av. Córdoba", "Av. Cabildo", "Av. Rivadavia", "Jorge Luis Borges", "Honduras", "Gorriti", "Paraguay", "Guatemala", "Av. Libertador", "Av. Las Heras", "Av. Callao", "Costa Rica", "El Salvador", "Nicaragua", "Av. Juan B. Justo", "Av. Scalabrini Ortiz"];
  const estados = ["disponible", "alquilado", "reservado", "en_refaccion"];
  return {
    id: `prop-imm-${i + 1}`,
    titulo: `${tipos === "departamento" ? "Depto" : tipos === "casa" ? "Casa" : tipos === "ph" ? "PH" : "Local"} en ${barrios[i % barrios.length]}`,
    tipo: tipos,
    direccion: `${calles[i % calles.length]} ${1000 + i * 137}`,
    barrio: barrios[i % barrios.length],
    ciudad: i < 28 ? "CABA" : barrios[i % barrios.length],
    provincia: i < 28 ? "CABA" : "Buenos Aires",
    pais: "AR",
    ambientes: (i % 3) + 1,
    dormitorios: (i % 3) + 1,
    banos: i % 2 === 0 ? 1 : 2,
    superficie_total: 35 + (i * 5) % 150,
    superficie_cubierta: 30 + (i * 5) % 140,
    precio_alquiler: 85000 + (i * 12000),
    precio_venta: i < 10 ? 85000000 + (i * 5000000) : undefined,
    moneda: i < 10 ? "USD" : "ARS",
    expensas: 8000 + (i * 700),
    estado: estados[i % estados.length],
    amenities: ["Parrilla", "Pileta", "Gimnasio", "Terraza", "Balcón", "Cochera", "Seguridad 24hs", "Ascensor"].slice(0, 3 + (i % 5)),
    fotos: [],
    destacado: i < 10,
    inmobiliaria_id: "imm_001",
    created_at: `2025-0${6 + (i % 3)}-${String(1 + (i % 28)).padStart(2, "0")}T10:00:00Z`,
  };
});

export const MOCK_CONTRATOS = Array.from({ length: 28 }, (_, i) => ({
  id: `contrato-${i + 1}`,
  propiedad_id: MOCK_PROPIEDADES[i % 35].id,
  propiedad: MOCK_PROPIEDADES[i % 35],
  inquilino_id: `inq-${i + 1}`,
  inquilino_nombre: ["Mariana González", "Carlos Rodríguez", "Lucía Fernández", "Juan Pablo Martínez", "Florencia López", "Diego García", "Valeria Sánchez", "Martín Pérez", "Carolina Díaz", "Fernando Torres", "Gabriela Romero", "Alejandro Ruiz", "Natalia Suárez", "Esteban Morales", "Cecilia Álvarez", "Ricardo Benítez", "Paula Giménez", "Leonardo Acosta", "Antonella Medina", "Santiago Herrera", "Romina Castro", "Pablo Mendoza", "Andrea Vega", "Gustavo Paz", "Laura Ríos", "Javier Duarte", "Silvina Correa", "Omar Sosa"][i],
  monto_mensual: 85000 + i * 15000,
  moneda: "ARS",
  indice_ajuste: i % 3 === 0 ? "ICL" : i % 3 === 1 ? "IPC" : "mixto",
  fecha_inicio: `202${Math.floor(i / 10) + 2}-0${((i % 12) + 1).toString().padStart(2, "0")}-01`,
  fecha_vencimiento: `202${Math.floor(i / 10) + 3}-0${((i % 12) + 1).toString().padStart(2, "0")}-01`,
  estado: i < 18 ? "activo" : i < 22 ? "proximo_a_vencer" : i < 25 ? "vencido" : "renovado",
  deposito: 85000 + i * 15000,
  garantes: [{ nombre: `Garante ${i + 1}A`, dni: `${20000000 + i * 1000}` }, { nombre: `Garante ${i + 1}B`, dni: `${25000000 + i * 1000}` }],
  created_at: `2024-0${(i % 12) + 1}-${String(1 + (i % 28)).padStart(2, "0")}T10:00:00Z`,
}));

export const MOCK_INQUILINOS = Array.from({ length: 30 }, (_, i) => ({
  id: `inq-${i + 1}`,
  nombre: ["Mariana González", "Carlos Rodríguez", "Lucía Fernández", "Juan Pablo Martínez", "Florencia López", "Diego García", "Valeria Sánchez", "Martín Pérez", "Carolina Díaz", "Fernando Torres", "Gabriela Romero", "Alejandro Ruiz", "Natalia Suárez", "Esteban Morales", "Cecilia Álvarez", "Ricardo Benítez", "Paula Giménez", "Leonardo Acosta", "Antonella Medina", "Santiago Herrera", "Romina Castro", "Pablo Mendoza", "Andrea Vega", "Gustavo Paz", "Laura Ríos", "Javier Duarte", "Silvina Correa", "Omar Sosa", "Daniela Ferro", "Matías Luna"][i],
  dni: `${20000000 + i * 1500000}`,
  email: `inquilino${i + 1}@email.com`,
  telefono: `+54 11 ${4000 + i * 111}`,
  contrato_activo: i < 18 ? MOCK_CONTRATOS[i].id : null,
}));

export const MOCK_PROPIETARIOS = Array.from({ length: 22 }, (_, i) => ({
  id: `propietario-${i + 1}`,
  nombre: ["Roberto Álvarez", "Marcela Bianchi", "Héctor Campos", "Adriana Delgado", "Oscar Espinosa", "Norma Fuentes", "Gustavo Gallardo", "Patricia Heredia", "Ignacio Ibáñez", "Karina Juárez", "Luis Kessler", "Mónica Ledesma", "Néstor Moreno", "Olga Navarro", "Pedro Ortega", "Rosa Peralta", "Sergio Quiroga", "Tamara Roldán", "Ulises Salas", "Viviana Tapia", "Walter Uribe", "Ximena Vargas"][i],
  dni: `${18000000 + i * 1200000}`,
  email: `propietario${i + 1}@email.com`,
  telefono: `+54 11 ${5000 + i * 99}`,
  cbu: `${10000000000000000 + i * 111111}`,
  propiedades_ids: [MOCK_PROPIEDADES[i % 35].id, MOCK_PROPIEDADES[(i + 5) % 35].id].filter((_, idx) => idx < (i < 10 ? 1 : 2)),
}));

export const MOCK_COBRANZAS = Array.from({ length: 65 }, (_, i) => ({
  id: `pago-${i + 1}`,
  contrato_id: MOCK_CONTRATOS[i % 28].id,
  monto: 85000 + (i % 28) * 15000,
  moneda: "ARS",
  fecha_pago: `2025-0${6 + Math.floor(i / 22)}-${String(1 + (i % 28)).padStart(2, "0")}`,
  estado: i % 7 === 0 ? "pendiente" : i % 10 === 0 ? "parcial" : "pagado",
  metodo: ["transferencia", "efectivo", "deposito"][i % 3],
}));

export const MOCK_DASHBOARD = {
  ocupacion_porcentaje: 94,
  facturacion_mensual_ars: 1850000,
  facturacion_proyectada_anual_ars: 22000000,
  morosidad_porcentaje: 4.2,
  propiedades_vacantes: 3,
  contratos_activos: 18,
  contratos_por_renovar: 4,
  cobranza_pendiente: 320000,
  visitas_programadas_semana: 5,
  propiedades_total: 35,
  inquilinos_total: 30,
  propietarios_total: 22,
};

export const MOCK_MARKETPLACE = Array.from({ length: 20 }, (_, i) => ({
  id: `mp-${i + 1}`,
  nombre: ["Fotografía profesional HD", "Recorrido virtual 3D", "Cartelería LED", "Seguro de caución", "Marketing digital", "Verificación de antecedentes", "Home staging", "Drone inmobiliario", "Escribanía express", "Mudanza premium", "Pintura integral", "Plomería general", "Electricidad certificada", "Gasista matriculado", "Limpieza profunda", "Jardinería paisajística", "Seguridad electrónica", "Tasación oficial", "Cerramientos de balcón", "Impermeabilización"][i],
  categoria: ["Fotografía", "Tecnología", "Cartelería", "Seguros", "Marketing", "Verificación", "Decoración", "Fotografía", "Escribanía", "Mudanzas", "Refacciones", "Plomería", "Electricidad", "Gas", "Limpieza", "Jardinería", "Seguridad", "Tasaciones", "Construcción", "Construcción"][i],
  precio_referencia: [45000, 80000, 120000, 35000, 25000, 15000, 60000, 90000, 50000, 180000, 75000, 40000, 55000, 35000, 30000, 45000, 80000, 30000, 100000, 60000][i],
  moneda: "ARS",
  activo: i < 17,
}));

export const MOCK_EQUIPO = [
  { id: "u1", nombre: "Martín Gutiérrez", rol: "superadmin", email: "martin@propdelplata.com", activo: true },
  { id: "u2", nombre: "Carolina Mendez", rol: "admin", email: "caro@propdelplata.com", activo: true },
  { id: "u3", nombre: "Alejandro Paz", rol: "admin", email: "ale@propdelplata.com", activo: true },
  { id: "u4", nombre: "Laura Esquivel", rol: "vendedor", email: "laura@propdelplata.com", activo: true },
  { id: "u5", nombre: "Diego Ramírez", rol: "vendedor", email: "diego@propdelplata.com", activo: true },
  { id: "u6", nombre: "Sofía Castellano", rol: "vendedor", email: "sofi@propdelplata.com", activo: true },
  { id: "u7", nombre: "Germán Oliva", rol: "vendedor", email: "ger@propdelplata.com", activo: true },
  { id: "u8", nombre: "Marcela Duarte", rol: "contador", email: "marce@propdelplata.com", activo: true },
];

// ─── PROXY EDEN ───

function createEdenProxy(): Record<string, unknown> {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === "then") return undefined;

      if (prop === "admin") {
        return new Proxy({}, {
          get(_, p2: string) {
            if (p2 === "me") return { get: async () => mockRes({ data: { nombre: "Propiedades del Plata", logo_url: "", suscripcion: { status: "activa", isBlocked: false, is_vip: false, fecha_vencimiento: "2026-06-15", proximo_pago: "2026-05-15" } } }) };
            if (p2 === "dashboard") return { get: async () => mockRes(MOCK_DASHBOARD) };
            if (p2 === "propiedades") return { get: async () => mockRes(MOCK_PROPIEDADES) };
            if (p2 === "contratos") return { get: async () => mockRes(MOCK_CONTRATOS) };
            if (p2 === "inquilinos") return { get: async () => mockRes(MOCK_INQUILINOS) };
            if (p2 === "propietarios") return { get: async () => mockRes(MOCK_PROPIETARIOS) };
            if (p2 === "pagos") return { get: async () => mockRes(MOCK_COBRANZAS) };
            if (p2 === "marketplace") return { get: async () => mockRes(MOCK_MARKETPLACE) };
            if (p2 === "equipo") return { get: async () => mockRes(MOCK_EQUIPO) };
            if (p2 === "aumentos") return { get: async () => mockRes(Array.from({ length: 12 }, (_, m) => ({ mes: m + 1, año: 2025, porcentaje_icl: 45 + m * 6, monto_proyectado: (85000 + m * 12000) * (1 + (45 + m * 6) / 100) }))) };
            if (p2 === "configuracion") return { get: async () => mockRes({ inmobiliaria: { nombre: "Propiedades del Plata", logo_url: "", direccion: "Av. Santa Fe 2500, CABA", telefono: "+54 11 4500-1234", email: "info@propiedadesdelplata.com", pais: "AR" }, suscripcion: { plan: "profesional", status: "activa", isBlocked: false, fecha_vencimiento: "2026-06-15", proximo_pago: "2026-05-15", monto: 25000, moneda: "ARS" } }) };
            return new Proxy({}, { get() { return async () => mockRes([]); } });
          },
        });
      }

      return new Proxy({}, { get() { return async () => mockRes([]); } });
    },
  };

  return new Proxy({}, handler) as Record<string, unknown>;
}

export const mockEden = createEdenProxy();