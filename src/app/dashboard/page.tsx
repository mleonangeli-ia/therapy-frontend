"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Pack, Session } from "@/types";
import { getPatientName } from "@/lib/auth";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Plus, ArrowRight, CheckCircle, Clock, PlayCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="card">
      <p className="text-2xs text-ink-disabled uppercase tracking-widest font-semibold mb-2">{label}</p>
      <p className="text-2xl font-bold text-ink tabular-nums">{value}</p>
      {sub && <p className="text-xs text-ink-disabled mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { t, lang } = useT();
  const locale = lang === "en" ? enUS : es;
  const [firstName, setFirstName] = useState("");
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const name = getPatientName() ?? t.nav.patient;
    setFirstName(name.split(" ")[0]);
    setToday(new Date());
  }, [t.nav.patient]);

  const { data: pack } = useQuery<Pack>({
    queryKey: ["packs", "active"],
    queryFn: () => api.get("/packs/active").then((r) => r.data),
    retry: false,
  });

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ["sessions", "recent"],
    queryFn: () => api.get("/sessions?limit=5").then((r) => r.data),
    enabled: !!pack,
  });

  const inProgress = sessions?.find((s) => s.status === "IN_PROGRESS");
  const pct = pack ? Math.round((pack.sessionsUsed / pack.sessionsTotal) * 100) : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{t.dashboard.greeting}, {firstName}</h1>
          <p className="text-xs text-ink-tertiary mt-0.5 capitalize">
            {today ? format(today, "EEEE d 'de' MMMM", { locale }) : ""}
          </p>
        </div>
        {pack && (
          inProgress ? (
            <Link href={`/dashboard/sessions/${inProgress.id}`} className="btn-primary flex-shrink-0">
              <PlayCircle size={14} />
              <span className="hidden sm:inline">{t.sessions.resume}</span>
            </Link>
          ) : (
            <Link href="/dashboard/sessions/new" className="btn-primary flex-shrink-0">
              <Plus size={14} />
              <span className="hidden sm:inline">{t.dashboard.newSession}</span>
            </Link>
          )
        )}
      </div>

      {pack ? (
        <div className="card overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="section-heading mb-1">{t.dashboard.activePlan}</p>
              <p className="font-semibold text-ink">{pack.packType.name}</p>
              <p className="text-xs text-ink-tertiary mt-0.5">
                {t.dashboard.expires}{" "}
                {pack.expiresAt
                  ? format(new Date(pack.expiresAt), "d MMM yyyy", { locale })
                  : t.dashboard.noExpiry}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-ink tabular-nums">{pack.sessionsUsed}</span>
              <span className="text-sm text-ink-disabled">/{pack.sessionsTotal}</span>
              <p className="text-2xs text-ink-disabled mt-0.5">{t.dashboard.sessionsUsed}</p>
            </div>
          </div>
          <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
            <div className="h-full bg-brand-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xs text-ink-disabled">{pct}% {t.dashboard.completed}</p>
            <p className="text-2xs text-ink-disabled">
              {pack.sessionsRemaining} {pack.sessionsRemaining !== 1 ? t.dashboard.available_plural : t.dashboard.available}
            </p>
          </div>
        </div>
      ) : (
        <div className="card text-center py-10 border-dashed">
          <p className="text-sm font-medium text-ink mb-1">{t.dashboard.noPlan}</p>
          <p className="text-xs text-ink-tertiary mb-4">{t.dashboard.noPlanDesc}</p>
          <Link href="/dashboard/packs" className="btn-primary btn-sm">
            {t.dashboard.viewPlans} <ArrowRight size={12} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 lg:gap-3 delay-1 animate-slide-up">
        <StatCard label={t.dashboard.statCompleted} value={pack?.sessionsUsed ?? 0} />
        <StatCard label={t.dashboard.statAvailable} value={pack?.sessionsRemaining ?? 0} />
        <StatCard label={t.dashboard.statReports}   value={pack?.sessionsUsed ?? 0} />
      </div>

      {sessions && sessions.length > 0 && (
        <div className="delay-2 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">{t.dashboard.recentSessions}</h2>
            <Link href="/dashboard/sessions" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              {t.dashboard.viewAll} <ArrowRight size={11} />
            </Link>
          </div>
          <div className="card p-0 overflow-hidden divide-y divide-line">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface-subtle transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-semibold">
                    {s.sessionNumber}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{t.dashboard.session} {s.sessionNumber}</p>
                    <p className="text-xs text-ink-tertiary">
                      {format(new Date(s.startedAt), "d MMM yyyy", { locale })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.moodEnd && <span className="badge-blue">{s.moodEnd}/10</span>}
                  {s.status === "COMPLETED"
                    ? <span className="badge-green"><CheckCircle size={9} />{t.sessions.statusCompleted}</span>
                    : <span className="badge-yellow"><Clock size={9} />{t.sessions.statusInProgress}</span>}
                  {s.status === "IN_PROGRESS" ? (
                    <Link href={`/dashboard/sessions/${s.id}`}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium ml-1 flex items-center gap-1">
                      <PlayCircle size={12} />
                      {t.sessions.continue}
                    </Link>
                  ) : (
                    <Link href={`/dashboard/reports?session=${s.id}`}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium ml-1">
                      {t.dashboard.report}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
