import { SignUp } from '@clerk/clerk-react';

/**
 * RegisterPage — Muestra el formulario de Registro B2B de Clerk en modo Centered.
 */
export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-renta-50 p-4">
      <div className="w-full max-w-[440px] animate-fade-in-up">
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-renta-400 to-renta-600 shadow-lg shadow-renta-500/20 mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-6 w-6 text-white" fill="none">
                 <path d="M8 22V10l8 6-8 6z" fill="currentColor"/>
                 <path d="M16 22V10l8 6-8 6z" fill="currentColor" opacity="0.7"/>
               </svg>
          </div>
          <h1 className="font-playfair text-2xl font-semibold text-renta-950">
            Regístrate en <span className="italic">MyProp</span>
          </h1>
          <p className="mt-2 text-sm text-renta-600 font-inter">
            Únete al estándar líder de gestión PropTech.
          </p>
        </div>

        {/* Modal SignUp Clerk */}
        <SignUp 
          routing="path" 
          path="/registro" 
          signInUrl="/login"
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
}
