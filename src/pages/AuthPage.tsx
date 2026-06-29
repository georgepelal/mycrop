import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, ShieldAlert, ArrowRight, Eye, EyeOff, Loader2, User } from "lucide-react";
import CompanyLogo from "../components/CompanyLogo";

export default function AuthPage() {
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, isMock } = useAuth();
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName || undefined);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Auth error", err);
      setErrorMsg(err?.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Google sign-in was cancelled or failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" id="auth-page-container">
      <div className="max-w-md w-full space-y-8 bg-white border border-gray-150 p-8 sm:p-10 rounded-3xl shadow-xl text-left">
        
        {/* Logo and header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <CompanyLogo />
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-black tracking-tight text-gray-950">
              {isSignUp ? t("auth.registerTitle") : t("auth.loginTitle")}
            </h2>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              {t("auth.desc")}
            </p>
          </div>
        </div>

        {isMock && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-4 py-3 rounded-2xl text-[11px] leading-relaxed flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-ping" />
            <div>
              <span className="font-black">Developer Sandbox Enabled</span>
              <p className="text-emerald-700/90 font-medium">To facilitate testing, clicking the submit button will auto-login the profile <strong>georgepelal@gmail.com</strong>.</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 text-red-800 border border-red-150 px-4 py-3 rounded-2xl text-[11px] leading-relaxed flex items-start gap-2.5" id="auth-error-banner">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
            <div>
              <span className="font-black">Verification Barrier</span>
              <p className="text-red-700/90 font-medium">{errorMsg}</p>
            </div>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          <div className="space-y-4">
            {/* Name input (only for registration) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Agronomist Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="George Pelal"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>
            )}

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Agronomist Email Coordinates
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="georgepelal@gmail.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Secure Password Access Pin
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3 px-4 rounded-xl text-xs font-display font-black tracking-wider uppercase shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Establishing Gateway...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? "Create Station Account" : "Access Telemetry Cabin"}</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center" id="auth-divider">
          <div className="flex-grow border-t border-gray-150"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none">or connection options</span>
          <div className="flex-grow border-t border-gray-150"></div>
        </div>

        <button
          type="button"
          id="google-auth-button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-750 border border-gray-200 py-3 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer hover:shadow hover:border-gray-300 disabled:opacity-50"
        >
          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>{isSignUp ? "Sign Up with Google" : "Sign In with Google"}</span>
        </button>

        {/* Auth Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-semibold text-brand-green hover:text-brand-green-hover transition-colors cursor-pointer"
          >
            {isSignUp ? "Already registered? Sign in instead" : "Need a telemetry station? Register boundary"}
          </button>
        </div>

      </div>
    </div>
  );
}
