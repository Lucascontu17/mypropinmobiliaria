---
country_code: MX
currency_code: MXN
currency_symbol: "$"
currency_locale: es-MX
phone_prefix: "+52"
id_label: RFC/CURP
tax_label: IVA
---

# Dashboard
panel_titulo: Panel de Control
panel_subtitulo: Resumen general de tu inmobiliaria
kpi_propiedades: Propiedades Activas
kpi_inquilinos: Arrendatarios Registrados
kpi_cobranza: Cobro del Mes
kpi_ocupacion: Tasa de Ocupación
bienvenida_titulo: Bienvenido al Panel MyProp
bienvenida_descripcion: Este es tu centro de comando. Una vez configurada la conexión con El Búnker, aquí verás el resumen completo de propiedades, arrendatarios y cobros de tu inmobiliaria.
boton_configurar: Configurar Conexión
boton_documentacion: Ver Documentación
rol_label: Sesión iniciada como

# Sidebar
nav_dashboard: Dashboard
nav_propietarios: Propietarios
nav_propiedades: Propiedades
nav_contratos: Contratos
nav_inquilinos: Arrendatarios
nav_cobranzas: Cobros
nav_marketplace: Marketplace
nav_configuracion: Configuración

# Topbar
buscar_placeholder: Buscar propiedades, arrendatarios...

# Marketplace
marketplace_titulo: Marketplace de Boosters
marketplace_subtitulo: Adquiera puntos de visibilidad para destacar sus propiedades en portales inmobiliarios, redes sociales y mailings dedicados.
marketplace_badge: Ecosistema de Upselling
marketplace_popular: Más Popular
marketplace_exposicion: Multiplica exposición
marketplace_puntos: Gema-Puntos
boton_comprar: Pagar con Mercado Pago
marketplace_conectando: Conectando...
marketplace_footer: Operación procesada mediante CheckOut de Mercado Pago. Certificación Búnker HMAC (x-signature) dual verification implementada. Protegido por Master Filter.
marketplace_cargando: Cargando planes regionales...
marketplace_error: Error al cargar los planes. Intente nuevamente.
marketplace_acceso_denegado: Acceso Denegado
marketplace_solo_admins: Solo administradores pueden adquirir Boosters.

# Cobranzas
cobranza_titulo: Cuenta Corriente Global
cobranza_periodo: Periodo Activo
cobranza_recaudacion: Recaudación Real
cobranza_esperado: Total Esperado N
cobranza_morosidad: Morosidad (A arrastrar)
cobranza_saldos: Saldos a Favor Arr.
cobranza_cierre: Cerrar Periodo & Arrastrar Adeudo
cobranza_buscar: Buscar contrato o arrendatario...
cobranza_inquilino: Arrendatario / Contrato
cobranza_a_abonar: A Cobrar (N)
cobranza_abonado: Cobrado Real
cobranza_saldo_restante: Saldo Restante
cobranza_estado: Estado
cobranza_acciones: Acciones
cobranza_cobrar: Cobrar
cobranza_vacio: No hay contratos que coincidan con los filtros aplicados en este periodo.
cobranza_a_favor: A FAVOR

# Configuración
config_titulo: Configuración del Búnker
config_motor: Motor de Automatización (Twilio & SendGrid)
config_whatsapp: WhatsApp Automático por Adeudo
config_whatsapp_desc: El sistema enviará de forma autónoma notificaciones a arrendatarios si registran saldos adeudados tras ejecutarse el cierre mensual en el módulo de Cobros.
config_email: Email de Onboarding Arrendatario
config_email_desc: Envía las credenciales y el mini-portal de arrendatarios de manera automática a los nuevos actores registrados en el sistema.
config_telefono: Teléfono Corporativo para respuestas (WS/SMS)
config_telefono_e164: Es obligatorio utilizar el estándar E.164.
config_guardar: Guardar Preferencias
config_guardando: Guardando...
config_acceso_bloqueado: Acceso Configuración Bloqueado
config_solo_superadmin: Solo perfiles superadmin gestionan las API Keys de Inmobiliaria.
config_region_titulo: Modo Auditoría Regional
config_region_desc: Simule la experiencia de usuario para diferentes países. Este cambio solo afecta la capa de presentación (textos, moneda, formato). No altera el Master Filter ni los datos reales.
config_region_actual: Región Activa
config_region_reset: Restablecer a TLD Real

