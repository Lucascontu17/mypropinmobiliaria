import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@/providers/ClerkProvider';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PropietariosPage } from '@/pages/actores/PropietariosPage';
import { InquilinosPage } from '@/pages/actores/InquilinosPage';

/**
 * App — Root component del Panel Administrativo MyProp.
 *
 * Estructura:
 * ClerkProvider → BrowserRouter → Routes
 * -- Rutas Publicas (Auth)
 * -- Rutas Protegidas (Dashboard, etc.)
 */
function App() {
  return (
    <ClerkProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Auth Routes (Standalone) ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          {/* ── Búnker Routes (Protected & Layouted) ── */}
          <Route 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            
            {/* Actores: Múltiples Roles evaluados localmente */}
            <Route 
              path="/propietarios" 
              element={
                <ProtectedRoute allowedRoles={['superadmin', 'admin', 'vendedor']}>
                  <PropietariosPage />
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
            
          </Route>
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
