// Interceptor global de fetch para mypropinmobiliaria - rama MOCK

function mockJsonRes(d: unknown) {
  return { ok: true, status: 200, json: async () => d, text: async () => JSON.stringify(d), headers: new Headers({ "content-type": "application/json" }) };
}

const _origFetch = window.fetch;
window.fetch = async function mockF(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  if (!url.includes("api.zonatia") && !url.includes("api/v1")) return _origFetch(input, init);
  await new Promise(r => setTimeout(r, 30));

  // ── Dashboard metrics ──
  if (url.includes("admin/metrics") || url.includes("admin/dashboard")) {
    return mockJsonRes({ data: { metrics: { totalPropiedades: 35, cobranzaMes: 1850000, deudaPendiente: 320000, tasaOcupacion: 94, comisionesEstimadas: 148000, proximosVencimientos: 4, visitasHoy: 5, suscripcion: { is_vip: false, status: "activa", monto_base: 25000, acumulado_ia: 8500, total_proximo: 33500, fecha_vencimiento: "2026-06-15" } } } }) as unknown as Response;
  }

  // ── Propietarios ──
  if (url.includes("admin/owners")) {
    return mockJsonRes({ data: Array.from({ length: 22 }, (_, i) => ({ id: `prop-${i+1}`, nombre: ["Roberto Álvarez","Marcela Bianchi","Héctor Campos","Adriana Delgado","Oscar Espinosa","Norma Fuentes","Gustavo Gallardo","Patricia Heredia","Ignacio Ibáñez","Karina Juárez","Luis Kessler","Mónica Ledesma","Néstor Moreno","Olga Navarro","Pedro Ortega","Rosa Peralta","Sergio Quiroga","Tamara Roldán","Ulises Salas","Viviana Tapia","Walter Uribe","Ximena Vargas"][i], dni: `${18000000+i*1200000}`, email: `propietario${i+1}@email.com`, telefono: `+54 11 ${5000+i*99}` })) }) as unknown as Response;
  }

  // ── Inquilinos ──
  if (url.includes("admin/tenants")) {
    return mockJsonRes({ data: Array.from({ length: 30 }, (_, i) => ({ id: `inq-${i+1}`, nombre: ["Mariana González","Carlos Rodríguez","Lucía Fernández","Juan Pablo Martínez","Florencia López","Diego García","Valeria Sánchez","Martín Pérez","Carolina Díaz","Fernando Torres","Gabriela Romero","Alejandro Ruiz","Natalia Suárez","Esteban Morales","Cecilia Álvarez","Ricardo Benítez","Paula Giménez","Leonardo Acosta","Antonella Medina","Santiago Herrera","Romina Castro","Pablo Mendoza","Andrea Vega","Gustavo Paz","Laura Ríos","Javier Duarte","Silvina Correa","Omar Sosa","Daniela Ferro","Matías Luna"][i], dni: `${20000000+i*1500000}`, email: `inquilino${i+1}@email.com`, telefono: `+54 11 ${4000+i*111}` })) }) as unknown as Response;
  }

  // ── Propiedades ──
  if (url.includes("admin/propiedades") || url.includes("admin/properties")) {
    return mockJsonRes({ data: Array.from({ length: 35 }, (_, i) => ({ id: `prop-imm-${i+1}`, titulo: `Depto en ${["Palermo","Belgrano","Recoleta","Caballito","Villa Urquiza","Almagro","Colegiales","Nuñez"][i%8]} ${i+1}`, tipo: i<25?"departamento":i<30?"casa":"ph", direccion: `Calle ${1000+i*137}, CABA`, ambientes: (i%3)+1, dormitorios: (i%3)+1, banos: i%2===0?1:2, precio_alquiler: 85000+i*12000, estado: ["disponible","alquilado","reservado","en_refaccion"][i%4], superficie_total: 35+(i*5)%150, expensas: 8000+i*700, moneda: "ARS", barrio: ["Palermo","Belgrano","Recoleta","Caballito","Villa Urquiza","Almagro","Colegiales","Nuñez"][i%8], amenities: ["Parrilla","Pileta","Gimnasio","Balcón","Cochera"].slice(0,2+(i%3)), fotos: [], destacado: i<10 })) }) as unknown as Response;
  }

  // ── Contratos ──
  if (url.includes("admin/contratos") || url.includes("admin/contracts")) {
    return mockJsonRes({ data: Array.from({ length: 28 }, (_, i) => ({ id: `contrato-${i+1}`, propiedad_id: `prop-imm-${(i%35)+1}`, inquilino_nombre: ["Mariana González","Carlos Rodríguez","Lucía Fernández","Juan Pablo Martínez","Florencia López","Diego García","Valeria Sánchez","Martín Pérez","Carolina Díaz","Fernando Torres","Gabriela Romero","Alejandro Ruiz","Natalia Suárez","Esteban Morales","Cecilia Álvarez","Ricardo Benítez","Paula Giménez","Leonardo Acosta","Antonella Medina","Santiago Herrera","Romina Castro","Pablo Mendoza","Andrea Vega","Gustavo Paz","Laura Ríos","Javier Duarte","Silvina Correa","Omar Sosa"][i], monto_mensual: 85000+i*15000, moneda:"ARS", fecha_inicio:`2024-0${(i%12)+1}-01`, fecha_vencimiento:`2026-0${(i%12)+1}-01`, estado: i<18?"activo":i<22?"proximo_a_vencer":i<25?"vencido":"renovado", deposito: 85000+i*15000 })) }) as unknown as Response;
  }

  // ── Marketplace / my-addons ──
  if (url.includes("my-addons")) {
    return mockJsonRes({ addons: [{ id:"a1", nombre:"Logo Personalizado en Panel", descripcion:"Subí el logo de tu inmobiliaria", costo_mensual:5000, is_acquired:true }] }) as unknown as Response;
  }

  // ── Admin me ──
  if (url.includes("admin/me")) {
    return mockJsonRes({ data: { nombre: "Propiedades del Plata", logo_url: "", suscripcion: { status: "activa", isBlocked: false, fecha_vencimiento: "2026-06-15", proximo_pago: "2026-05-15" } } }) as unknown as Response;
  }

  // ── Cobranzas ──
  if (url.includes("admin/pagos") || url.includes("admin/cobranzas")) {
    return mockJsonRes({ data: Array.from({ length: 65 }, (_, i) => ({ id: `pago-${i+1}`, contrato_id: `contrato-${(i%28)+1}`, monto: 85000+(i%28)*15000, moneda:"ARS", fecha_pago:`2025-0${6+Math.floor(i/22)}-${String(1+(i%28)).padStart(2,"0")}`, estado: i%7===0?"pendiente":i%10===0?"parcial":"pagado", metodo:["transferencia","efectivo","deposito"][i%3] })) }) as unknown as Response;
  }

  // ── Equipo ──
  if (url.includes("admin/equipo") || url.includes("admin/team")) {
    return mockJsonRes({ data: [{ id:"u1",nombre:"Martín Gutiérrez",rol:"superadmin",email:"martin@propdelplata.com",activo:true},{ id:"u2",nombre:"Carolina Mendez",rol:"admin",email:"caro@propdelplata.com",activo:true},{ id:"u3",nombre:"Alejandro Paz",rol:"admin",email:"ale@propdelplata.com",activo:true},{ id:"u4",nombre:"Laura Esquivel",rol:"vendedor",email:"laura@propdelplata.com",activo:true},{ id:"u5",nombre:"Diego Ramírez",rol:"vendedor",email:"diego@propdelplata.com",activo:true},{ id:"u6",nombre:"Sofía Castellano",rol:"vendedor",email:"sofi@propdelplata.com",activo:true},{ id:"u7",nombre:"Germán Oliva",rol:"vendedor",email:"ger@propdelplata.com",activo:true},{ id:"u8",nombre:"Marcela Duarte",rol:"contador",email:"marce@propdelplata.com",activo:true}] }) as unknown as Response;
  }

  // ── Visitas ──
  if (url.includes("admin/visitas")) {
    return mockJsonRes({ data: { visitas: [
      { id:"visita-1", fecha_programada:"2025-08-11T10:00:00Z", status:"PROGRAMADA", mensaje_visitante:"Busco monoambiente para mudarme en septiembre, idealmente con balcón.", created_at:"2025-08-10T09:00:00Z", propiedad:{id:"prop-imm-1",direccion:"Av. Santa Fe 2340, Piso 7º 'C'"}, cliente:{id:"cli-1",nombre:"Mariana López",celular:"+54 9 11 5678-1234",email:"mariana.lopez@gmail.com"} },
      { id:"visita-2", fecha_programada:"2025-08-11T14:00:00Z", status:"PENDIENTE", mensaje_visitante:"Somos una pareja con un hijo de 3 años, necesitamos mínimo 2 ambientes.", created_at:"2025-08-10T10:00:00Z", propiedad:{id:"prop-imm-3",direccion:"Av. Córdoba 2340, Piso 5º 'C'"}, cliente:{id:"cli-2",nombre:"Carlos Pérez",celular:"+54 9 11 6789-2345",email:"cperez@hotmail.com"} },
      { id:"visita-3", fecha_programada:"2025-08-12T11:30:00Z", status:"PROGRAMADA", mensaje_visitante:"Vengo con garantía propietaria. Ingresaría en octubre.", created_at:"2025-08-11T08:00:00Z", propiedad:{id:"prop-imm-6",direccion:"Av. Las Heras 2370, Piso 10º 'F'"}, cliente:{id:"cli-3",nombre:"Lucía Gómez",celular:"+54 9 11 7890-3456",email:"luciag@fibertel.com.ar"} },
      { id:"visita-4", fecha_programada:"2025-08-12T16:00:00Z", status:"REALIZADA", mensaje_visitante:"Ya hice la visita, me gustó mucho la propiedad. Estoy evaluando con mi abogado el contrato.", created_at:"2025-08-11T15:00:00Z", propiedad:{id:"prop-imm-11",direccion:"Honduras 1570, Piso 3º 'K'"}, cliente:{id:"cli-4",nombre:"Diego Fernández",celular:"+54 9 11 8901-4567",email:"diegof@gmail.com"} },
      { id:"visita-5", fecha_programada:"2025-08-13T09:00:00Z", status:"CANCELADA", mensaje_visitante:"Tuve que cancelar por un imprevisto familiar. Me gustaría reprogramar.", created_at:"2025-08-12T07:00:00Z", propiedad:{id:"prop-imm-16",direccion:"Av. Juan B. Justo 1940, Piso 8º 'D'"}, cliente:{id:"cli-5",nombre:"Valeria Ruiz",celular:"+54 9 11 9012-5678",email:"valeriaruiz@hotmail.com"} },
      { id:"visita-6", fecha_programada:"2025-08-13T15:30:00Z", status:"PROGRAMADA", mensaje_visitante:"Primera vez que alquilo solo. Busco algo luminoso con cochera.", created_at:"2025-08-12T10:00:00Z", propiedad:{id:"prop-imm-2",direccion:"Av. Corrientes 3480, Piso 9º 'B'"}, cliente:{id:"cli-6",nombre:"Federico Aguirre",celular:"+54 9 11 3456-7890",email:"fedeaguirre@yahoo.com.ar"} },
      { id:"visita-7", fecha_programada:"2025-08-14T11:00:00Z", status:"PENDIENTE", mensaje_visitante:"Busco comprar, no alquilar. Presupuesto hasta USD 120.000.", created_at:"2025-08-13T09:00:00Z", propiedad:{id:"prop-imm-9",direccion:"Av. Pueyrredón 2260, Piso 4º 'E'"}, cliente:{id:"cli-7",nombre:"Paula Mendoza",celular:"+54 9 11 4567-8901",email:"paulamendozarg@gmail.com"} },
    ]}}) as unknown as Response;
  }

  // ── Mercado Pago / Config ──
  if (url.includes("admin/config") || url.includes("admin/settings")) {
    return mockJsonRes({ data: { inmobiliaria: { nombre: "Propiedades del Plata", logo_url: "", direccion: "Av. Santa Fe 2500, CABA", telefono: "+54 11 4500-1234", email: "info@propiedadesdelplata.com" }, suscripcion: { plan: "profesional", status: "activa", isBlocked: false } } }) as unknown as Response;
  }

  // ── Proyección de aumentos ──
  if (url.includes("admin/aumentos")) {
    return mockJsonRes({ data: Array.from({ length: 12 }, (_, m) => ({ mes: m+1, anio:2025, porcentaje_icl:45+m*6, monto_proyectado: (85000+m*12000)*(1+(45+m*6)/100) })) }) as unknown as Response;
  }

  // ── Marketplace admin ──
  if (url.includes("admin/marketplace")) {
    return mockJsonRes({ data: Array.from({ length: 20 }, (_, i) => ({ id:`mp-${i+1}`, nombre:["Fotografía profesional HD","Recorrido virtual 3D","Cartelería LED","Seguro de caución","Marketing digital","Verificación de antecedentes","Home staging","Drone inmobiliario","Escribanía express","Mudanza premium","Pintura integral","Plomería general","Electricidad certificada","Gasista matriculado","Limpieza profunda","Jardinería paisajística","Seguridad electrónica","Tasación oficial","Cerramientos de balcón","Impermeabilización"][i], categoria:["Fotografía","Tecnología","Cartelería","Seguros","Marketing","Verificación","Decoración","Fotografía","Escribanía","Mudanzas","Refacciones","Plomería","Electricidad","Gas","Limpieza","Jardinería","Seguridad","Tasaciones","Construcción","Construcción"][i], precio_referencia:[45000,80000,120000,35000,25000,15000,60000,90000,50000,180000,75000,40000,55000,35000,30000,45000,80000,30000,100000,60000][i], moneda:"ARS", activo:i<17 })) }) as unknown as Response;
  }

  // ── Soporte (tickets) ──
  if (url.includes("/soporte/tickets")) {
    if (url.includes("/messages")) {
      return mockJsonRes({ success: true, data: [
        { id: "msg-1", sender_role: "superadmin", sender_name: "Martín Gutiérrez", content: "Estamos revisando tu consulta. ¿Podrías enviarnos una captura del error?", created_at: "2025-08-10T10:30:00Z" },
        { id: "msg-2", sender_role: "admin", sender_name: "Carolina Mendez", content: "Ya revisé el panel de configuración y parece ser un problema de sincronización con AFIP.", created_at: "2025-08-10T11:00:00Z" },
        { id: "msg-3", sender_role: "admin", sender_name: "Carolina Mendez", content: "Actualicé los certificados. Debería funcionar ahora. ¿Lo probás?", created_at: "2025-08-10T14:15:00Z" },
      ]}) as unknown as Response;
    }
    return mockJsonRes({ success: true, data: [
      { id: "ticket-1", subject: "Error al generar recibo de expensas", category: "Consulta Técnica", description: "Al intentar generar el recibo de expensas del mes de agosto para el edificio de Av. Santa Fe 2340, el sistema arroja error 500. Adjunto captura.", status: "cerrado", priority: "alta", current_level: 2, created_at: "2025-08-10T09:00:00Z", updated_at: "2025-08-10T14:15:00Z", closed_at: "2025-08-10T14:15:00Z" },
      { id: "ticket-2", subject: "No puedo dar de alta una propiedad nueva", category: "Soporte Técnico", description: "Cuando completo el formulario de nueva propiedad y hago clic en Guardar, no pasa nada. Probé en Chrome y Firefox, mismo resultado.", status: "en_curso", priority: "alta", current_level: 1, created_at: "2025-08-12T11:20:00Z", updated_at: "2025-08-13T09:00:00Z", closed_at: null },
      { id: "ticket-3", subject: "Consulta sobre integración con AFIP", category: "Consulta Técnica", description: "Necesitamos saber si el sistema emite automáticamente el certificado de retención de IVA para propietarios. Tenemos varios que lo están solicitando.", status: "pendiente", priority: "media", current_level: 0, created_at: "2025-08-14T08:45:00Z", updated_at: "2025-08-14T08:45:00Z", closed_at: null },
      { id: "ticket-4", subject: "Error en cálculo de comisiones del mes de julio", category: "Facturación y Pagos", description: "Las comisiones de julio aparecen duplicadas para los vendedores Laura Esquivel y Diego Ramírez. Necesito que lo revisen urgente porque ya estamos liquidando.", status: "en_curso", priority: "alta", current_level: 1, created_at: "2025-08-08T14:00:00Z", updated_at: "2025-08-09T16:30:00Z", closed_at: null },
      { id: "ticket-5", subject: "Solicitud de capacitación para nuevo vendedor", category: "Consultas Generales", description: "El próximo lunes ingresa Sofía Castellano como vendedora. ¿Pueden agendar una sesión de onboarding para ella? Preferentemente por la mañana.", status: "cerrado", priority: "baja", current_level: 2, created_at: "2025-08-01T10:00:00Z", updated_at: "2025-08-02T11:00:00Z", closed_at: "2025-08-02T11:00:00Z" },
      { id: "ticket-6", subject: "Problema con proyección de aumentos ICL", category: "Soporte Técnico", description: "La proyección de aumentos muestra valores incorrectos para los contratos indexados por IPC. Deberían mostrar 4.6% y están mostrando 0%.", status: "pendiente", priority: "media", current_level: 0, created_at: "2025-08-15T07:30:00Z", updated_at: "2025-08-15T07:30:00Z", closed_at: null },
    ]}) as unknown as Response;
  }

  // ── Upload ──
  if (url.includes("upload")) {
    return mockJsonRes({ url: "https://placehold.co/600x400/428c8a/white?text=Upload+Mock" }) as unknown as Response;
  }

  // Fallback
  return mockJsonRes({ data: [] }) as unknown as Response;
} as typeof window.fetch;