# Onboarding
tour_btn_next: Siguiente
tour_btn_back: Anterior
tour_btn_finish: Finalizar
tour_btn_close: Cerrar
tour_btn_skip: Saltar Tour
tour_search_title: Búsqueda Inteligente
tour_search_desc: Localice propiedades, arrendatarios o contratos en segundos desde cualquier parte del panel.
tour_nav_propiedades_title: Gestión de Inventario
tour_nav_propiedades_desc: Administre sus propiedades, cargue expedientes digitales y gestione estados de disponibilidad.
tour_profile_title: Su Identidad
tour_profile_desc: Sesión iniciada con rol {{role}}. Todas sus acciones quedan registradas en el Audit Log.
tour_sa_welcome: Bienvenido, Director.
tour_sa_kpi_title: Centro de Control Financiero
tour_sa_kpi_desc: Métricas globales en tiempo real. Observe el estado de su rentabilidad por país, filtrado estrictamente bajo el Master Filter de su franquicia.
tour_sa_saas_title: Salud SaaS y Días de Gracia
tour_sa_saas_desc: Su suscripción cuenta con 7 de gracia ante expiraciones. Actúe preventivamente para evitar el bloqueo en cascada.
tour_sa_mkt_title: Motor de Crecimiento
tour_sa_mkt_desc: Adquiera Boosters para ganar visibilidad. Los ingresos por potenciadores están excluidos de la utilidad neta repartible con sus Resellers.
tour_sa_roles_title: Gestión de Jerarquías
tour_sa_roles_desc: Desde aquí administra su cuenta SUPERADMIN. Mantenga bajo control a sus Vendedores delegando permisos desde El Búnker.
tour_adm_map_title: Precisión Geoespacial
tour_adm_map_desc: La carga técnica requiere precisión GPS. El Búnker utiliza numeric(10,8) para evitar errores de punto flotante.
tour_adm_docs_title: Expediente Digital & E.164
tour_adm_docs_desc: Cargue documentos obligatorios y valide teléfonos bajo el estándar E.164 para asegurar las notificaciones automáticas vía Twilio. Termine cargando el comprobante de Mantenimiento.
tour_adm_rollover_title: Motor Financiero: Rollover
tour_adm_rollover_desc: El Cierre de Periodo es una acción manual ACID que consolida adeudos para el mes N+1. Una vez ejecutado, los saldos se arrastran atómicamente.
tour_adm_audit_title: Auditoría de Pagos Parciales
tour_adm_audit_desc: Controle ingresos parciales y saldos a favor desde aquí. Cada registro impacta en el flujo de caja global de la inmobiliaria.
tour_adm_hierarchy_title: Identidad Administrativa
tour_adm_hierarchy_desc: Como Administrador, gestiona el corazón operativo. Nota: El Superadmin es una jerarquía inamovible.
tour_ven_welcome: Bienvenido, Agente.
tour_ven_catalog_title: Catálogo de Activos Asignados
tour_ven_catalog_desc: Desde aquí gestiona únicamente las propiedades bajo su cargo. El Master Filter asegura que solo vea lo que le corresponde técnicamente.
tour_ven_services_title: Monitoreo de Servicios (Luz/Gas/Agua)
tour_ven_services_desc: Actúe como monitor preventivo para detectar morosidad en la Renta antes de los vencimientos.
tour_ven_contact_title: Gestión de Contacto Directo
tour_ven_contact_desc: Dispare llamadas o chats instantáneos usando el estándar E.164 para asegurar contacto inmediato con Arrendatarios y Dueños.

# Propiedades
prop_titulo: Inventario Patrimonial
prop_desc: Gestión centralizada de propiedades y geolocalización.
prop_nuevo: Nueva Propiedad
prop_buscar: Buscar por dirección o propietario...
prop_table_dir: Dirección
prop_table_specs: Especificaciones
prop_table_servicios: Servicios
prop_table_status: Estado
prop_table_valor: Valor
prop_table_acc: Acciones
prop_vacio: No se encontraron propiedades.
