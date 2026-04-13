"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import api from "@/lib/api";
import { useT } from "@/lib/i18n";
import { AxiosError } from "axios";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, User, Lock } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import clsx from "clsx";

interface PatientProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  countryCode: string;
  timezone: string;
  language: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { t, lang } = useT();
  const locale = lang === "en" ? enUS : es;
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<PatientProfile>({
    queryKey: ["profile"],
    queryFn: () => api.get("/patients/me").then((r) => r.data),
  });

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-ink-disabled" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">{t.profile.title}</h1>
        <p className="text-sm text-ink-tertiary mt-0.5">{t.profile.subtitle}</p>
      </div>

      {/* Avatar + member since */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl font-bold">
            {profile.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-ink">{profile.fullName}</p>
          <p className="text-xs text-ink-tertiary">{profile.email}</p>
          <p className="text-xs text-ink-disabled mt-0.5">
            {t.profile.memberSince} {format(new Date(profile.createdAt), "MMMM yyyy", { locale })}
          </p>
        </div>
      </div>

      {/* Personal info */}
      <ProfileForm profile={profile} onSaved={() => queryClient.invalidateQueries({ queryKey: ["profile"] })} />

      {/* Change password */}
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ profile, onSaved }: { profile: PatientProfile; onSaved: () => void }) {
  const { t } = useT();
  const [saved, setSaved] = useState(false);

  const schema = z.object({
    fullName: z.string().min(2, t.auth.nameTooShort).max(255),
    phone: z.string().max(50).optional(),
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: profile.fullName, phone: profile.phone ?? "" },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.patch("/patients/me", data).then((r) => r.data),
    onSuccess: () => {
      setServerError(null);
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: unknown) => {
      setServerError(e instanceof AxiosError ? e.response?.data?.message ?? e.message : "Error");
    },
  });

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <User size={15} className="text-brand-600" />
        <h2 className="text-sm font-semibold text-ink">{t.profile.personalInfo}</h2>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3.5">
        <div>
          <label className="field-label">{t.profile.fullName}</label>
          <input {...register("fullName")} className="field-input" autoComplete="name" />
          {errors.fullName && <p className="field-error"><AlertCircle size={11} />{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="field-label">{t.profile.email}</label>
          <input value={profile.email} disabled className="field-input opacity-60 cursor-not-allowed" />
          <p className="text-2xs text-ink-disabled mt-1">{t.profile.emailReadOnly}</p>
        </div>

        <div>
          <label className="field-label">{t.profile.phone}</label>
          <input {...register("phone")} type="tel" className="field-input" autoComplete="tel" placeholder="+54 11 1234-5678" />
        </div>

        {serverError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
            <AlertCircle size={13} className="flex-shrink-0" />{serverError}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className="btn-primary"
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : t.profile.saveChanges}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 size={14} />{t.profile.saved}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function PasswordForm() {
  const { t } = useT();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    currentPassword: z.string().min(1, t.auth.enterYourPassword),
    newPassword: z.string()
      .min(8, t.auth.minChars)
      .regex(/[A-Z]/, t.auth.needUppercase)
      .regex(/[a-z]/, t.auth.needLowercase)
      .regex(/\d/, t.auth.needNumber),
    confirmNewPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmNewPassword, {
    message: t.auth.passwordsMismatch,
    path: ["confirmNewPassword"],
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: FormData) =>
      api.post("/patients/me/change-password", { currentPassword, newPassword }),
    onSuccess: () => {
      setServerError(null);
      setSaved(true);
      reset();
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: unknown) => {
      setServerError(e instanceof AxiosError ? e.response?.data?.message ?? e.message : "Error");
    },
  });

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Lock size={15} className="text-brand-600" />
        <h2 className="text-sm font-semibold text-ink">{t.profile.security}</h2>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3.5">
        <div>
          <label className="field-label">{t.profile.currentPassword}</label>
          <div className="relative">
            <input
              {...register("currentPassword")}
              type={showCurrent ? "text" : "password"}
              className="field-input pr-10"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink-tertiary transition-colors">
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.currentPassword && <p className="field-error"><AlertCircle size={11} />{errors.currentPassword.message}</p>}
        </div>

        <div>
          <label className="field-label">{t.profile.newPassword}</label>
          <div className="relative">
            <input
              {...register("newPassword")}
              type={showNew ? "text" : "password"}
              className="field-input pr-10"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink-tertiary transition-colors">
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.newPassword && <p className="field-error"><AlertCircle size={11} />{errors.newPassword.message}</p>}
        </div>

        <div>
          <label className="field-label">{t.profile.confirmNewPassword}</label>
          <div className="relative">
            <input
              {...register("confirmNewPassword")}
              type={showConfirm ? "text" : "password"}
              className="field-input pr-10"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink-tertiary transition-colors">
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmNewPassword && <p className="field-error"><AlertCircle size={11} />{errors.confirmNewPassword.message}</p>}
        </div>

        {serverError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
            <AlertCircle size={13} className="flex-shrink-0" />{serverError}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : t.profile.changePassword}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 size={14} />{t.profile.passwordChanged}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
