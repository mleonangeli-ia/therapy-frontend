"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export type MessageRole = "PATIENT" | "ASSISTANT";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
  audioUrl?: string; // TTS response URL for ASSISTANT messages in AUDIO/MIXED sessions
}

export type SessionStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "PROCESSING"
  | "READY"
  | "CRISIS_DETECTED"
  | "ERROR"
  | "DISCONNECTED";

interface CrisisPayload {
  message: string;
  crisisResources: string[];
}

export function useSession(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SessionStatus>("DISCONNECTED");
  const [crisisData, setCrisisData] = useState<CrisisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const streamingMsgRef = useRef<string | null>(null); // id of the streaming message

  const connect = useCallback(() => {
    if (!sessionId) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setStatus("CONNECTING");

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setStatus("READY");

        client.subscribe(`/topic/session/${sessionId}`, (frame) => {
          const payload = JSON.parse(frame.body);
          handleServerEvent(payload);
        });
      },
      onDisconnect: () => setStatus("DISCONNECTED"),
      onStompError: (frame) => {
        console.error("STOMP error", frame);
        setStatus("ERROR");
        setError("Error de conexión con el servidor");
      },
    });

    client.activate();
    clientRef.current = client;
  }, [sessionId]);

  const handleServerEvent = useCallback((payload: Record<string, unknown>) => {
    const type = payload.type as string;

    if (type === "STREAM_CHUNK") {
      const msgId = payload.messageId as string;
      const token = payload.token as string;
      const isFinal = payload.isFinal as boolean;

      if (streamingMsgRef.current !== msgId) {
        // New streaming message — create a placeholder
        streamingMsgRef.current = msgId;
        setMessages((prev) => [
          ...prev,
          {
            id: msgId,
            role: "ASSISTANT",
            content: token,
            createdAt: new Date(),
            isStreaming: true,
          },
        ]);
      } else {
        // Append token to existing streaming message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, content: m.content + token, isStreaming: !isFinal }
              : m
          )
        );
      }

      if (isFinal) {
        streamingMsgRef.current = null;
      }
    } else if (type === "AUDIO_RESPONSE") {
      // Attach TTS audio URL to the matching ASSISTANT message
      const msgId = payload.messageId as string;
      const audioUrl = payload.audioUrl as string;
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, audioUrl } : m))
      );
    } else if (type === "STATUS") {
      setStatus(payload.status as SessionStatus);
    } else if (type === "CRISIS_DETECTED") {
      setStatus("CRISIS_DETECTED");
      setCrisisData({
        message: payload.message as string,
        crisisResources: payload.crisisResources as string[],
      });
    } else if (type === "ERROR") {
      setError(payload.message as string);
      setStatus("READY");
    }
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!clientRef.current?.connected || !sessionId) return;
      if (status === "PROCESSING") return;

      // Optimistically add patient message
      const tempId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: "PATIENT",
          content,
          createdAt: new Date(),
        },
      ]);
      setError(null);

      clientRef.current.publish({
        destination: `/app/session/${sessionId}/message`,
        body: JSON.stringify({ content }),
      });
    },
    [sessionId, status]
  );

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
    setStatus("DISCONNECTED");
  }, []);

  useEffect(() => {
    if (sessionId) connect();
    return () => { clientRef.current?.deactivate(); };
  }, [sessionId, connect]);

  return {
    messages,
    status,
    crisisData,
    error,
    sendMessage,
    disconnect,
    isConnected: status !== "DISCONNECTED" && status !== "CONNECTING" && status !== "ERROR",
    isProcessing: status === "PROCESSING",
  };
}
