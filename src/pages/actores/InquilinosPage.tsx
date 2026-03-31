import { useState } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { Plus, Search, Users, Edit2, Trash2, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InquilinoForm } from '@/components/actores/InquilinoForm';

// Mock Data para SWR preview
const MOCK_INQUILILOS = [
  { id: '1', nombre: 'Andres Gomez', dni: '45678912', celular: '+5491144445555', email: 'andresg@example.com', dni_url: 'https://storage...', contrato_url: '' },
];

export function InquilinosPage() {
  const { hasPermission } = useInmobiliaria();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  
  const inquilinos = MOCK_INQUILILOS.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.dni.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta">Inquilinos</h1>
          <p className="text-sm text-renta-600 font-inter mt-1">
            Gestión de locatarios y acceso a documentación digital.
          </p>
        </div>
        
        {hasPermission(['superadmin', 'admin']) && (
          <button 
            onClick={() => { setEditingData(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-renta-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-renta-950/20 transition-all hover:bg-renta-800"
          >
            <Plus className="h-4 w-4" />
            Nuevo Inquilino
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
                <th className="px-6 py-4 font-semibold">Inquilino</th>
                <th className="px-6 py-4 font-semibold">DNI</th>
                <th className="px-6 py-4 font-semibold">Contacto (E.164)</th>
                <th className="px-6 py-4 font-semibold">Documentación</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {inquilinos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-renta-500">
                    <Users className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    No se encontraron inquilinos.
                  </td>
                </tr>
              ) : (
                inquilinos.map((t) => (
                  <tr key={t.id} className="hover:bg-admin-surface-hover transition-colors">
                    <td className="px-6 py-4 font-medium text-renta-950">{t.nombre}</td>
                    <td className="px-6 py-4 text-renta-600">{t.dni}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-renta-900 font-medium">{t.celular}</span>
                        <span className="text-xs text-renta-500">{t.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {t.dni_url ? (
                           <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                             <FileText className="h-3 w-3" /> DNI
                           </span>
                        ) : <span className="text-xs text-renta-300">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingData(t); setIsFormOpen(true); }}
                          className="p-2 text-renta-400 hover:text-renta-700 hover:bg-renta-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {hasPermission(['superadmin']) && (
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
            <InquilinoForm 
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
