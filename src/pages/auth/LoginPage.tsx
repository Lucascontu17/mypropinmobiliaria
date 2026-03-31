import { SignIn } from '@clerk/clerk-react';

/**
 * LoginPage — Muestra el formulario de Autenticación de Clerk en modo Centered.
 * Adaptado a la identidad B2B de Myprop (Luxury Minimalist).
 */
export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-renta-50 p-4">
      <div className="w-full max-w-[440px] animate-fade-in-up">
        {/* Logo superior opcional */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-renta-400 to-renta-600 shadow-lg shadow-renta-500/20 mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-6 w-6 text-white" fill="none">
                 <path d="M8 22V10l8 6-8 6z" fill="currentColor"/>
                 <path d="M16 22V10l8 6-8 6z" fill="currentColor" opacity="0.7"/>
               </svg>
          </div>
          <h1 className="font-playfair text-2xl font-semibold text-renta-950">
            Bienvenido al <span className="italic">Búnker</span>
          </h1>
          <p className="mt-2 text-sm text-renta-600 font-inter">
            Inicia sesión para gestionar tu red inmobiliaria.
          </p>
        </div>

        {/* Modal SignIn Clerk */}
        <SignIn 
          routing="path" 
          path="/login" 
          signUpUrl="/registro" 
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
}
