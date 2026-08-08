// Interceptor global de fetch para mypropinmobiliaria - rama MOCK

import { MOCK_DASHBOARD, MOCK_PROPIEDADES, MOCK_CONTRATOS, MOCK_INQUILINOS, MOCK_PROPIETARIOS, MOCK_COBRANZAS, MOCK_MARKETPLACE, MOCK_EQUIPO } from "./eden-mock";

function mockJsonRes(data: unknown) {
  return { ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data), headers: new Headers({ "content-type": "application/json" }) };
}

const API_MOCK: Record<string, unknown> = {
  "/admin/me": { data: { nombre: "Propiedades del Plata", logo_url: "", suscripcion: { status: "activa", isBlocked: false, fecha_vencimiento: "2026-06-15", proximo_pago: "2026-05-15" } } },
  "/admin/dashboard": MOCK_DASHBOARD,
  "/admin/propiedades": MOCK_PROPIEDADES,
  "/admin/contratos": MOCK_CONTRATOS,
  "/admin/inquilinos": MOCK_INQUILINOS,
  "/admin/propietarios": MOCK_PROPIETARIOS,
  "/admin/pagos": MOCK_COBRANZAS,
  "/admin/marketplace": MOCK_MARKETPLACE,
  "/admin/equipo": MOCK_EQUIPO,
  "/admin/aumentos": Array.from({ length: 12 }, (_, m) => ({ mes: m + 1, anio: 2025, porcentaje_icl: 45 + m * 6, monto_proyectado: (85000 + m * 12000) * (1 + (45 + m * 6) / 100) })),
  "/admin/configuracion": { inmobiliaria: { nombre: "Propiedades del Plata" }, suscripcion: { plan: "profesional", status: "activa", isBlocked: false } },
  "/public/upload": { url: "https://placehold.co/600x400/428c8a/white?text=Upload" },
};

const _origFetch = window.fetch;
window.fetch = async function mockFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  if (!url.includes("api.zonatia.com") && !url.includes("localhost") && !url.includes("api/v1")) {
    return _origFetch(input, init);
  }

  await new Promise(r => setTimeout(r, 200));

  for (const [path, data] of Object.entries(API_MOCK)) {
    if (url.includes(path)) {
      return mockJsonRes(data) as unknown as Response;
    }
  }

  return mockJsonRes({ data: [] }) as unknown as Response;
} as typeof window.fetch;