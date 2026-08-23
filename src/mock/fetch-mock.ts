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
  "/soporte/tickets": { success: true, data: [] },
  "/public/upload": { url: "https://placehold.co/600x400/428c8a/white?text=Upload" },
};

const _origFetch = window.fetch;

window.fetch = async function mockFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  if (!url.includes("api.zonatia.com") && !url.includes("localhost") && !url.includes("api/v1")) {
    return _origFetch(input, init);
  }

  await new Promise((r) => setTimeout(r, 200));

  for (const [path, data] of Object.entries(API_MOCK)) {
    if (url.includes(path)) {
      return mockJsonRes(data) as unknown as Response;
    }
  }

  return mockJsonRes({ data: [] }) as unknown as Response;
} as typeof window.fetch;
