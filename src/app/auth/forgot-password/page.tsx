"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { ArrowRight, Loader2, AlertCircle, CheckCircle, Mail, KeyRound, Lock } from "lucide-react";
import { useT } from "@/lib/i18n";
import clsx from "clsx";

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t, lang, setLang } = useT();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  // ── Step 1: email ──────────────────────────────────────────────
  const emailSchema = z.object({ email: z.string().email(t.auth.invalidEmail) });
  type EmailForm = z.infer<typeof emailSchema>;
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

  const sendCode = useMutation({
    mutationFn: (data: EmailForm) =>
      api.post("/auth/forgot-password", data).then((r) => r.data),
    onSuccess: (_, variables) => {
      setEmail(variables.email);
      setStep("otp");
    },
  });

  // ── Step 2: OTP ────────────────────────────────────────────────
  const otpSchema = z.object({
    otp: z.string().length(6, lang === "en" ? "Must be 6 digits" : "Debe tener 6 dígitos").regex(/^\d+$/, lang === "en" ? "Digits only" : "Solo dígitos"),
  });
  type OtpForm = z.infer<typeof otpSchema>;
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const verifyOtp = useMutation({
    mutationFn: (data: OtpForm) =>
      api.post<{ resetToken: string }>("/auth/forgot-password/verify", { email, otp: data.otp }).then((r) => r.data),
    onSuccess: (data) => {
      setResetToken(data.resetToken);
      setStep("password");
    },
  });

  // ── Step 3: new password ───────────────────────────────────────
  const passwordSchema = z.object({
    newPassword: z.string().min(8, t.auth.minChars),
    confirm: z.string(),
  }).refine((d) => d.newPassword === d.confirm, {
    message: t.auth.passwordsMismatch,
    path: ["confirm"],
  });
  type PasswordForm = z.infer<typeof passwordSchema>;
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const resetPassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.post("/auth/forgot-password/reset", { resetToken, newPassword: data.newPassword }).then((r) => r.data),
    onSuccess: () => setStep("done"),
  });

  const getServerError = (error: unknown) =>
    error instanceof AxiosError ? error.response?.data?.message : null;

  const brandPanel = (
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
      <p className="text-brand-300 text-xs">© {new Date().getFullYear()} TherapyAI · {t.auth.allRights}</p>
    </div>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface-subtle">
      {brandPanel}

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
          {/* Progress dots */}
          {step !== "done" && (
            <div className="flex items-center gap-2 mb-8">
              {(["email", "otp", "password"] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={clsx(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                    step === s ? "bg-brand-600 text-white" :
                    ["email", "otp", "password"].indexOf(step) > i ? "bg-brand-100 text-brand-600" :
                    "bg-surface-muted text-ink-disabled"
                  )}>
                    {["email", "otp", "password"].indexOf(step) > i
                      ? <CheckCircle size={14} />
                      : i + 1}
                  </div>
                  {i < 2 && <div className={clsx("flex-1 h-0.5 w-8", ["email", "otp", "password"].indexOf(step) > i ? "bg-brand-300" : "bg-line")} />}
                </div>
              ))}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Mail size={20} />
              </div>
              <h1 className="text-xl font-semibold text-ink mb-1">{t.auth.forgotTitle}</h1>
              <p className="text-sm text-ink-tertiary mb-6">{t.auth.forgotSubtitle}</p>

              <form onSubmit={emailForm.handleSubmit((d) => sendCode.mutate(d))} className="space-y-4">
                <div>
                  <label className="field-label">{t.auth.email}</label>
                  <input {...emailForm.register("email")} type="email" className="field-input"
                    placeholder="tu@email.com" autoComplete="email" />
                  {emailForm.formState.errors.email && (
                    <p className="field-error"><AlertCircle size={11} />{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                {getServerError(sendCode.error) && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
                    <AlertCircle size={13} className="flex-shrink-0" />{getServerError(sendCode.error)}
                  </div>
                )}

                <button type="submit" className="btn-primary btn-lg w-full" disabled={sendCode.isPending}>
                  {sendCode.isPending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><span>{t.auth.sendCode}</span><ArrowRight size={14} /></>}
                </button>
              </form>

              <p className="text-center text-xs text-ink-tertiary mt-5">
                <Link href="/auth/login" className="font-medium text-brand-600 hover:text-brand-700">
                  {t.auth.backToLogin}
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <KeyRound size={20} />
              </div>
              <h1 className="text-xl font-semibold text-ink mb-1">{t.auth.checkEmail}</h1>
              <p className="text-sm text-ink-tertiary mb-6">
                {t.auth.checkEmailDesc} <span className="font-medium text-ink">{email}</span>
              </p>

              <form onSubmit={otpForm.handleSubmit((d) => verifyOtp.mutate(d))} className="space-y-4">
                <div>
                  <label className="field-label">{t.auth.otpLabel}</label>
                  <input
                    {...otpForm.register("otp")}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="field-input text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder={t.auth.otpPlaceholder}
                    autoComplete="one-time-code"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="field-error"><AlertCircle size={11} />{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                {getServerError(verifyOtp.error) && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
                    <AlertCircle size={13} className="flex-shrink-0" />{getServerError(verifyOtp.error)}
                  </div>
                )}

                <button type="submit" className="btn-primary btn-lg w-full" disabled={verifyOtp.isPending}>
                  {verifyOtp.isPending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><span>{t.auth.verifyCode}</span><ArrowRight size={14} /></>}
                </button>
              </form>

              <p className="text-center text-xs text-ink-tertiary mt-4">
                <button onClick={() => { sendCode.mutate({ email }); otpForm.reset(); }}
                  className="font-medium text-brand-600 hover:text-brand-700 cursor-pointer">
                  {lang === "en" ? "Resend code" : "Reenviar código"}
                </button>
              </p>
            </>
          )}

          {/* ── Step 3: New password ── */}
          {step === "password" && (
            <>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Lock size={20} />
              </div>
              <h1 className="text-xl font-semibold text-ink mb-1">{t.auth.newPassword}</h1>
              <p className="text-sm text-ink-tertiary mb-6">
                {lang === "en" ? "Choose a strong password for your account." : "Elegí una contraseña segura para tu cuenta."}
              </p>

              <form onSubmit={passwordForm.handleSubmit((d) => resetPassword.mutate(d))} className="space-y-4">
                <div>
                  <label className="field-label">{t.auth.newPasswordLabel}</label>
                  <input {...passwordForm.register("newPassword")} type="password" className="field-input"
                    placeholder="••••••••" autoComplete="new-password" />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="field-error"><AlertCircle size={11} />{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="field-label">{t.auth.confirmNewPassword}</label>
                  <input {...passwordForm.register("confirm")} type="password" className="field-input"
                    placeholder="••••••••" autoComplete="new-password" />
                  {passwordForm.formState.errors.confirm && (
                    <p className="field-error"><AlertCircle size={11} />{passwordForm.formState.errors.confirm.message}</p>
                  )}
                </div>

                {getServerError(resetPassword.error) && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
                    <AlertCircle size={13} className="flex-shrink-0" />{getServerError(resetPassword.error)}
                  </div>
                )}

                <button type="submit" className="btn-primary btn-lg w-full" disabled={resetPassword.isPending}>
                  {resetPassword.isPending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><span>{t.auth.savePassword}</span><ArrowRight size={14} /></>}
                </button>
              </form>
            </>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} />
              </div>
              <h1 className="text-xl font-semibold text-ink mb-2">{t.auth.passwordReset}</h1>
              <p className="text-sm text-ink-tertiary mb-8">{t.auth.passwordResetDesc}</p>
              <button onClick={() => router.push("/auth/login")} className="btn-primary btn-lg w-full flex items-center justify-center gap-2">
                {t.auth.goToLogin} <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
