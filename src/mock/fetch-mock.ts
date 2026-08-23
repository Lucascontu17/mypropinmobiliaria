// Interceptor global de fetch para mypropinmobiliaria - rama MOCK
// Cubre los endpoints que se consumen con fetch nativo (useInmobiliaria, useApi, uploads).

function mockJsonRes(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ "content-type": "application/json" }),
  };
}

// ─── TICKETS DE SOPORTE ───
const MOCK_TICKETS = [
  {
    id: "ticket-1",
    subject: "Error al generar boleta de servicios",
    description: "Al intentar descargar la boleta de luz de un inquilino, el PDF queda en blanco.",
    category: "Consulta Técnica",
    status: "en_curso",
    priority: "alta",
    current_level: 2,
    created_at: "2026-08-18T10:30:00Z",
    updated_at: "2026-08-21T14:00:00Z",
    closed_at: null,
  },
  {
    id: "ticket-2",
    subject: "Consulta sobre aumento por ICL",
    description: "Queremos confirmar cómo se aplica el índice ICL en los contratos con periodicidad semestral.",
    category: "Consulta Técnica",
    status: "pendiente",
    priority: "media",
    current_level: 1,
    created_at: "2026-08-20T09:15:00Z",
    updated_at: "2026-08-20T09:15:00Z",
    closed_at: null,
  },
  {
    id: "ticket-3",
    subject: "Sugerencia: exportar cobranzas a Excel",
    description: "Estaría bueno poder exportar la cuenta corriente a un archivo Excel.",
    category: "Sugerencia",
    status: "cerrado",
    priority: "baja",
    current_level: 1,
    created_at: "2026-07-10T12:00:00Z",
    updated_at: "2026-07-12T16:30:00Z",
    closed_at: "2026-07-12T16:30:00Z",
  },
  {
    id: "ticket-4",
    subject: "Problema con facturación de suscripción",
    description: "Me llegó el doble de lo esperado en la última cuota de suscripción.",
    category: "Facturación",
    status: "pendiente",
    priority: "alta",
    current_level: 2,
    created_at: "2026-08-21T08:00:00Z",
    updated_at: "2026-08-21T08:00:00Z",
    closed_at: null,
  },
  {
    id: "ticket-5",
    subject: "No puedo cargar fotos de una propiedad",
    description: "Al subir imágenes desde el celular, la carga se corta y no guarda.",
    category: "Consulta Técnica",
    status: "en_curso",
    priority: "media",
    current_level: 1,
    created_at: "2026-08-19T15:45:00Z",
    updated_at: "2026-08-20T10:20:00Z",
    closed_at: null,
  },
  {
    id: "ticket-6",
    subject: "Consulta sobre comisiones de propietarios",
    description: "¿Cómo configuro comisión fija para un propietario en particular?",
    category: "Consulta Técnica",
    status: "cerrado",
    priority: "baja",
    current_level: 1,
    created_at: "2026-06-25T11:00:00Z",
    updated_at: "2026-06-26T09:10:00Z",
    closed_at: "2026-06-26T09:10:00Z",
  },
];

