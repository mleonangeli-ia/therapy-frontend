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
import clsx from "clsx";

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
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface-subtle">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-600 p-12 text-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span className="font-semibold text-sm">TherapyAI</span>
        </div>
        <div className="space-y-4 max-w-xs">
          <h2 className="text-2xl font-semibold leading-snug">{t.auth.brandTagline}</h2>
          <p className="text-brand-200 text-sm leading-relaxed">{t.auth.brandDesc}</p>
        </div>
        <p className="text-brand-300 text-xs">
          © {new Date().getFullYear()} TherapyAI · {t.auth.allRights}
        </p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8 relative">
        {/* Language selector */}
        <div className="absolute top-4 right-4 flex gap-1">
          {(["es", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={clsx("text-xs px-2.5 py-1 rounded-md font-medium transition-colors",
                lang === l ? "bg-brand-600 text-white" : "text-ink-tertiary hover:bg-surface-muted"
              )}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span className="font-semibold text-ink text-sm">TherapyAI</span>
          </div>

          <h1 className="text-xl font-semibold text-ink mb-1">{t.auth.login}</h1>
          <p className="text-sm text-ink-tertiary mb-6">{t.auth.loginSubtitle}</p>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div>
              <label className="field-label">{t.auth.email}</label>
              <input {...register("email")} type="email" className="field-input"
                placeholder="tu@email.com" autoComplete="email" />
              {errors.email && <p className="field-error"><AlertCircle size={11} />{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="field-label mb-0">{t.auth.password}</label>
                <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <input {...register("password")} type={showPassword ? "text" : "password"} className="field-input pr-10"
                  placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-ink-disabled hover:text-ink-tertiary transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="field-error"><AlertCircle size={11} />{errors.password.message}</p>}
            </div>

            {(serverError || anyError) && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
                <AlertCircle size={13} className="flex-shrink-0" />{serverError || anyError}
              </div>
            )}

            <button type="submit" className="btn-primary btn-lg w-full" disabled={mutation.isPending}>
              {mutation.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <><span>{t.auth.loginBtn}</span><ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-xs text-ink-tertiary mt-5">
            {t.auth.noAccount}{" "}
            <Link href="/auth/register" className="font-medium text-brand-600 hover:text-brand-700">
              {t.auth.createAccount}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
