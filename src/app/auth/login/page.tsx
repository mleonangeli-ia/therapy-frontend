"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { AuthResponse } from "@/types";
import { AxiosError } from "axios";
import { ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useState } from "react";

const Logo = () => (
  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4a9fd8] to-[#0acad0] flex items-center justify-center shadow-lg shadow-cyan-500/20">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useT();

  const schema = z.object({
    email:    z.string().email(t.auth.invalidEmail),
    password: z.string().min(1, t.auth.enterYourPassword),
  });
  type FormData = z.infer<typeof schema>;

  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const [anyError, setAnyError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post<AuthResponse>("/auth/login", data).then((r) => r.data),
    onSuccess: (data) => {
      setAnyError(null);
      saveAuth(data);
      router.push(data.consentRequired ? "/auth/consent" : "/dashboard");
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        setAnyError(error.response?.data?.message || error.message || "Error al iniciar sesión");
      } else if (error instanceof Error) {
        setAnyError(error.message);
      } else {
        setAnyError("Error desconocido");
      }
    },
  });
  const serverError =
    mutation.error instanceof AxiosError ? mutation.error.response?.data?.message : null;

  return (
    <div className="min-h-screen bg-[#080c18] text-white flex flex-col overflow-x-hidden">
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative border-b border-white/[0.06] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-semibold text-white text-sm tracking-tight">TherapyAI</span>
        </Link>
        <div className="flex items-center gap-2">
          {(["es", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                lang === l ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1.5">{t.auth.login}</h1>
            <p className="text-sm text-white/40">{t.auth.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">{t.auth.email}</label>
              <input
                {...register("email")}
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
              />
              {errors.email && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle size={11} />{errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/60">{t.auth.password}</label>
                <Link href="/auth/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle size={11} />{errors.password.message}
                </p>
              )}
            </div>

            {(serverError || anyError) && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-3 py-2.5">
                <AlertCircle size={13} className="flex-shrink-0" />{serverError || anyError}
              </div>
            )}

            <button type="submit" disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#4a9fd8] to-[#0acad0] text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {mutation.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <><span>{t.auth.loginBtn}</span><ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-6">
            {t.auth.noAccount}{" "}
            <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              {t.auth.createAccount}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
