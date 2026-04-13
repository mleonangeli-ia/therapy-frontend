"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import axios from "axios";
import { Session } from "@/types";
import { useSession, ChatMessage, MessageRole } from "@/hooks/useSession";
import { ChatBubble } from "@/components/session/ChatBubble";
import { ChatInput } from "@/components/session/ChatInput";
import { AudioRecorder } from "@/components/session/AudioRecorder";
import { CrisisAlert } from "@/components/session/CrisisAlert";
import { MoodSelector } from "@/components/session/MoodSelector";
import { useT } from "@/lib/i18n";
import {
  Wifi, WifiOff, AlertTriangle, X, CheckCircle, Loader2, Clock,
} from "lucide-react";
import clsx from "clsx";

const SESSION_DURATION = 45 * 60;

// startedAt: ISO string from the session — elapsed is computed from it so the
// timer resumes correctly when re-entering an in-progress session.
function useSessionTimer(active: boolean, startedAt?: string) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (!startedAt) return;
    const origin = new Date(startedAt).getTime();
    const secs = Math.floor((Date.now() - origin) / 1000);
    setElapsed(secs);
    rafRef.current = requestAnimationFrame(tick);
  }, [startedAt]);

  useEffect(() => {
    if (active && startedAt) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, startedAt, tick]);

  const remaining = Math.max(SESSION_DURATION - elapsed, 0);
  const overtime = elapsed > SESSION_DURATION;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return {
    remaining,
    elapsed,
    overtime,
    display: overtime ? "00:00" : fmt(remaining),
    pct: Math.min(elapsed / SESSION_DURATION, 1),
  };
}

interface Props { params: Promise<{ id: string }> }

