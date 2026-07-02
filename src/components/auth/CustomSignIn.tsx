import { useState } from 'react';
import { useSignIn, useClerk } from '@clerk/clerk-react';
import { Mail, Lock, Loader2, ArrowRight, KeyRound, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const SignInSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida")
});

type AuthMode = 'signIn' | '2FA' | 'resetPassword' | 'resetCode';

export const CustomSignIn = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const clerk = useClerk();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);


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

  const handleResetRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isLoaded || !signIn) return;

    try {
      setLoading(true);
      setErrorMsg('');
      if (!email) { setErrorMsg("Ingresá tu email para recuperar la contraseña."); return; }

      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setMode('resetCode');
      setCode('');
      setNewPassword('');
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrorMsg(err.issues[0].message);
      } else {
        setErrorMsg(err.errors?.[0]?.message || "Error al enviar el código de recuperación");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isLoaded || !signIn) return;

    try {
      setLoading(true);
      setErrorMsg('');
      if (!code || !newPassword) {
        setErrorMsg("Completá el código y la nueva contraseña.");
        return;
      }
      if (newPassword.length < 8) {
        setErrorMsg("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }

      // Attempt first factor with the reset code
      const attemptResult = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });

      if (attemptResult.status !== "needs_new_password") {
        setErrorMsg("Estado inesperado: " + attemptResult.status);
        return;
      }

      // Reset the password
      const resetResult = await signIn.resetPassword({ password: newPassword });

      if (resetResult.status === "complete") {
        await setActive({ session: resetResult.createdSessionId });
        navigate("/");
      } else {
        setErrorMsg("No se pudo restablecer la contraseña. Estado: " + resetResult.status);
      }
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.message || "Error al restablecer la contraseña");
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

  const getFormTitle = () => {
    switch (mode) {
      case 'signIn': return 'Entrar al Búnker';
      case '2FA': return 'Verificar Identidad';
      case 'resetPassword': return 'Enviar Código';
      case 'resetCode': return 'Restablecer Contraseña';
    }
  };

  return (
    <div className="w-full animate-fade-in-up">
      <form onSubmit={
        mode === 'signIn' ? handleSignIn :
        mode === '2FA' ? handle2FA :
        mode === 'resetPassword' ? handleResetRequest :
        handleResetPassword
      } className="space-y-5">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-inter rounded-xl animate-shake text-center">
            {errorMsg}
          </div>
        )}

        {mode === 'signIn' && (
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

            <button
              type="button"
              onClick={() => { setMode('resetPassword'); setErrorMsg(''); }}
              className="w-full text-center text-[11px] text-renta-500 hover:text-renta-700 underline underline-offset-2 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {mode === '2FA' && (
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

        {mode === 'resetPassword' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-xs text-renta-500 font-inter">Te enviaremos un código para restablecer tu contraseña.</p>
            </div>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-renta-400 group-focus-within:text-renta-600 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Tu email registrado"
                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-renta-100 rounded-2xl font-inter text-sm focus:outline-none focus:border-renta-500 focus:bg-white transition-all shadow-sm"
              />
            </div>
            <button type="button" onClick={() => { setMode('signIn'); setErrorMsg(''); }} className="w-full text-center text-[10px] text-renta-400 hover:text-renta-600 uppercase tracking-widest transition-colors">Volver al inicio</button>
          </div>
        )}

        {mode === 'resetCode' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-xs text-renta-500 font-inter">Ingresá el código que enviamos a <strong>{email}</strong> y tu nueva contraseña.</p>
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
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-renta-400 group-focus-within:text-renta-600 transition-colors" />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-renta-100 rounded-2xl font-inter text-sm focus:outline-none focus:border-renta-500 focus:bg-white transition-all shadow-sm"
              />
            </div>
            <button type="button" onClick={() => { setMode('resetPassword'); setErrorMsg(''); setCode(''); setNewPassword(''); }} className="w-full text-center text-[10px] text-renta-400 hover:text-renta-600 uppercase tracking-widest transition-colors">Volver</button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-renta-950 text-white py-3.5 rounded-2xl font-inter text-sm font-bold hover:bg-renta-900 transition-all shadow-lg shadow-renta-950/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {getFormTitle()}
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
