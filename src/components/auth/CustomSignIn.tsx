import { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { z } from 'zod';

const SignInSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida")
});

export const CustomSignIn = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isLoaded) return;

    try {
      setLoading(true);
      setErrorMsg('');
      SignInSchema.parse({ email, password });

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/";
      } else {
        console.warn("SignIn incompleto", result);
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrorMsg(err.issues[0].message);
      } else {
        setErrorMsg(err.errors?.[0]?.message || "Credenciales inválidas o error de conexión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-in-up">
      <form onSubmit={handleSignIn} className="space-y-5">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-inter rounded-xl animate-shake text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-renta-400 group-focus-within:text-renta-600 transition-colors" />
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Email institucional" 
              className="w-full pl-11 pr-4 py-3 bg-white/50 border border-renta-100 rounded-2xl font-inter text-sm focus:outline-none focus:border-renta-500 focus:bg-white transition-all shadow-sm"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-renta-400 group-focus-within:text-renta-600 transition-colors" />
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Contraseña" 
              className="w-full pl-11 pr-4 py-3 bg-white/50 border border-renta-100 rounded-2xl font-inter text-sm focus:outline-none focus:border-renta-500 focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-renta-950 text-white py-3.5 rounded-2xl font-inter text-sm font-bold hover:bg-renta-900 transition-all shadow-lg shadow-renta-950/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Entrar al Búnker
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-renta-400 font-inter uppercase tracking-widest">
            Zonatia Real Estate Ecosystem — Identity Protocol v2.1.5
          </p>
        </div>
      </form>
    </div>
  );
};
