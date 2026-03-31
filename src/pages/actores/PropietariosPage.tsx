import { useState } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { Plus, Search, Building2, Edit2, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropietarioForm } from '@/components/actores/PropietarioForm';

// Mock Data para probar UI mientras conectamos con SWR
const MOCK_PROPIETARIOS = [
  { id: '1', nombre: 'Juan Perez', dni: '12345678', celular: '+5491112345678', email: 'juan@example.com', comision_tipo: 'percent', comision_valor: 10 },
  { id: '2', nombre: 'Inversiones Global', dni: '30712345678', celular: '+5491198765432', email: 'contacto@iglobal.com', comision_tipo: 'fixed', comision_valor: 50000 },
];

export function PropietariosPage() {
  const { hasPermission } = useInmobiliaria();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  
  
  // Stale-while-revalidate fetcher (a implementar con Eden)
  const propietarios = MOCK_PROPIETARIOS.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.dni.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">Propietarios</h1>
          <p className="text-sm text-renta-600 font-inter mt-1">
            Gestiona el legajo digital de los dueños de inmuebles.
          </p>
        </div>
        
        {hasPermission(['superadmin', 'admin', 'vendedor']) && (
          <button 
            onClick={() => { setEditingData(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-renta-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-renta-950/20 transition-all hover:bg-renta-800"
          >
            <Plus className="h-4 w-4" />
            Nuevo Propietario
          </button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-renta-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-admin-border bg-white pl-10 pr-4 py-2 text-sm text-renta-900 placeholder:text-renta-400 focus:border-renta-300 focus:ring-1 focus:ring-renta-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-inter">
            <thead className="bg-renta-50/50 text-renta-600 border-b border-admin-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Propietario / Razón Social</th>
                <th className="px-6 py-4 font-semibold">DNI/CUIT</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Comisión</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {propietarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-renta-500">
                    <Building2 className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    No se encontraron propietarios.
                  </td>
                </tr>
              ) : (
                propietarios.map((p) => (
                  <tr key={p.id} className="hover:bg-admin-surface-hover transition-colors">
                    <td className="px-6 py-4 font-medium text-renta-950">{p.nombre}</td>
                    <td className="px-6 py-4 text-renta-600">{p.dni}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-renta-900">{p.celular}</span>
                        <span className="text-xs text-renta-500">{p.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        p.comision_tipo === 'percent' ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                      )}>
                        {p.comision_tipo === 'percent' ? `${p.comision_valor}%` : `$${p.comision_valor}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingData(p); setIsFormOpen(true); }}
                          className="p-2 text-renta-400 hover:text-renta-700 hover:bg-renta-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {hasPermission(['superadmin', 'admin']) && (
                          <button className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-renta-950/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <PropietarioForm 
              initialData={editingData} 
              onCancel={() => setIsFormOpen(false)} 
              onSuccess={() => setIsFormOpen(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
