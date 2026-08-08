// Mock de @clerk/clerk-react para rama MOCK
import React, { type ReactNode } from "react";

const MOCK_USER = {
  id: "user_superadmin_001",
  fullName: "Martín Gutiérrez",
  firstName: "Martín",
  lastName: "Gutiérrez",
  primaryEmailAddress: { emailAddress: "admin@propiedadesdelplata.com" },
  emailAddresses: [{ emailAddress: "admin@propiedadesdelplata.com" }],
  imageUrl: "",
  publicMetadata: {
    inmobiliaria_id: "imm_001",
    nombre: "Propiedades del Plata",
    logo_url: "",
    role: "superadmin",
    country_code: "AR",
    suscripcion: {
      status: "activa",
      isBlocked: false,
      is_vip: false,
      fecha_vencimiento: "2026-06-15",
      proximo_pago: "2026-05-15",
    },
  },
};

export const ClerkProvider = ({ children }: { children: ReactNode; publishableKey?: string; appearance?: unknown }) =>
  React.createElement(React.Fragment, null, children);

export const SignedIn = ({ children }: { children: ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const SignedOut = ({ children }: { children: ReactNode }) => null;

export const SignInButton = ({ children }: { children?: ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const RedirectToSignIn = () => null;
export const SignUp = () => null;
export const SignIn = () => null;
export const UserButton = () => null;

export function useUser() {
  return { user: MOCK_USER, isLoaded: true, isSignedIn: true };
}

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: MOCK_USER.id,
    sessionId: "sess_mock_001",
    getToken: async () => "mock_superadmin_token",
    signOut: async () => {},
  };
}

export function useSession() {
  return { session: { id: "sess_mock_001" }, isLoaded: true, isSignedIn: true };
}

export function useClerk() {
  return {
    user: MOCK_USER,
    session: { id: "sess_mock_001" },
    signOut: async () => {},
    openSignIn: () => {},
    closeSignIn: () => {},
    openSignUp: () => {},
  };
}

export function useSignIn() {
  return { isLoaded: true, signIn: null, setActive: async () => {} };
}

export function useSignUp() {
  return { isLoaded: true, signUp: null, setActive: async () => {} };
}

export { ClerkProvider as default };