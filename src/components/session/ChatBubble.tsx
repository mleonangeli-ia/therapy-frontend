import { ChatMessage } from "@/hooks/useSession";
import { AudioPlayer } from "@/components/session/AudioPlayer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import clsx from "clsx";

interface Props { message: ChatMessage }

export function ChatBubble({ message }: Props) {
  const isPatient = message.role === "PATIENT";

  return (
    <div className={clsx("flex gap-2 animate-fade-in", isPatient ? "justify-end" : "justify-start")}>
      {/* AI avatar */}
      {!isPatient && (
        <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
      )}

      <div className={clsx("max-w-[72%] space-y-1", isPatient ? "items-end flex flex-col" : "")}>
        <div className={clsx(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isPatient
            ? "bg-brand-600 text-white rounded-br-sm"
            : "bg-surface border border-line text-ink rounded-bl-sm shadow-xs"
        )}>
          {message.content.split("\n").map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
          {message.isStreaming && (
            <span className="inline-block w-1 h-3.5 bg-current opacity-60 ml-0.5 animate-pulse rounded-sm align-middle" />
          )}
        </div>

        {!isPatient && message.audioUrl && (
          <AudioPlayer audioUrl={message.audioUrl} autoPlay />
        )}

        <p className="text-2xs text-ink-disabled px-0.5">
          {format(message.createdAt, "HH:mm", { locale: es })}
        </p>
      </div>

      {isPatient && <div className="w-6 flex-shrink-0" />}
    </div>
  );
}
