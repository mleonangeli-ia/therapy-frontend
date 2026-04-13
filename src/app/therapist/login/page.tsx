"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";

const rawApi = axios.create({ baseURL: "/api" });
import { ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Stethoscope } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});
type FormData = z.infer<typeof schema>;

interface TherapistAuthResponse {
  accessToken: string;
  therapistId: string;
  fullName: string;
  email: string;
}

export default function TherapistLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      rawApi.post<TherapistAuthResponse>("/therapist/login", data).then((r) => r.data),
    onSuccess: (data) => {
      localStorage.setItem("therapist_token", data.accessToken);
      localStorage.setItem("therapist_id", data.therapistId);
      localStorage.setItem("therapist_name", data.fullName);
      router.push("/therapist/portal");
    },
  });

  const serverError =
    mutation.error instanceof AxiosError ? mutation.error.response?.data?.message : null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface-subtle">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-emerald-700 p-12 text-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Stethoscope size={13} className="text-white" />
          </div>
          <span className="font-semibold text-sm">TherapyAI · Portal Profesional</span>
        </div>
        <div className="space-y-4 max-w-xs">
          <h2 className="text-2xl font-semibold leading-snug">Seguimiento clínico de tus pacientes</h2>
          <p className="text-emerald-200 text-sm leading-relaxed">
            Accedé al historial de sesiones, evolución del estado de ánimo y transcripciones de todos tus pacientes.
          </p>
        </div>
        <p className="text-emerald-300 text-xs">© {new Date().getFullYear()} TherapyAI</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center">
              <Stethoscope size={13} className="text-white" />
            </div>
            <span className="font-semibold text-ink text-sm">TherapyAI · Profesional</span>
          </div>

          <h1 className="text-xl font-semibold text-ink mb-1">Acceso profesional</h1>
          <p className="text-sm text-ink-tertiary mb-6">Ingresá con tu cuenta de terapeuta</p>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div>
              <label className="field-label">Email</label>
              <input {...register("email")} type="email" className="field-input"
                placeholder="tu@email.com" autoComplete="email" />
              {errors.email && <p className="field-error"><AlertCircle size={11} />{errors.email.message}</p>}
            </div>
            <div>
              <label className="field-label">Contraseña</label>
              <div className="relative">
                <input {...register("password")} type={showPassword ? "text" : "password"}
                  className="field-input pr-10" placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink-tertiary">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="field-error"><AlertCircle size={11} />{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
                <AlertCircle size={13} className="flex-shrink-0" />{serverError}
              </div>
            )}

            <button type="submit" disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-colors disabled:opacity-60">
              {mutation.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <><span>Ingresar</span><ArrowRight size={14} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
