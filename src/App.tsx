import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@/providers/ClerkProvider';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DashboardPage } from '@/pages/DashboardPage';

/**
 * App — Root component del Panel Administrativo MyProp.
 *
 * Estructura:
 * ClerkProvider → BrowserRouter → AdminLayout → Routes
 *
 * Las rutas de etapas 2-7 se agregarán aquí progresivamente:
 * /propiedades, /inquilinos, /cobranzas, /configuracion
 */
function App() {
  return (
    <ClerkProvider>
      <BrowserRouter>
        <AdminLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            {/* Etapa 2+: Agregar rutas aquí */}
          </Routes>
        </AdminLayout>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
