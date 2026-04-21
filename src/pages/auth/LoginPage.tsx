import { CustomSignIn } from '../../components/auth/CustomSignIn';

/**
 * LoginPage — Muestra el formulario de Autenticación personalizado.
 * Identidad B2B de Myprop (Luxury Minimalist + Glassmorphism).
 */
export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-renta-50 p-4 relative overflow-hidden">
      {/* Círculos decorativos de fondo para potenciar el glassmorphism */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-renta-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-100/20 rounded-full blur-3xl animate-pulse" />

      <div className="w-full max-w-[440px] relative z-10">
        <div className="luxury-glass rounded-[40px] p-10 border border-white/50 shadow-2xl shadow-renta-950/5">
          {/* Logo superior */}
          <div className="mb-10 text-center flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-renta-950 shadow-xl shadow-renta-950/20 mb-6 group transition-transform hover:scale-110">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-7 w-7 text-white" fill="none">
                   <path d="M8 22V10l8 6-8 6z" fill="currentColor"/>
                   <path d="M16 22V10l8 6-8 6z" fill="currentColor" opacity="0.7"/>
                 </svg>
            </div>
            <h1 className="font-playfair text-3xl font-bold text-renta-950 tracking-tight">
              Bienvenido al <span className="italic">Búnker</span>
            </h1>
            <p className="mt-3 text-sm text-renta-600 font-inter max-w-[280px] mx-auto leading-relaxed">
              Inicia sesión para gestionar tu red inmobiliaria de élite.
            </p>
          </div>

          {/* Formulario Custom */}
          <CustomSignIn />
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-renta-400 font-inter">
            ¿Tu inmobiliaria aún no es parte? <a href="https://zonatia.com" className="text-renta-900 font-bold hover:underline">Súmate a la red</a>
          </p>
        </div>
      </div>
    </div>
  );
}
