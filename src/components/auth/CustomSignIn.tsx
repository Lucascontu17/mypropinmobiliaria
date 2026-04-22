import { useState, useEffect } from 'react';
import { useSignIn, useClerk } from '@clerk/clerk-react';
import { Mail, Lock, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const SignInSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida")
});

export const CustomSignIn = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const clerk = useClerk();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<'signIn' | '2FA'>('signIn');
  const [code, setCode] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  // Clear zombie sessions on mount
  // Clear zombie sessions on mount (Commented out to prevent F5 sign-out)
  /*
  useEffect(() => {
    const cleanStale = async () => {
      if (!clerk.loaded) return;
      const activeSessions = clerk.client?.sessions || [];
      if (activeSessions.length > 0 && !clerk.user) {
        try { await clerk.signOut(); } catch (_) {}
      }
    };
    cleanStale();
  }, [clerk.loaded]);
  */

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
        navigate("/");
      } else if (result.status === "needs_second_factor") {
        try {
          const factor = result.supportedSecondFactors?.[0];
          if (factor) {
            await result.prepareSecondFactor({ strategy: (factor as any).strategy } as any);
            setSelectedStrategy((factor as any).strategy);
            setMode('2FA');
            setCode('');
          } else {
            setErrorMsg("No hay métodos de verificación disponibles.");
          }
        } catch (prepErr: any) {
          setErrorMsg(prepErr.errors?.[0]?.message || "Error al enviar código 2FA");
        }
      } else {
        console.warn("SignIn incompleto", result);
        setErrorMsg(`Login incompleto: ${result.status}`);
      }
    } catch (err: any) {
      // Handle zombie session conflict
      if (err.errors?.[0]?.code === "session_exists" || err.message?.includes("already exists")) {
        try {
          const existingSessions = clerk.client?.sessions || [];
          if (existingSessions.length > 0) {
            await setActive({ session: existingSessions[0].id });
            navigate("/");
            return;
          }
        } catch (_) {}
        await clerk.signOut();
        setErrorMsg("Sesión anterior limpiada. Intentá de nuevo.");
        return;
      }
      if (err instanceof z.ZodError) {
        setErrorMsg(err.issues[0].message);
      } else {
        setErrorMsg(err.errors?.[0]?.message || "Credenciales inválidas o error de conexión");
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isLoaded || !signIn) return;

    try {
      setLoading(true);
      setErrorMsg('');
      const result = await signIn.attemptSecondFactor({
        strategy: selectedStrategy as any,
        code
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/");
      } else {
        setErrorMsg("Código inválido o expirado.");
      }
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.message || "Error al verificar código");
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

        {mode === 'signIn' ? (
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
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-xs text-renta-500 font-inter">Tu cuenta requiere segundo factor. Ingresa el código enviado a tu correo.</p>
            </div>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-renta-400 group-focus-within:text-renta-600 transition-colors" />
              <input 
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                placeholder="Código de 6 dígitos" 
                maxLength={6}
                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-renta-100 rounded-2xl font-inter text-center text-lg tracking-widest focus:outline-none focus:border-renta-500 focus:bg-white transition-all shadow-sm"
                autoFocus
              />
            </div>
            <button type="button" onClick={() => setMode('signIn')} className="w-full text-center text-[10px] text-renta-400 hover:text-renta-600 uppercase tracking-widest transition-colors">Volver</button>
          </div>
        )}

        <button 
          type="submit"
          onClick={mode === 'signIn' ? handleSignIn : handle2FA}
          disabled={loading}
          className="w-full bg-renta-950 text-white py-3.5 rounded-2xl font-inter text-sm font-bold hover:bg-renta-900 transition-all shadow-lg shadow-renta-950/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {mode === 'signIn' ? 'Entrar al Búnker' : 'Verificar Identidad'}
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
