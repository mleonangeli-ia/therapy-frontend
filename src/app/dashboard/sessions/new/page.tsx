"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Pack, Session } from "@/types";
import { MoodSelector } from "@/components/session/MoodSelector";
import { MessageCircle, Mic, Blend, ArrowRight, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import clsx from "clsx";

type Modality = "TEXT" | "AUDIO" | "MIXED";

export default function NewSessionPage() {
  const router = useRouter();
  const { t } = useT();
  const [modality, setModality] = useState<Modality>("TEXT");
  const [moodStart, setMoodStart] = useState<number | undefined>();

  const MODALITIES: { id: Modality; icon: React.ElementType; title: string; desc: string }[] = [
    { id: "TEXT",  icon: MessageCircle, title: t.newSession.modalityText,  desc: t.newSession.modalityTextDesc },
    { id: "AUDIO", icon: Mic,           title: t.newSession.modalityAudio, desc: t.newSession.modalityAudioDesc },
    { id: "MIXED", icon: Blend,         title: t.newSession.modalityMixed, desc: t.newSession.modalityMixedDesc },
  ];

  const { data: activePack } = useQuery<Pack>({
    queryKey: ["packs", "active"],
    queryFn: () => api.get("/packs/active").then((r) => r.data),
    retry: false,
  });

  // Redirect to active session if one already exists
  const { data: activeSession } = useQuery<Session | null>({
    queryKey: ["sessions", "active"],
    queryFn: () =>
      api.get("/sessions/active").then((r) => r.data).catch((e) => {
        if (e?.response?.status === 204 || e?.response?.status === 404) return null;
        throw e;
      }),
    retry: false,
  });

  useEffect(() => {
    if (activeSession?.id) {
      router.replace(`/dashboard/sessions/${activeSession.id}`);
    }
  }, [activeSession, router]);

  const startSession = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>("/sessions", { packId: activePack?.id, modality, moodStart }).then((r) => r.data),
    onSuccess: (data) => {
      router.push(`/dashboard/sessions/${data.id}`);
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        // Refetch active session and redirect
        router.push("/dashboard/sessions/new");
      }
    },
  });

  if (!activePack) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-ink-tertiary mb-4">{t.newSession.noPack}</p>
        <button onClick={() => router.push("/dashboard/packs")} className="btn-primary">
          {t.newSession.buyPack}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-7 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t.newSession.title}</h1>
        <p className="text-ink-tertiary mt-1 text-sm">
          {t.sessions.session} {activePack.sessionsUsed + 1} {t.newSession.sessionOf} {activePack.sessionsTotal} ·{" "}
          {activePack.sessionsRemaining - 1} {t.newSession.afterThis}
        </p>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">
          {t.newSession.howCommunicate}
        </h2>
        <div className="grid gap-2.5">
          {MODALITIES.map(({ id, icon: Icon, title, desc }) => (
            <button
              key={id}
              onClick={() => setModality(id)}
              className={clsx(
                "text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-150",
                modality === id
                  ? "border-brand-400 bg-brand-50 shadow-sm"
                  : "border-line bg-surface hover:border-line hover:bg-surface-subtle"
              )}
            >
              <div className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150",
                modality === id ? "bg-brand-600 text-white shadow-sm" : "bg-surface-muted text-ink-disabled"
              )}>
                <Icon size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx("font-semibold text-sm", modality === id ? "text-brand-800" : "text-ink")}>
                  {title}
                </p>
                <p className="text-xs text-ink-tertiary mt-0.5 leading-relaxed">{desc}</p>
              </div>
              {modality === id && (
                <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <MoodSelector value={moodStart} onChange={setMoodStart} label={t.newSession.moodLabel} />
      </div>

      <button
        onClick={() => startSession.mutate()}
        disabled={startSession.isPending || !moodStart}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base disabled:shadow-none"
      >
        {startSession.isPending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>{t.newSession.start}<ArrowRight size={18} /></>
        )}
      </button>

      {!moodStart && (
        <p className="text-center text-xs text-ink-disabled -mt-4">{t.newSession.selectMood}</p>
      )}
    </div>
  );
}
