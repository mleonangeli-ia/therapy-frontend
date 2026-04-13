"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Session } from "@/types";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { PlayCircle, CheckCircle, Clock, FileText, Plus, Loader2, Pencil, Check, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export default function SessionsPage() {
  const { t, lang } = useT();
  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: () => api.get("/sessions").then((r) => r.data),
  });

  const inProgress = sessions?.find((s) => s.status === "IN_PROGRESS");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink">{t.sessions.title}</h1>
          <p className="text-ink-tertiary mt-1 text-sm">{t.sessions.subtitle}</p>
        </div>
        {inProgress ? (
          <Link href={`/dashboard/sessions/${inProgress.id}`} className="btn-primary flex items-center gap-2 flex-shrink-0">
            <PlayCircle size={16} />
            <span className="hidden sm:inline">{t.sessions.resume}</span>
          </Link>
        ) : (
          <Link href="/dashboard/sessions/new" className="btn-primary flex items-center gap-2 flex-shrink-0">
            <Plus size={16} />
            <span className="hidden sm:inline">{t.sessions.newSession}</span>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-ink-disabled" />
        </div>
      ) : sessions?.length === 0 ? (
        <div className="card text-center py-16">
          <PlayCircle size={48} className="mx-auto text-ink-disabled mb-4" />
          <h3 className="font-semibold text-ink mb-2">{t.sessions.empty}</h3>
          <p className="text-ink-tertiary text-sm mb-6">{t.sessions.emptyDesc}</p>
          <Link href="/dashboard/sessions/new" className="btn-primary inline-block">
            {t.sessions.startFirst}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions?.map((session) => (
            <SessionCard key={session.id} session={session} lang={lang} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, lang, t }: { session: Session; lang: string; t: ReturnType<typeof useT>["t"] }) {
  const locale = lang === "en" ? enUS : es;
  const isCompleted = session.status === "COMPLETED";
  const isInProgress = session.status === "IN_PROGRESS";
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(session.title ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const saveTitle = async () => {
    if (titleInput === (session.title ?? "")) { setEditing(false); return; }
    setSaving(true);
    try {
      await api.patch(`/sessions/${session.id}/title`, { title: titleInput || null });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const cancelEdit = () => {
    setTitleInput(session.title ?? "");
    setEditing(false);
  };

  const StatusIcon = isCompleted ? CheckCircle : isInProgress ? PlayCircle : Clock;
  const statusLabel = isCompleted
    ? t.sessions.statusCompleted
    : isInProgress
    ? t.sessions.statusInProgress
    : t.sessions.statusAbandoned;
  const statusColor = isCompleted
    ? "text-green-600 bg-green-50"
    : isInProgress
    ? "text-brand-600 bg-brand-50"
    : "text-ink-tertiary bg-surface-muted";

  const moodDelta =
    session.moodEnd && session.moodStart ? session.moodEnd - session.moodStart : null;

  const MOOD_EMOJI: Record<number, string> = {
    1: "😣", 2: "😟", 3: "😔", 4: "😕", 5: "😐",
    6: "🙂", 7: "😊", 8: "😄", 9: "😁", 10: "🤩",
  };

  return (
    <div className="card border transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="font-bold text-brand-600">{session.sessionNumber}</span>
        </div>
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            {editing ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  ref={inputRef}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value.slice(0, 30))}
                  onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") cancelEdit(); }}
                  className="text-sm font-medium text-black border border-brand-400 rounded-lg px-2 py-0.5 w-full max-w-[14rem] focus:outline-none focus:ring-2 focus:ring-brand-300"
                  placeholder={`${t.sessions.session} ${session.sessionNumber}`}
                  maxLength={30}
                />
                <button onClick={saveTitle} disabled={saving} className="text-green-600 hover:text-green-700 flex-shrink-0">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={cancelEdit} className="text-ink-disabled hover:text-ink-tertiary flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 group min-w-0">
                <p className="font-medium text-ink truncate">
                  {session.title || `${t.sessions.session} ${session.sessionNumber}`}
                </p>
                <Pencil size={12} className="text-ink-disabled opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            )}
            <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 flex-shrink-0", statusColor)}>
              <StatusIcon size={11} />
              {statusLabel}
            </span>
          </div>

          {/* Date row */}
          <p className="text-xs text-ink-tertiary">
            {format(new Date(session.startedAt), "d MMM yyyy · HH:mm", { locale })}
            {session.durationSeconds && (
              <> · {Math.round(session.durationSeconds / 60)} {t.sessions.min}</>
            )}
          </p>

          {/* Mood + action */}
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            {session.moodStart && session.moodEnd ? (
              <div className="flex items-center gap-1.5 text-sm">
                <span title={`Inicio: ${session.moodStart}`}>{MOOD_EMOJI[session.moodStart]}</span>
                <span className={clsx("text-xs font-medium",
                  moodDelta! > 0 ? "text-green-600"
                  : moodDelta! < 0 ? "text-red-500"
                  : "text-ink-disabled"
                )}>
                  {moodDelta! > 0 ? "↑" : moodDelta! < 0 ? "↓" : "→"}
                </span>
                <span title={`Fin: ${session.moodEnd}`}>{MOOD_EMOJI[session.moodEnd]}</span>
              </div>
            ) : <div />}

            {isInProgress ? (
              <Link href={`/dashboard/sessions/${session.id}`}
                className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1">
                <PlayCircle size={14} />
                {t.sessions.continue}
              </Link>
            ) : isCompleted ? (
              <Link href={`/dashboard/reports?session=${session.id}`}
                className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
                <FileText size={14} />
                {t.sessions.report}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
