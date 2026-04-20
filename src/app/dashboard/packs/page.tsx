"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Pack, PackType, Appointment } from "@/types";
import { format, addDays, startOfDay, setHours, setMinutes } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Check, Loader2, FlaskConical, ShoppingCart, AlertCircle, Star, UserCheck, Brain, RefreshCw, Package, CalendarDays, Clock, X, CalendarCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";
import { useCurrency, formatPrice } from "@/hooks/useCurrency";

function packTier(name: string): "acompanamiento" | "integral" | "profesional" | "other" {
  const n = name.toLowerCase();
  if (n.includes("acompañamiento") || n.includes("acompanamiento")) return "acompanamiento";
  if (n.includes("integral")) return "integral";
  if (n.includes("profesional")) return "profesional";
  return "other";
}

const AVAILABLE_HOURS = [9, 10, 11, 14, 15, 16, 17, 18, 19];

function ScheduleSection({ packId, lang, t, dateLocale, autoOpen = false }: {
  packId: string; lang: string; t: any; dateLocale: any; autoOpen?: boolean;
}) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(autoOpen);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoOpen && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [autoOpen]);

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: () => api.get("/appointments").then((r) => r.data),
  });

  const createAppt = useMutation({
    mutationFn: (body: { packId: string; scheduledAt: string; notes?: string }) =>
      api.post<Appointment>("/appointments", body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setShowForm(false);
      setSelectedDate(null);
      setSelectedHour(null);
      setNotes("");
      setSuccessMsg(t.appointments.successMsg);
      setTimeout(() => setSuccessMsg(null), 5000);
    },
  });

  const cancelAppt = useMutation({
    mutationFn: (id: string) =>
      api.patch<Appointment>(`/appointments/${id}/cancel`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i + 1));

  const handleSchedule = () => {
    if (!selectedDate || selectedHour === null) return;
    const dt = setMinutes(setHours(selectedDate, selectedHour), 0);
    createAppt.mutate({
      packId,
      scheduledAt: dt.toISOString(),
      notes: notes.trim() || undefined,
    });
  };

  const upcomingAppts = (appointments ?? []).filter(
    (a) => a.status !== "CANCELLED" && new Date(a.scheduledAt) > new Date()
  );

  const statusColor: Record<string, string> = {
    PENDING: "badge-yellow",
    CONFIRMED: "badge-green",
    CANCELLED: "badge-gray",
    COMPLETED: "badge-blue",
  };

  const statusLabel: Record<string, string> = {
    PENDING: t.appointments.pending,
    CONFIRMED: t.appointments.confirmed,
    CANCELLED: t.appointments.cancelled,
    COMPLETED: t.appointments.completed,
  };

  return (
    <div ref={sectionRef} className="space-y-4">
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CalendarCheck size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="section-heading flex items-center gap-2">
          <CalendarDays size={16} />
          {t.appointments.title}
        </h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            <CalendarDays size={13} />
            {t.appointments.schedule}
          </button>
        )}
      </div>

      {/* Scheduling form */}
      {showForm && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">{t.appointments.selectDate}</h3>
            <button onClick={() => setShowForm(false)} className="text-ink-tertiary hover:text-ink">
              <X size={16} />
            </button>
          </div>

          {/* Day picker */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {next7Days.map((day) => {
              const isSelected = selectedDate?.toDateString() === day.toDateString();
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { setSelectedDate(day); setSelectedHour(null); }}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-medium transition-all min-w-[64px] ${
                    isSelected
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-surface border-line text-ink-secondary hover:border-brand-300"
                  }`}
                >
                  <span className="uppercase text-[10px] font-bold opacity-70">
                    {format(day, "EEE", { locale: dateLocale })}
                  </span>
                  <span className="text-lg font-bold">{format(day, "d")}</span>
                  <span className="text-[10px] opacity-60">
                    {format(day, "MMM", { locale: dateLocale })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hour picker */}
          {selectedDate && (
            <div>
              <p className="text-xs text-ink-tertiary mb-2 flex items-center gap-1">
                <Clock size={12} />
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: dateLocale })}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {AVAILABLE_HOURS.map((hour) => {
                  const isSelected = selectedHour === hour;
                  return (
                    <button
                      key={hour}
                      onClick={() => setSelectedHour(hour)}
                      className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-surface border-line text-ink-secondary hover:border-brand-300"
                      }`}
                    >
                      {`${hour.toString().padStart(2, "0")}:00`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedHour !== null && (
            <div>
              <label className="text-xs text-ink-tertiary mb-1 block">{t.appointments.notes}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.appointments.notesPlaceholder}
                rows={2}
                className="input w-full text-sm"
              />
            </div>
          )}

          {/* Confirm */}
          {selectedDate && selectedHour !== null && (
            <button
              onClick={handleSchedule}
              disabled={createAppt.isPending}
              className="btn btn-primary w-full"
            >
              {createAppt.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <CalendarCheck size={14} />
                  {t.appointments.schedule} — {format(selectedDate, "EEE d MMM", { locale: dateLocale })} {selectedHour}:00hs
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Upcoming appointments */}
      {upcomingAppts.length > 0 ? (
        <div className="card p-0 divide-y divide-line">
          {upcomingAppts.map((appt) => (
            <div key={appt.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  {format(new Date(appt.scheduledAt), "EEEE d 'de' MMMM · HH:mm'hs'", { locale: dateLocale })}
                </p>
                <p className="text-xs text-ink-tertiary mt-0.5">
                  {t.appointments.with} {appt.therapistName} · {appt.durationMinutes} {t.appointments.duration}
                </p>
                {appt.notes && (
                  <p className="text-xs text-ink-disabled mt-0.5 italic">{appt.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${statusColor[appt.status]}`}>
                  {statusLabel[appt.status]}
                </span>
                {appt.status !== "CANCELLED" && appt.status !== "COMPLETED" && (
                  <button
                    onClick={() => cancelAppt.mutate(appt.id)}
                    disabled={cancelAppt.isPending}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    {cancelAppt.isPending ? "..." : t.appointments.cancel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="card text-center py-6">
          <CalendarDays size={28} className="mx-auto text-ink-disabled mb-2" />
          <p className="text-sm text-ink-tertiary">{t.appointments.empty}</p>
          <p className="text-xs text-ink-disabled mt-0.5">{t.appointments.emptyDesc}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function PacksPage() {
  const queryClient = useQueryClient();
  const { t, lang } = useT();
  const dateLocale = lang === "en" ? enUS : es;
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [promptSchedule, setPromptSchedule] = useState<string | null>(null); // packId after purchase

  const { data: packTypes, isLoading: loadingTypes } = useQuery<PackType[]>({
    queryKey: ["pack-types"],
    queryFn: () => api.get("/pack-types").then((r) => r.data),
  });

  const { data: myPacks } = useQuery<Pack[]>({
    queryKey: ["packs"],
    queryFn: () => api.get("/packs").then((r) => r.data),
  });

  const mockPurchase = useMutation({
    mutationFn: (packTypeId: string) =>
      api
        .post<{ packId: string; status: string; sessionsTotal: string }>(
          "/payments/mock-purchase",
          { packTypeId }
        )
        .then((r) => r.data),
    onSuccess: (data, packTypeId) => {
      const pt = packTypes?.find((p) => p.id === packTypeId);
      setErrorMsg(null);
      setSuccessMsg(`"${pt?.name}" — ${data.sessionsTotal} ${t.packs.sessions}`);
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      queryClient.invalidateQueries({ queryKey: ["active-pack"] });
      setTimeout(() => setSuccessMsg(null), 5000);

      // Auto-open scheduling for therapist packs
      if (pt) {
        const tier = packTier(pt.name);
        if (tier === "integral" || tier === "profesional") {
          setPromptSchedule(data.packId);
        }
      }
    },
    onError: () => {
      setErrorMsg(t.packs.errorActivate);
      setTimeout(() => setErrorMsg(null), 5000);
    },
  });

  const activePack = myPacks?.find((p) => p.status === "ACTIVE");
  const currency = useCurrency();

  const statusLabel: Record<Pack["status"], string> = {
    PENDING_PAYMENT: t.packs.statusPending,
    ACTIVE:          t.packs.statusActive,
    COMPLETED:       t.packs.statusCompleted,
    EXPIRED:         t.packs.statusExpired,
    REFUNDED:        t.packs.statusRefunded,
    CANCELLED:       t.packs.statusCancelled,
  };

  const hasNoPack = myPacks !== undefined && !myPacks.some((p) => p.status === "ACTIVE");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">{t.packs.title}</h1>
        <p className="text-ink-tertiary mt-1">{t.packs.subtitle}</p>
      </div>

      {/* No pack — onboarding banner */}
      {hasNoPack && (
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <Package size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-brand-800">
              {lang === "es" ? "Elegí un pack para comenzar" : "Choose a pack to get started"}
            </p>
            <p className="text-xs text-brand-700/70 mt-0.5">
              {lang === "es"
                ? "Necesitás un pack activo para acceder a tus sesiones, reportes y demás funciones de la plataforma."
                : "You need an active pack to access your sessions, reports, and other platform features."}
            </p>
          </div>
        </div>
      )}

      {/* Demo mode banner */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <FlaskConical size={16} className="text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">{t.packs.demoMode} —</span> {t.packs.demoDesc}
        </p>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <Check size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
        </div>
      )}

      {/* Error toast */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800">{errorMsg}</p>
        </div>
      )}

      {/* Active pack */}
      {activePack && (() => {
        const pct = activePack.sessionsTotal > 0
          ? Math.round((activePack.sessionsUsed / activePack.sessionsTotal) * 100) : 0;
        const tier = packTier(activePack.packType.name);

        return (
          <div className="relative rounded-2xl overflow-hidden ring-2 ring-brand-500 shadow-lg shadow-brand-500/10">
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                      <Check size={10} /> {t.packs.activePack}
                    </span>
                    {tier === "profesional" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-amber-400/30 text-amber-100 px-2.5 py-0.5 rounded-full">
                        <Star size={10} fill="currentColor" /> Premium
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold">{activePack.packType.name}</h2>
                  <p className="text-white/60 text-xs mt-0.5">
                    {t.packs.expires}{" "}
                    {activePack.expiresAt
                      ? format(new Date(activePack.expiresAt), "d MMM yyyy", { locale: dateLocale })
                      : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black leading-none">{activePack.sessionsRemaining}</p>
                  <p className="text-xs text-white/60 mt-1">{t.packs.sessionsRemaining}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-tertiary">
                  {activePack.sessionsUsed} / {activePack.sessionsTotal} {t.packs.sessionsUsed}
                </span>
                <span className="text-xs font-semibold text-brand-600">{pct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-brand-100 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 to-brand-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Buy a pack */}
      <div>
        <h2 className="section-heading mb-4">
          {activePack ? t.packs.renewPack : t.packs.choosePack}
        </h2>

        {loadingTypes ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-ink-disabled" size={32} />
          </div>
        ) : (
          <div className="grid gap-4">
            {packTypes?.map((pt) => {
              const tier = packTier(pt.name);
              const isHighlighted = tier === "integral";
              const isPro = tier === "profesional";

              const features: { label: string; icon: React.ElementType }[] = [];

              if (tier === "acompanamiento") {
                features.push(
                  { label: `${pt.sessionCount} ${lang === "es" ? "sesiones con IA" : "AI sessions"}`, icon: Brain },
                  { label: lang === "es" ? "Revisión de psicólogo por sesión" : "Psychologist review per session", icon: UserCheck },
                  { label: t.packs.reportPerSession, icon: Check },
                  { label: lang === "es" ? "Renovable" : "Renewable", icon: RefreshCw },
                  { label: `${pt.validityDays} ${t.packs.validityDays}`, icon: Check },
                );
              } else if (tier === "integral") {
                features.push(
                  { label: `${pt.sessionCount} ${lang === "es" ? "sesiones con IA" : "AI sessions"}`, icon: Brain },
                  { label: lang === "es" ? "Entrevista de cierre con psicólogo" : "Closing interview with psychologist", icon: UserCheck },
                  { label: lang === "es" ? "Reporte integrador" : "Integrating report", icon: Check },
                  { label: `${pt.validityDays} ${t.packs.validityDays}`, icon: Check },
                );
              } else if (isPro) {
                features.push(
                  { label: lang === "es" ? "Entrevista de admisión" : "Admission interview", icon: UserCheck },
                  { label: `${pt.sessionCount} ${lang === "es" ? "sesiones con psicólogo" : "sessions with psychologist"}`, icon: UserCheck },
                  { label: lang === "es" ? "Atención 100% humana" : "100% human care", icon: Star },
                  { label: `${pt.validityDays} ${t.packs.validityDays}`, icon: Check },
                );
              } else {
                features.push(
                  { label: `${pt.sessionCount} ${t.packs.sessions}`, icon: Check },
                  { label: `${pt.validityDays} ${t.packs.validityDays}`, icon: Check },
                  { label: t.packs.reportPerSession, icon: Check },
                );
              }

              return (
                <div key={pt.id} className={`card hover:shadow-card-hover transition-shadow ${
                  isHighlighted ? "ring-2 ring-brand-500 border-brand-300 relative overflow-hidden"
                  : isPro ? "ring-2 ring-amber-400 border-amber-200 relative overflow-hidden"
                  : ""
                }`}>
                  {isHighlighted && (
                    <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                      <Star size={10} fill="currentColor" />
                      {lang === "es" ? "Recomendado" : "Recommended"}
                    </div>
                  )}
                  {isPro && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                      <UserCheck size={10} />
                      {lang === "es" ? "100% Humano" : "100% Human"}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${
                        isHighlighted ? "text-brand-700" : isPro ? "text-amber-700" : "text-ink"
                      }`}>{pt.name}</h3>
                      <p className="text-sm text-ink-tertiary mt-0.5">{pt.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                        {features.map(({ label, icon: Icon }) => (
                          <span key={label} className="flex items-center gap-1 text-xs text-ink-secondary">
                            <Icon size={12} className={
                              isHighlighted ? "text-brand-500" : isPro ? "text-amber-500" : "text-emerald-500"
                            } />
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-2xl font-bold ${
                        isHighlighted ? "text-brand-600" : isPro ? "text-amber-600" : "text-ink"
                      }`}>
                        {currency.loading ? (
                          <span className="inline-block w-20 h-7 bg-surface-muted rounded animate-pulse" />
                        ) : (
                          formatPrice(pt.priceAmount, currency)
                        )}
                      </p>
                      <p className="text-xs text-ink-disabled">{currency.loading ? "" : currency.currency}</p>
                      <button
                        onClick={() => mockPurchase.mutate(pt.id)}
                        disabled={mockPurchase.isPending}
                        className="btn btn-primary btn-sm mt-3 w-full"
                      >
                        {mockPurchase.isPending && mockPurchase.variables === pt.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart size={13} />
                            {t.packs.mockPurchase}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Schedule appointment (only for Integral / Profesional packs) ── */}
      {promptSchedule ? (
        <ScheduleSection packId={promptSchedule} lang={lang} t={t} dateLocale={dateLocale} autoOpen />
      ) : activePack && (packTier(activePack.packType.name) === "integral" || packTier(activePack.packType.name) === "profesional") ? (
        <ScheduleSection packId={activePack.id} lang={lang} t={t} dateLocale={dateLocale} />
      ) : null}

      {/* History */}
      {myPacks && myPacks.length > 0 && (
        <div>
          <h2 className="section-heading mb-4">{t.packs.allPacks}</h2>
          <div className="card p-0 divide-y divide-line">
            {myPacks.map((pack) => (
              <div key={pack.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink">{pack.packType.name}</p>
                  <p className="text-xs text-ink-tertiary mt-0.5">
                    {pack.purchasedAt
                      ? format(new Date(pack.purchasedAt), "d MMM yyyy", { locale: dateLocale })
                      : t.packs.pendingDate}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-tertiary">
                    {pack.sessionsUsed}/{pack.sessionsTotal} {t.packs.sessions}
                  </span>
                  <span
                    className={`badge ${
                      pack.status === "ACTIVE"
                        ? "badge-green"
                        : pack.status === "COMPLETED"
                        ? "badge-blue"
                        : pack.status === "PENDING_PAYMENT"
                        ? "badge-yellow"
                        : "badge-gray"
                    }`}
                  >
                    {statusLabel[pack.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
