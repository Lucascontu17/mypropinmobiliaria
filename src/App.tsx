import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ClerkProvider } from '@/providers/ClerkProvider';
import { RegionProvider } from '@/providers/RegionProvider';
import { JoyrideProvider } from '@/providers/JoyrideProvider';
import { JoyrideWrapper } from '@/components/joyride/JoyrideWrapper';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PropietariosPage } from '@/pages/actores/PropietariosPage';
import { InquilinosPage } from '@/pages/actores/InquilinosPage';
import { PropiedadesPage } from '@/pages/propiedades/PropiedadesPage';
import { PropiedadFormPage } from '@/pages/propiedades/PropiedadFormPage';
import { ContratosPage } from '@/pages/contratos/ContratosPage';
import { ContratoFormPage } from '@/pages/contratos/ContratoFormPage';
import { CobranzasPage } from '@/pages/cobranzas/CobranzasPage';
import { MarketplacePage } from '@/pages/marketplace/MarketplacePage';
import { ConfiguracionPage } from '@/pages/configuracion/ConfiguracionPage';

/**
 * App — Root component del Panel Administrativo MyProp.
 *
 * Estructura:
 * ClerkProvider → RegionProvider → JoyrideProvider → BrowserRouter → Routes
 */
function App() {
  return (
    <ClerkProvider>
      <RegionProvider>
        <JoyrideProvider>
          <BrowserRouter>
            <JoyrideWrapper />
            <Toaster position="top-right" expand={false} richColors closeButton />
            <Routes>
              {/* ── Auth Routes (Standalone) ── */}
              <Route path="/login/*" element={<LoginPage />} />
              <Route path="/registro/*" element={<RegisterPage />} />

              {/* ── Búnker Routes (Protected & Layouted) ── */}
              <Route 
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                
                <Route 
                  path="/propietarios" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'vendedor']}>
                      <PropietariosPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/propiedades" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'vendedor']}>
                      <PropiedadesPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/propiedades/:id" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'vendedor']}>
                      <PropiedadFormPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/contratos" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'vendedor']}>
                      <ContratosPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/contratos/nuevo" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'vendedor']}>
                      <ContratoFormPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/cobranzas" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                      <CobranzasPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/inquilinos" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                      <InquilinosPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/marketplace" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                      <MarketplacePage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/configuracion" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                      <ConfiguracionPage />
                    </ProtectedRoute>
                  } 
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </JoyrideProvider>
      </RegionProvider>
    </ClerkProvider>
  );
}

export default App;
