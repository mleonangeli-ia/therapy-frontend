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

export default function RegisterPage() {
  const router = useRouter();
  const { t, lang, setLang } = useT();

  const schema = z.object({
    fullName:        z.string().min(2, t.auth.nameTooShort).max(255),
    email:           z.string().email(t.auth.invalidEmail),
    password:        z.string().min(8, t.auth.minChars)
      .regex(/[A-Z]/, t.auth.needUppercase)
      .regex(/[a-z]/, t.auth.needLowercase)
      .regex(/\d/,    t.auth.needNumber),
    confirmPassword: z.string(),
    phone:           z.string().optional(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: t.auth.passwordsMismatch,
    path: ["confirmPassword"],
  });
  type FormData = z.infer<typeof schema>;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: Omit<FormData, "confirmPassword">) =>
      api.post<AuthResponse>("/auth/register", data).then((r) => r.data),
    onSuccess: (data) => {
      saveAuth(data);
      router.push(data.consentRequired ? "/auth/consent" : "/dashboard");
    },
  });

  const onSubmit = ({ confirmPassword: _, ...rest }: FormData) => mutation.mutate(rest);
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

          <h1 className="text-xl font-semibold text-ink mb-1">{t.auth.register}</h1>
          <p className="text-sm text-ink-tertiary mb-6">{t.auth.registerSubtitle}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="field-label">{t.auth.fullName}</label>
              <input {...register("fullName")} className="field-input" placeholder="Tu nombre" autoComplete="name" />
              {errors.fullName && <p className="field-error"><AlertCircle size={11} />{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="field-label">{t.auth.email}</label>
              <input {...register("email")} type="email" className="field-input" placeholder="tu@email.com" autoComplete="email" />
              {errors.email && <p className="field-error"><AlertCircle size={11} />{errors.email.message}</p>}
            </div>
            <div>
              <label className="field-label">{t.auth.phone}</label>
              <input {...register("phone")} type="tel" className="field-input" placeholder="+54 11 1234-5678" autoComplete="tel" />
            </div>
            <div>
              <label className="field-label">{t.auth.password}</label>
              <div className="relative">
                <input {...register("password")} type={showPassword ? "text" : "password"} className="field-input pr-10" placeholder="••••••••" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink-tertiary transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="field-error"><AlertCircle size={11} />{errors.password.message}</p>}
            </div>
            <div>
              <label className="field-label">{t.auth.confirmPassword}</label>
              <div className="relative">
                <input {...register("confirmPassword")} type={showConfirm ? "text" : "password"} className="field-input pr-10" placeholder="••••••••" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink-tertiary transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="field-error"><AlertCircle size={11} />{errors.confirmPassword.message}</p>}
            </div>

            {serverError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
                <AlertCircle size={13} className="flex-shrink-0" />{serverError}
              </div>
            )}

            <button type="submit" className="btn-primary btn-lg w-full" disabled={mutation.isPending}>
              {mutation.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <><span>{t.auth.registerBtn}</span><ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-xs text-ink-tertiary mt-5">
            {t.auth.hasAccount}{" "}
            <Link href="/auth/login" className="font-medium text-brand-600 hover:text-brand-700">
              {t.auth.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
