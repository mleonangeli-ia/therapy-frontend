"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users, ChevronRight, LogOut, Stethoscope, Loader2,
  CheckCircle, PlayCircle, Clock, AlertTriangle, FileText,
  ChevronDown, ChevronUp, MessageSquare,
} from "lucide-react";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

function therapistApi() {
  const token = localStorage.getItem("therapist_token");
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
}

interface Patient {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  isActive: boolean;
}

interface Session {
  id: string;
  sessionNumber: number;
  title?: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  modality: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  moodStart?: number;
  moodEnd?: number;
  crisisFlag: boolean;
  turnCount: number;
}

interface Message {
  id: string;
  role: "PATIENT" | "ASSISTANT";
  contentType: string;
  contentText?: string;
  sequenceNumber: number;
  createdAt: string;
}

const MOOD_EMOJI: Record<number, string> = {
  1: "😣", 2: "😟", 3: "😔", 4: "😕", 5: "😐",
  6: "🙂", 7: "😊", 8: "😄", 9: "😁", 10: "🤩",
};

function SessionMessages({ sessionId }: { sessionId: string }) {
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["therapist", "messages", sessionId],
    queryFn: () => therapistApi().get(`/therapist/portal/sessions/${sessionId}/messages`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-gray-400" /></div>;
  if (!messages?.length) return <p className="text-xs text-gray-400 py-2 text-center">Sin mensajes</p>;

  return (
    <div className="space-y-2 py-2 max-h-96 overflow-y-auto pr-1">
      {messages.map((msg) => (
        <div key={msg.id} className={clsx(
          "flex",
          msg.role === "PATIENT" ? "justify-end" : "justify-start"
        )}>
          <div className={clsx(
            "max-w-[80%] text-xs px-3 py-2 rounded-xl",
            msg.role === "PATIENT"
              ? "bg-blue-100 text-blue-900 rounded-br-sm"
              : "bg-gray-100 text-gray-800 rounded-bl-sm"
          )}>
            <p className="font-semibold mb-0.5 text-[10px] opacity-60">
              {msg.role === "PATIENT" ? "Paciente" : "Terapeuta IA"}
            </p>
            <p className="whitespace-pre-wrap">{msg.contentText}</p>
            <p className="text-[10px] opacity-40 mt-1 text-right">
              {format(new Date(msg.createdAt), "HH:mm")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = session.status === "COMPLETED";
  const isInProgress = session.status === "IN_PROGRESS";
  const moodDelta = session.moodEnd && session.moodStart ? session.moodEnd - session.moodStart : null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-emerald-700">{session.sessionNumber}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {session.title || `Sesión ${session.sessionNumber}`}
              </span>
              {session.crisisFlag && (
                <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full font-medium">
                  <AlertTriangle size={9} /> Crisis
                </span>
              )}
              <span className={clsx(
                "text-[10px] px-2 py-0.5 rounded-full font-medium",
                isCompleted ? "text-green-700 bg-green-50"
                  : isInProgress ? "text-blue-700 bg-blue-50"
                  : "text-gray-500 bg-gray-100"
              )}>
                {isCompleted ? "Completada" : isInProgress ? "En progreso" : "Abandonada"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(session.startedAt), "EEEE d 'de' MMM yyyy · HH:mm", { locale: es })}
              {session.durationSeconds && <> · {Math.round(session.durationSeconds / 60)} min</>}
              {" · "}{session.turnCount} turnos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session.moodStart && session.moodEnd && (
            <div className="flex items-center gap-1.5 text-sm">
              <span>{MOOD_EMOJI[session.moodStart]}</span>
              <span className={clsx("text-xs font-medium",
                moodDelta! > 0 ? "text-green-600" : moodDelta! < 0 ? "text-red-500" : "text-gray-400"
              )}>
                {moodDelta! > 0 ? "↑" : moodDelta! < 0 ? "↓" : "→"}
              </span>
              <span>{MOOD_EMOJI[session.moodEnd]}</span>
            </div>
          )}
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2 flex items-center gap-1.5">
            <MessageSquare size={11} /> Transcripción de la sesión
          </p>
          <SessionMessages sessionId={session.id} />
        </div>
      )}
    </div>
  );
}

function PatientDetail({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["therapist", "sessions", patient.id],
    queryFn: () => therapistApi().get(`/therapist/portal/patients/${patient.id}/sessions`).then(r => r.data),
  });

  const completed = sessions?.filter(s => s.status === "COMPLETED").length ?? 0;
  const crisisCount = sessions?.filter(s => s.crisisFlag).length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1">
          ← Volver
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-700 font-bold text-sm">
              {patient.fullName.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{patient.fullName}</h2>
            <p className="text-sm text-gray-400">{patient.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{sessions?.length ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">Sesiones totales</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{completed}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completadas</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{crisisCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Con crisis</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <FileText size={13} /> Historial de sesiones
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
        ) : sessions?.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Este paciente no tiene sesiones aún</div>
        ) : (
          <div className="space-y-2">
            {sessions?.map(s => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TherapistPortalPage() {
  const router = useRouter();
  const [therapistName, setTherapistName] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    setTherapistName(localStorage.getItem("therapist_name") ?? "Terapeuta");
  }, []);

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["therapist", "patients"],
    queryFn: () => therapistApi().get("/therapist/portal/patients").then(r => r.data),
  });

  const handleLogout = () => {
    localStorage.removeItem("therapist_token");
    localStorage.removeItem("therapist_id");
    localStorage.removeItem("therapist_name");
    router.replace("/therapist/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center">
            <Stethoscope size={13} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">TherapyAI · Portal Profesional</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Dr/a. {therapistName}</span>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50">
            <LogOut size={13} /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {selectedPatient ? (
          <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis pacientes</h1>
              <p className="text-sm text-gray-400 mt-1">
                {patients?.length ?? "—"} pacientes registrados
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-gray-300" />
              </div>
            ) : patients?.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>No hay pacientes registrados aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                {patients?.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-emerald-700">
                          {patient.fullName.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.fullName}</p>
                        <p className="text-xs text-gray-400">{patient.email}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