const MOCK_MESSAGES: Record<string, Array<{ id: string; sender_role: string; sender_name: string; content: string; created_at: string }>> = {
  "ticket-1": [
    { id: "m1-1", sender_role: "inmobiliaria", sender_name: "Propiedades del Plata", content: "Hola, no puedo descargar la boleta de luz del inquilino: el PDF sale en blanco.", created_at: "2026-08-18T10:30:00Z" },
    { id: "m1-2", sender_role: "hiperadmin", sender_name: "Soporte Zonatia", content: "Hola, gracias por avisar. ¿Nos confirmás el navegador y sistema operativo?", created_at: "2026-08-18T11:05:00Z" },
    { id: "m1-3", sender_role: "inmobiliaria", sender_name: "Propiedades del Plata", content: "Chrome 127 en Windows 11.", created_at: "2026-08-18T11:20:00Z" },
    { id: "m1-4", sender_role: "hiperadmin", sender_name: "Soporte Zonatia", content: "Perfecto, lo estamos revisando y te actualizamos por acá.", created_at: "2026-08-18T11:40:00Z" },
  ],
  "ticket-3": [
    { id: "m3-1", sender_role: "inmobiliaria", sender_name: "Propiedades del Plata", content: "Sería útil exportar a Excel la cuenta corriente.", created_at: "2026-07-10T12:00:00Z" },
    { id: "m3-2", sender_role: "hiperadmin", sender_name: "Soporte Zonatia", content: "¡Gracias por la sugerencia! Ya está en nuestro roadmap.", created_at: "2026-07-12T16:30:00Z" },
  ],
  "ticket-4": [
    { id: "m4-1", sender_role: "inmobiliaria", sender_name: "Propiedades del Plata", content: "La última cuota de suscripción vino duplicada, ¿pueden revisar?", created_at: "2026-08-21T08:00:00Z" },
  ],
  "ticket-5": [
    { id: "m5-1", sender_role: "inmobiliaria", sender_name: "Propiedades del Plata", content: "Al subir fotos desde el celular la carga se corta.", created_at: "2026-08-19T15:45:00Z" },
    { id: "m5-2", sender_role: "hiperadmin", sender_name: "Soporte Zonatia", content: "¿Probaste con menos imágenes a la vez?", created_at: "2026-08-20T10:20:00Z" },
  ],
  "ticket-6": [
    { id: "m6-1", sender_role: "inmobiliaria", sender_name: "Propiedades del Plata", content: "¿Cómo configuro comisión fija para un propietario?", created_at: "2026-06-25T11:00:00Z" },
    { id: "m6-2", sender_role: "hiperadmin", sender_name: "Soporte Zonatia", content: "Desde Propietarios > Editar podés elegir el tipo de comisión.", created_at: "2026-06-26T09:10:00Z" },
  ],
};

// Respuestas keyed por subpath de la URL (formas alineadas a cada consumidor)
const API_MOCK: Record<string, unknown> = {
  "/admin/me": {
    data: {
      nombre: "Propiedades del Plata",
      logo_url: "",
      enviar_whatsapp_rollover: true,
      enviar_email_onboarding: true,
      twilio_phone: "+54 11 4500-1234",
      suscripcion: {
        status: "activa",
        isBlocked: false,
        is_vip: false,
        fecha_vencimiento: "2026-06-15",
        proximo_pago: "2026-05-15",
      },
    },
  },
  "/marketplace/my-addons": { addons: [] },
  "/public/upload": { url: "https://placehold.co/600x400/428c8a/white?text=Upload" },
};

const _origFetch = window.fetch;

window.fetch = async function mockFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = (init?.method || "GET").toUpperCase();

  if (!url.includes("api.zonatia.com") && !url.includes("localhost") && !url.includes("api/v1")) {
    return _origFetch(input, init);
  }

  await new Promise((r) => setTimeout(r, 200));

  // Soporte: mensajes de un ticket
  if (url.includes("/soporte/tickets/") && url.includes("/messages")) {
    const ticketId = url.split("/soporte/tickets/")[1]?.split("/messages")[0];
    return mockJsonRes({ success: true, data: MOCK_MESSAGES[ticketId] || [] }) as unknown as Response;
  }

  // Soporte: listado o creación de tickets
  if (url.includes("/soporte/tickets")) {
    if (method === "POST") {
      return mockJsonRes({ success: true, data: { id: "ticket-new" } }) as unknown as Response;
    }
    return mockJsonRes({ success: true, data: MOCK_TICKETS }) as unknown as Response;
  }

  for (const [path, data] of Object.entries(API_MOCK)) {
    if (url.includes(path)) {
      return mockJsonRes(data) as unknown as Response;
    }
  }

  return mockJsonRes({ data: [] }) as unknown as Response;
} as typeof window.fetch;
