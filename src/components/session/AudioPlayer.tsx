"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  audioUrl: string;
  autoPlay?: boolean;
  className?: string;
}

type PlayerState = "loading" | "playing" | "paused" | "ended" | "error";

export function AudioPlayer({ audioUrl, autoPlay = true, className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>("loading");
  const [progress, setProgress] = useState(0); // 0-100

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setState("loading");

    audio.oncanplaythrough = () => {
      setState("paused");
      if (autoPlay) audio.play().catch(() => setState("paused"));
    };
    audio.onplay = () => setState("playing");
    audio.onpause = () => setState("paused");
    audio.onended = () => { setState("ended"); setProgress(100); };
    audio.onerror = () => setState("error");
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };

    audio.load();

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl, autoPlay]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state === "playing") {
      audio.pause();
    } else {
      if (state === "ended") audio.currentTime = 0;
      audio.play().catch(console.error);
    }
  };

  if (state === "error") return null; // silently skip if audio fails

  return (
    <div className={clsx("flex items-center gap-2 mt-1", className)}>
      <button
        onClick={toggle}
        disabled={state === "loading"}
        className="w-7 h-7 rounded-full bg-primary-100 hover:bg-primary-200 flex items-center justify-center transition-colors flex-shrink-0"
      >
        {state === "loading" ? (
          <Loader2 size={13} className="animate-spin text-primary-600" />
        ) : state === "playing" ? (
          <VolumeX size={13} className="text-primary-600" />
        ) : (
          <Volume2 size={13} className="text-primary-600" />
        )}
      </button>

      {/* Progress bar */}
      <div className="flex-1 h-1.5 bg-primary-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-400 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
