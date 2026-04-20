"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import axios from "axios";
import { Pack, PackType } from "@/types";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Check, Loader2, FlaskConical, ShoppingCart, AlertCircle, Star, UserCheck, Brain, RefreshCw, Package } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useCurrency, formatPrice } from "@/hooks/useCurrency";

function packTier(name: string): "acompanamiento" | "integral" | "profesional" | "other" {
  const n = name.toLowerCase();
  if (n.includes("acompañamiento") || n.includes("acompanamiento")) return "acompanamiento";
  if (n.includes("integral")) return "integral";
  if (n.includes("profesional")) return "profesional";
  return "other";
}

export default function PacksPage() {
  const queryClient = useQueryClient();
  const { t, lang } = useT();
  const dateLocale = lang === "en" ? enUS : es;
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) return;
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
