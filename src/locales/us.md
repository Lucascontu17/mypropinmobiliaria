---
country_code: US
currency_code: USD
currency_symbol: "US$"
currency_locale: en-US
phone_prefix: "+1"
id_label: SSN/EIN
tax_label: Tax
---

# Dashboard
panel_titulo: Control Panel
panel_subtitulo: Overview of your real estate agency
kpi_propiedades: Active Properties
kpi_inquilinos: Registered Tenants
kpi_cobranza: Monthly Collections
kpi_ocupacion: Occupancy Rate
bienvenida_titulo: Welcome to MyProp Panel
bienvenida_descripcion: This is your command center. Once connected to The Búnker, you'll see a complete summary of properties, tenants and collections for your agency.
boton_configurar: Configure Connection
boton_documentacion: View Documentation
rol_label: Signed in as

# Sidebar
nav_dashboard: Dashboard
nav_propietarios: Landlords
nav_propiedades: Properties
nav_contratos: Leases
nav_inquilinos: Tenants
nav_cobranzas: Collections
nav_marketplace: Marketplace
nav_configuracion: Settings

# Topbar
buscar_placeholder: Search properties, tenants...

# Marketplace
marketplace_titulo: Booster Marketplace
marketplace_subtitulo: Purchase visibility points to highlight your properties across social media, real estate portals and dedicated email campaigns.
marketplace_badge: Upselling Ecosystem
marketplace_popular: Most Popular
marketplace_exposicion: Multiply exposure
marketplace_puntos: Gems
boton_comprar: Pay with Mercado Pago
marketplace_conectando: Connecting...
marketplace_footer: Transaction processed via Mercado Pago Checkout. Búnker HMAC (x-signature) dual verification certification implemented. Protected by Master Filter.
marketplace_cargando: Loading regional plans...
marketplace_error: Failed to load plans. Please try again.
marketplace_acceso_denegado: Access Denied
marketplace_solo_admins: Only administrators can purchase Boosters.

# Cobranzas
cobranza_titulo: Global Current Account
cobranza_periodo: Active Period
cobranza_recaudacion: Actual Revenue
cobranza_esperado: Expected Total N
cobranza_morosidad: Delinquency (To carry)
cobranza_saldos: Tenant Credit Balance
cobranza_cierre: Close Period & Carry Debt
cobranza_buscar: Search lease or tenant...
cobranza_inquilino: Tenant / Lease
cobranza_a_abonar: Due (N)
cobranza_abonado: Paid
cobranza_saldo_restante: Balance
cobranza_estado: Status
cobranza_acciones: Actions
cobranza_cobrar: Collect
cobranza_vacio: No leases match the applied filters for this period.
cobranza_a_favor: CREDIT

# Configuración
config_titulo: Búnker Settings
config_motor: Automation Engine (Twilio & SendGrid)
config_whatsapp: Automatic WhatsApp on Rollover
config_whatsapp_desc: The system will autonomously send notifications to tenants who register outstanding balances (delinquency) after the Monthly Rollover in the Collections module.
config_email: Tenant Onboarding Email
config_email_desc: Automatically sends credentials and the tenant mini-portal to newly registered actors in the system.
config_telefono: Corporate Phone for Replies (WS/SMS)
config_telefono_e164: E.164 standard is required.
config_guardar: Save Preferences
config_guardando: Saving...
config_acceso_bloqueado: Settings Access Blocked
config_solo_superadmin: Only superadmin profiles can manage Agency API Keys.
config_region_titulo: Regional Audit Mode
config_region_desc: Simulate user experience for different countries. This change only affects the presentation layer (text, currency, format). It does not alter the Master Filter or actual data.
config_region_actual: Active Region
config_region_reset: Reset to Real TLD

# Onboarding
tour_btn_next: Next
tour_btn_back: Back
tour_btn_finish: Finish
tour_btn_close: Close
tour_btn_skip: Skip Tour
tour_search_title: Intelligent Search
tour_search_desc: Locate properties, tenants, or contracts in seconds from anywhere in the panel.
tour_nav_propiedades_title: Inventory Management
tour_nav_propiedades_desc: Manage your properties, upload digital files, and handle availability statuses.
tour_profile_title: Your Identity
tour_profile_desc: Logged in as {{role}}. All your actions are recorded in the Audit Log.
tour_sa_welcome: Welcome, Director.
tour_sa_kpi_title: Financial Control Center
tour_sa_kpi_desc: Real-time global metrics. Monitor your profitability by country, strictly filtered under your franchise Master Filter.
tour_sa_saas_title: SaaS Health & Grace Period
tour_sa_saas_desc: Your subscription has a 7-day grace period for expirations. Act proactively to avoid the cascading lockout.
tour_sa_mkt_title: Growth Engine
tour_sa_mkt_desc: Purchase Boosters to gain visibility. Booster revenue is excluded from net utility distributable with Resellers.
tour_sa_roles_title: Hierarchy Management
tour_sa_roles_desc: Manage your SUPERADMIN account from here. Keep your Sellers in check by delegating permissions from The Bunker.
tour_adm_map_title: Geospatial Precision
tour_adm_map_desc: Technical loading requires GPS precision. The Bunker uses numeric(10,8) to avoid floating point errors.
tour_adm_docs_title: Digital File & E.164
tour_adm_docs_desc: Upload mandatory documents and validate phones under the E.164 standard for automated Twilio notifications. Finish by uploading the HOA Fees receipt.
tour_adm_rollover_title: Financial Engine: Rollover
tour_adm_rollover_desc: Period Closure is a manual ACID action that consolidates debts for month N+1. Once executed, balances are atomically carried over.
tour_adm_audit_title: Partial Payment Audit
tour_adm_audit_desc: Monitor partial income and credit balances here. Each record impacts the global cash flow of the agency.
tour_adm_hierarchy_title: Administrative Identity
tour_adm_hierarchy_desc: As an Administrator, you manage the operational heart. Note: The Superadmin is an immovable hierarchy.
tour_ven_welcome: Welcome, Agent.
tour_ven_catalog_title: Assigned Asset Catalog
tour_ven_catalog_desc: Manage only the properties under your wing from here. The Master Filter ensures technical data isolation.
tour_ven_services_title: Service Monitoring (Light/Gas/Water)
tour_ven_services_desc: Act as a preventive monitor to detect delinquency in Rent before due dates.
tour_ven_contact_title: Direct Contact Management
tour_ven_contact_desc: Trigger instant calls or chats using the E.164 standard to ensure immediate contact with Tenants and Owners.

# Propiedades
prop_titulo: Patrimonial Inventory
prop_desc: Centralized property and geolocation management.
prop_nuevo: New Property
prop_buscar: Search by address or owner...
prop_table_dir: Address
prop_table_specs: Specifications
prop_table_servicios: Services
prop_table_status: Status
prop_table_valor: Value
prop_table_acc: Actions
prop_vacio: No properties found.
