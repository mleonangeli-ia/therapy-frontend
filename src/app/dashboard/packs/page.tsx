"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import axios from "axios";
import { Pack, PackType } from "@/types";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Check, Loader2, FlaskConical, ShoppingCart, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";

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

  const statusLabel: Record<Pack["status"], string> = {
    PENDING_PAYMENT: t.packs.statusPending,
    ACTIVE:          t.packs.statusActive,
    COMPLETED:       t.packs.statusCompleted,
    EXPIRED:         t.packs.statusExpired,
    REFUNDED:        t.packs.statusRefunded,
    CANCELLED:       t.packs.statusCancelled,
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">{t.packs.title}</h1>
        <p className="text-ink-tertiary mt-1">{t.packs.subtitle}</p>
      </div>

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
      {activePack && (
        <div className="card border-brand-200 bg-brand-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="badge badge-blue">{t.packs.activePack}</span>
              <h2 className="section-heading mt-2">{activePack.packType.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-brand-600">
                {activePack.sessionsRemaining}
              </p>
              <p className="text-xs text-ink-tertiary">{t.packs.sessionsRemaining}</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(activePack.sessionsUsed / activePack.sessionsTotal) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-ink-tertiary">
            <span>{activePack.sessionsUsed} {t.packs.sessionsUsed}</span>
            <span>
              {t.packs.expires}{" "}
              {activePack.expiresAt
                ? format(new Date(activePack.expiresAt), "d MMM yyyy", { locale: dateLocale })
                : "-"}
            </span>
          </div>
        </div>
      )}

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
            {packTypes?.map((pt) => (
              <div key={pt.id} className="card hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink">{pt.name}</h3>
                    <p className="text-sm text-ink-tertiary mt-0.5">{pt.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                      {[
                        `${pt.sessionCount} ${t.packs.sessions}`,
                        `${pt.validityDays} ${t.packs.validityDays}`,
                        t.packs.reportPerSession,
                      ].map((feat) => (
                        <span key={feat} className="flex items-center gap-1 text-xs text-ink-secondary">
                          <Check size={12} className="text-emerald-500" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-ink">
                      ${pt.priceAmount.toLocaleString("es-AR")}
                    </p>
                    <p className="text-xs text-ink-disabled">{pt.priceCurrency}</p>
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
            ))}
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
