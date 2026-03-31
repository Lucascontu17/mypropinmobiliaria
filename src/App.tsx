import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@/providers/ClerkProvider';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
            {/* Etapa 2+: Agregar rutas adicionales aquí evaluando allowedRoles en sus propios ProtectedRoutes */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
