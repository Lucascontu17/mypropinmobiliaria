/**
 * Shared type definitions for the Admin Panel.
 * All types related to the Búnker (mypropAPI) entities.
 */

// ── Navigation ──
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

// ── Dashboard Stats ──
export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}

// ── Multi-tenant ──
export interface TenantContext {
  inmobiliaria_id: string;
  nombre: string;
  role: 'admin' | 'agent' | 'viewer';
}