export default function ActiveSessionPage({ params }: Props) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const { t, lang } = useT();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [moodEnd, setMoodEnd] = useState<number | undefined>();

  const { data: sessionData } = useQuery<Session>({
    queryKey: ["sessions", sessionId],
    queryFn: () => api.get(`/sessions/${sessionId}`).then((r) => r.data),
  });

  const {
    messages,
    status,
    crisisData,
    error,
    sendMessage,
    isProcessing,
    isConnected,
  } = useSession(sessionId);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Historical messages from DB, converted to ChatMessage format
  const historicalMessages: ChatMessage[] = (sessionData?.messages ?? [])
    .filter((m: { role: string }) => m.role !== "SYSTEM")
    .map((m: { id: string; role: string; contentText?: string; createdAt: string }) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.contentText ?? "",
      createdAt: new Date(m.createdAt),
    }));

  // Merge: historical first, then live WebSocket messages (dedup by id)
  const liveIds = new Set(messages.map((m) => m.id));
  const allMessages: ChatMessage[] = [
    ...historicalMessages.filter((m) => !liveIds.has(m.id)),
    ...messages,
  ];

  const timerActive = mounted && (status === "CONNECTED" || status === "READY" || status === "PROCESSING" || status === "CRISIS_DETECTED");
  const timer = useSessionTimer(timerActive, sessionData?.startedAt);

  // Auto-open end modal when time is up (forced — can't dismiss)
  const [timeForced, setTimeForced] = useState(false);
  useEffect(() => {
    if (timer.overtime && !timeForced) {
      setTimeForced(true);
      setShowEndModal(true);
    }
  }, [timer.overtime, timeForced]);

  const [endError, setEndError] = useState<string | null>(null);

  const endSession = useMutation({
    mutationFn: () =>
      api.patch(`/sessions/${sessionId}/end`, { moodEnd }).then((r) => r.data),
    onSuccess: () => {
      router.push(`/dashboard/sessions`);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) return;
      setEndError(lang === "en"
        ? "Could not end the session. Please try again."
        : "No se pudo finalizar la sesión. Intentá de nuevo.");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (sessionData?.status === "COMPLETED") {
      router.replace("/dashboard/sessions");
    }
  }, [sessionData, router]);

  const statusBadge = {
    CONNECTING:      { label: t.sessionChat.connecting,   icon: Loader2,        color: "text-yellow-600", spin: true },
    CONNECTED:       { label: t.sessionChat.ready,        icon: Wifi,           color: "text-emerald-600", spin: false },
    READY:           { label: t.sessionChat.ready,        icon: Wifi,           color: "text-emerald-600", spin: false },
    PROCESSING:      { label: "...",                      icon: Loader2,        color: "text-brand-600", spin: true },
    CRISIS_DETECTED: { label: "Atención",                 icon: AlertTriangle,  color: "text-red-600", spin: false },
    ERROR:           { label: "Error",                    icon: WifiOff,        color: "text-red-500", spin: false },
    DISCONNECTED:    { label: "Desconectado",             icon: WifiOff,        color: "text-gray-400", spin: false },
  }[status];

  return (
    <div className="flex flex-col fixed inset-x-0 top-topbar bottom-bottomnav bg-surface-subtle lg:static lg:h-[calc(100vh-4rem)] lg:-m-8">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14 bg-surface border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-xs">
              {sessionData?.sessionNumber ?? "·"}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-ink leading-tight">
                {t.sessions.session} {sessionData?.sessionNumber ?? "..."} {t.newSession.sessionOf} {sessionData ? "10" : "..."}
              </h1>
              <div className={clsx("flex items-center gap-1.5 text-xs", statusBadge.color)}>
                <statusBadge.icon size={11} className={statusBadge.spin ? "animate-spin" : ""} />
                {statusBadge.label}
              </div>
            </div>
          </div>

          {timerActive && (
            <div className="flex flex-col items-center gap-0.5">
              <div className={clsx(
                "flex items-center gap-1 text-base lg:text-lg font-mono font-semibold tabular-nums transition-colors",
                timer.overtime
                  ? "text-red-500"
                  : timer.remaining <= 5 * 60
                  ? "text-red-500"
                  : timer.remaining <= 10 * 60
                  ? "text-amber-500"
                  : "text-ink"
              )}>
                <Clock size={13} className={timer.remaining <= 5 * 60 ? "animate-pulse" : ""} />
                {timer.display}
              </div>
              <div className="w-16 lg:w-24 h-0.5 rounded-full bg-line overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    timer.overtime ? "bg-red-500"
                      : timer.remaining <= 5 * 60 ? "bg-red-400"
                      : timer.remaining <= 10 * 60 ? "bg-amber-400"
                      : "bg-brand-500"
                  )}
                  style={{ width: `${(1 - timer.pct) * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => setShowEndModal(true)}
            className="btn btn-secondary btn-sm gap-1.5"
          >
            <CheckCircle size={14} />
            {t.sessionChat.finalize}
          </button>
        </div>

        {timer.overtime && (
          <div className="flex items-center justify-center gap-2 bg-red-50 border-b border-red-200 px-4 py-1.5 text-xs text-red-700 font-medium">
            <AlertTriangle size={13} />
            {lang === "en"
              ? "Session time is up — you can finalize whenever you're ready"
              : "El tiempo de la sesión terminó — cuando quieras podés finalizarla"}
          </div>
        )}
        {!timer.overtime && timer.remaining <= 5 * 60 && timerActive && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-700 font-medium">
            <Clock size={13} />
            {lang === "en"
              ? "Less than 5 minutes left — you can start wrapping up"
              : "Quedan menos de 5 minutos — podés ir cerrando la sesión"}
          </div>
        )}
      </div>

      {crisisData && (
        <CrisisAlert
          message={crisisData.message}
          resources={crisisData.crisisResources}
        />
      )}

      {error && (
        <div className="mx-4 mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex items-center gap-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-5 space-y-3 bg-surface-subtle">
        {allMessages.length === 0 && isConnected && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-sm font-medium text-ink mb-1">{t.sessionChat.ready}</p>
            <p className="text-xs text-ink-tertiary max-w-xs">
              {t.sessionChat.inputPlaceholder}
            </p>
          </div>
        )}
        {allMessages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 lg:px-6 py-3 bg-surface border-t border-line flex-shrink-0">
        {sessionData?.modality !== "TEXT" ? (
          <div className="flex items-center gap-3">
            <AudioRecorder
              sessionId={sessionId}
              onTranscription={(text) => sendMessage(text)}
              disabled={!isConnected || status === "CRISIS_DETECTED" || isProcessing}
            />
            <span className="text-xs text-gray-300">{lang === "en" ? "or write:" : "o escribe:"}</span>
            <div className="flex-1">
              <ChatInput
                onSend={sendMessage}
                disabled={!isConnected || status === "CRISIS_DETECTED"}
                isProcessing={isProcessing}
                placeholder={status === "CRISIS_DETECTED" ? undefined : t.sessionChat.inputPlaceholder}
              />
            </div>
          </div>
        ) : (
          <ChatInput
            onSend={sendMessage}
            disabled={!isConnected || status === "CRISIS_DETECTED"}
            isProcessing={isProcessing}
            placeholder={status === "CRISIS_DETECTED" ? undefined : t.sessionChat.inputPlaceholder}
          />
        )}
      </div>

      {showEndModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-line p-6 max-w-sm w-full shadow-card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-ink">{t.sessionChat.finalize}</h2>
              {!timeForced && (
                <button onClick={() => setShowEndModal(false)} className="text-ink-disabled hover:text-ink-tertiary">
                  <X size={20} />
                </button>
              )}
            </div>

            {timeForced && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-1.5">
                <Clock size={12} />
                {lang === "en"
                  ? "Session time has ended. Please select your mood to finalize."
                  : "El tiempo de la sesión terminó. Seleccioná tu estado de ánimo para finalizar."}
              </p>
            )}

            <MoodSelector
              value={moodEnd}
              onChange={setMoodEnd}
              label={lang === "en" ? "How are you feeling at the end of this session?" : "¿Cómo te sentís al finalizar esta sesión?"}
            />

            {endError && (
              <p className="text-xs text-red-500 mt-3">{endError}</p>
            )}

            <div className="flex gap-2 mt-5">
              {!timeForced && (
                <button onClick={() => setShowEndModal(false)} className="btn-secondary flex-1">
                  {t.common.cancel}
                </button>
              )}
              <button
                onClick={() => endSession.mutate()}
                disabled={!moodEnd || endSession.isPending}
                className="btn-primary flex-1"
              >
                {endSession.isPending ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : t.sessionChat.finalize}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
