"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import clsx from "clsx";

interface Props {
  sessionId: string;
  onTranscription: (text: string, messageId: string) => void;
  disabled?: boolean;
}

type RecorderState = "idle" | "recording" | "uploading" | "error";

const SILENCE_THRESHOLD_MS = 3000; // stop after 3s of silence
const MIN_RECORDING_MS = 1500;     // grace period before silence detection kicks in
const MAX_RECORDING_MS = 60_000;   // hard cap at 60s

export function AudioRecorder({ sessionId, onTranscription, disabled }: Props) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setSeconds(0);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const stopAndUpload = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      cleanup();

      if (blob.size < 1000) {
        setState("error");
        setError("Audio muy corto. Mantené presionado y hablá.");
        setTimeout(() => { setState("idle"); setError(null); }, 3000);
        return;
      }

      setState("uploading");
      try {
        const form = new FormData();
        form.append("file", blob, "recording.webm");
        form.append("sessionId", sessionId);

        const { data } = await api.post<{ messageId: string; transcription: string }>(
          `/audio/upload?sessionId=${sessionId}`,
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        setState("idle");
        setError(null);
        if (data.transcription?.trim()) {
          onTranscription(data.transcription, data.messageId);
        }
      } catch (err) {
        console.error("Audio upload failed", err);
        setState("error");
        setError("No se pudo procesar el audio. Intentá de nuevo.");
      }
    };

    recorder.stop();
  }, [cleanup, onTranscription, sessionId]);

  const startRecording = useCallback(async () => {
    if (disabled || state !== "idle") return;
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // VAD setup with Web Audio API
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastSoundTime = Date.now();
      const recordingStartTime = Date.now();

      const checkSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avg > 10) lastSoundTime = Date.now();

        // Don't trigger silence-stop during the initial grace period
        const elapsed = Date.now() - recordingStartTime;
        if (elapsed > MIN_RECORDING_MS && Date.now() - lastSoundTime > SILENCE_THRESHOLD_MS) {
          stopAndUpload();
          return;
        }
        animFrameRef.current = requestAnimationFrame(checkSilence);
      };
      animFrameRef.current = requestAnimationFrame(checkSilence);

      // Choose supported mimeType
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(200); // collect chunks every 200ms
      setState("recording");

      // Duration counter
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

      // Hard cap
      silenceTimerRef.current = setTimeout(stopAndUpload, MAX_RECORDING_MS);
    } catch (err) {
      console.error("Microphone access error", err);
      setState("error");
      setError("No se pudo acceder al micrófono");
    }
  }, [disabled, state, stopAndUpload]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3">
      {state === "idle" && (
        <button
          onClick={startRecording}
          disabled={disabled}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-brand-600 hover:bg-brand-700 text-white active:scale-95"
          )}
        >
          <Mic size={16} />
          Hablar
        </button>
      )}

      {state === "recording" && (
        <button
          onClick={stopAndUpload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95"
        >
          <span className="w-3 h-3 rounded-sm bg-white animate-pulse" />
          <span>{formatTime(seconds)}</span>
          <Square size={14} />
        </button>
      )}

      {state === "uploading" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-500 text-sm">
          <Loader2 size={15} className="animate-spin" />
          Procesando audio...
        </div>
      )}

      {state === "error" && error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle size={15} />
          {error}
          <button
            onClick={() => { setState("idle"); setError(null); }}
            className="underline text-xs ml-1"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
