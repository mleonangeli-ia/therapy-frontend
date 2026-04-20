"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users, ChevronRight, LogOut, Stethoscope, Loader2,
  CheckCircle, PlayCircle, Clock, AlertTriangle, FileText,
  ChevronDown, ChevronUp, MessageSquare, BarChart3, TrendingUp,
  MessageCircle, ShieldAlert, Globe, Activity, ClipboardList,
  CalendarDays, CalendarCheck, X as XIcon,
} from "lucide-react";
import clsx from "clsx";

function therapistApi() {
  const token = localStorage.getItem("therapist_token");
  return axios.create({
    baseURL: "/api",
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

interface PlatformStats {
  totalPatients: number;
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  abandonedSessions: number;
  crisisSessions: number;
  avgDurationSeconds: number | null;
  avgMoodStart: number | null;
  avgMoodEnd: number | null;
  totalTurns: number;
}

function StatCard({ label, value, sub, color = "gray", icon: Icon }: {
  label: string; value: string | number; sub?: string;
  color?: "gray" | "green" | "blue" | "red" | "amber" | "purple";
  icon: React.ElementType;
}) {
  const colors = {
    gray:   "bg-gray-50   text-gray-700   border-gray-100",
    green:  "bg-green-50  text-green-700  border-green-100",
    blue:   "bg-blue-50   text-blue-700   border-blue-100",
    red:    "bg-red-50    text-red-700    border-red-100",
    amber:  "bg-amber-50  text-amber-700  border-amber-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium opacity-70">{label}</p>
        <Icon size={14} className="opacity-50" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatsPanel() {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ["therapist", "stats"],
    queryFn: () => therapistApi().get("/therapist/portal/stats").then(r => r.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex justify-center">
      <Loader2 size={20} className="animate-spin text-gray-300" />
    </div>
  );
  if (!stats) return null;

  const avgDurMin = stats.avgDurationSeconds ? Math.round(stats.avgDurationSeconds / 60) : null;
  const moodDelta = stats.avgMoodStart && stats.avgMoodEnd
    ? (stats.avgMoodEnd - stats.avgMoodStart).toFixed(1)
    : null;
  const completionRate = stats.totalSessions > 0
    ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={15} className="text-emerald-600" />
        <h2 className="text-sm font-semibold text-gray-800">Tablero de uso</h2>
        <span className="ml-auto text-xs text-gray-400">actualiza cada 30s</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pacientes" value={stats.totalPatients} icon={Users} color="blue" />
        <StatCard label="Sesiones totales" value={stats.totalSessions} icon={MessageCircle} color="gray" />
        <StatCard label="Completadas" value={stats.completedSessions} sub={`${completionRate}% tasa`} icon={CheckCircle} color="green" />
        <StatCard label="Con crisis" value={stats.crisisSessions} icon={ShieldAlert} color={stats.crisisSessions > 0 ? "red" : "gray"} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="En progreso" value={stats.inProgressSessions} icon={PlayCircle} color="blue" />
        <StatCard label="Abandonadas" value={stats.abandonedSessions} icon={AlertTriangle} color="amber" />
        <StatCard label="Duración media" value={avgDurMin ? `${avgDurMin} min` : "—"} icon={Clock} color="purple" />
        <StatCard label="Turnos totales" value={stats.totalTurns.toLocaleString()} icon={MessageSquare} color="gray" />
      </div>

      {stats.avgMoodStart && stats.avgMoodEnd && (
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-6">
          <TrendingUp size={16} className="text-emerald-600 flex-shrink-0" />
          <div className="flex items-center gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Ánimo inicial promedio</p>
              <p className="font-bold text-gray-900">{stats.avgMoodStart.toFixed(1)} / 10</p>
            </div>
            <div className="text-lg">→</div>
            <div>
              <p className="text-xs text-gray-400">Ánimo final promedio</p>
              <p className="font-bold text-gray-900">{stats.avgMoodEnd.toFixed(1)} / 10</p>
            </div>
            {moodDelta && (
              <div className={`ml-2 font-bold text-lg ${parseFloat(moodDelta) > 0 ? "text-green-600" : parseFloat(moodDelta) < 0 ? "text-red-500" : "text-gray-400"}`}>
                {parseFloat(moodDelta) > 0 ? `+${moodDelta}` : moodDelta}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TrafficDay {
  key: string;
  total: number;
  devices: number;
}

function TrafficPanel() {
  const { data, isLoading } = useQuery<{ data: TrafficDay[] }>({
    queryKey: ["therapist", "vercel-traffic"],
    queryFn: () => fetch("/api/vercel-traffic").then(r => r.json()),
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex justify-center">
      <Loader2 size={20} className="animate-spin text-gray-300" />
    </div>
  );

  const days = data?.data ?? [];
  const totalViews = days.reduce((a, d) => a + d.total, 0);
  const totalDevices = days.reduce((a, d) => a + d.devices, 0);
  const maxTotal = Math.max(...days.map(d => d.total), 1);

  // Only show last 14 days to keep chart compact
  const visible = days.slice(-14);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={15} className="text-violet-600" />
        <h2 className="text-sm font-semibold text-gray-800">Tráfico del sitio</h2>
        <span className="ml-auto text-xs text-gray-400">últimos 30 días</span>
      </div>

      <div className="flex gap-6">
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Visitas totales</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalDevices.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Dispositivos únicos</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-20">
        {visible.map((day) => {
          const heightPct = maxTotal > 0 ? (day.total / maxTotal) * 100 : 0;
          const label = new Date(day.key + "T12:00:00Z").toLocaleDateString("es", { day: "numeric", month: "short" });
          return (
            <div key={day.key} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${label}: ${day.total} visitas`}>
              <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                <div
                  className="w-full rounded-t bg-violet-400 group-hover:bg-violet-500 transition-colors"
                  style={{ height: `${Math.max(heightPct, day.total > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-300 truncate w-full text-center hidden sm:block">
                {new Date(day.key + "T12:00:00Z").getDate()}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-300 text-center -mt-1">Fuente: Vercel Analytics</p>
    </div>
  );
}

interface CountryStat {
  countryCode: string;
  count: number;
}

function countryFlag(code: string): string {
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina", US: "Estados Unidos", MX: "México", CO: "Colombia",
  CL: "Chile", PE: "Perú", BR: "Brasil", ES: "España", UY: "Uruguay",
  PY: "Paraguay", BO: "Bolivia", VE: "Venezuela", EC: "Ecuador",
  GT: "Guatemala", HN: "Honduras", SV: "El Salvador", NI: "Nicaragua",
  CR: "Costa Rica", PA: "Panamá", DO: "República Dominicana",
  CU: "Cuba", PR: "Puerto Rico", GB: "Reino Unido", DE: "Alemania",
  FR: "Francia", IT: "Italia", CA: "Canadá", AU: "Australia",
};

function CountriesPanel() {
  const { data: countries, isLoading } = useQuery<CountryStat[]>({
    queryKey: ["therapist", "countries"],
    queryFn: () => therapistApi().get("/therapist/portal/patients/countries").then(r => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex justify-center">
      <Loader2 size={20} className="animate-spin text-gray-300" />
    </div>
  );
  if (!countries?.length) return null;

  const max = countries[0].count;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Globe size={15} className="text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-800">Accesos por país</h2>
        <span className="ml-auto text-xs text-gray-400">{countries.reduce((a, c) => a + c.count, 0)} pacientes</span>
      </div>

      <div className="space-y-2.5">
        {countries.map(({ countryCode, count }) => {
          const pct = Math.round((count / max) * 100);
          const name = COUNTRY_NAMES[countryCode] ?? countryCode;
          return (
            <div key={countryCode} className="flex items-center gap-3">
              <span className="text-xl leading-none w-7 flex-shrink-0">{countryFlag(countryCode)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700 truncate">{name}</span>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Appointment {
  id: string;
  packId: string;
  packName: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  therapistId: string;
  therapistName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes?: string;
  createdAt: string;
}

function AppointmentsPanel() {
  const queryClient = useQueryClient();

  const { data: appointments, isLoading, isError } = useQuery<Appointment[]>({
    queryKey: ["therapist", "appointments"],
    queryFn: () => therapistApi().get("/therapist/portal/appointments").then(r => r.data),
    refetchInterval: 30_000,
    retry: 1,
  });

  const confirmAppt = useMutation({
    mutationFn: (id: string) =>
      therapistApi().patch(`/therapist/portal/appointments/${id}/confirm`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["therapist", "appointments"] }),
  });

  const cancelAppt = useMutation({
    mutationFn: (id: string) =>
      therapistApi().patch(`/appointments/${id}/cancel`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["therapist", "appointments"] }),
  });

  const activeAppts = (appointments ?? []).filter(a => a.status !== "CANCELLED" && a.status !== "COMPLETED");

  const statusStyles: Record<string, string> = {
    PENDING: "text-amber-700 bg-amber-50",
    CONFIRMED: "text-green-700 bg-green-50",
    CANCELLED: "text-gray-500 bg-gray-100",
    COMPLETED: "text-blue-700 bg-blue-50",
  };
  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    CANCELLED: "Cancelado",
    COMPLETED: "Completada",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays size={15} className="text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-800">Turnos agendados</h2>
        <span className="ml-auto text-xs text-gray-400">
          {isLoading ? "…" : `${activeAppts.length} activos`}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-gray-300" />
        </div>
      ) : isError ? (
        <p className="text-xs text-red-400 text-center py-3">Error al cargar turnos. Reiniciá el backend con la migración V11.</p>
      ) : activeAppts.length === 0 ? (
        <div className="text-center py-4">
          <CalendarDays size={24} className="mx-auto text-gray-200 mb-2" />
          <p className="text-xs text-gray-400">No hay turnos pendientes</p>
          <p className="text-[10px] text-gray-300 mt-0.5">Los pacientes pueden agendar desde sus packs Integral o Profesional</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeAppts.map((appt) => (
            <div key={appt.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {appt.patientName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{appt.patientEmail}</p>
                  <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1.5">
                    <CalendarDays size={11} />
                    {format(new Date(appt.scheduledAt), "EEEE d 'de' MMMM · HH:mm'hs'", { locale: es })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <Clock size={11} />
                    {appt.durationMinutes} min · {appt.packName}
                  </p>
                  {appt.notes && (
                    <p className="text-xs text-gray-500 mt-1.5 italic bg-gray-50 rounded-lg px-2 py-1">
                      {appt.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-medium", statusStyles[appt.status])}>
                    {statusLabels[appt.status]}
                  </span>
                  <div className="flex gap-1.5">
                    {appt.status === "PENDING" && (
                      <button
                        onClick={() => confirmAppt.mutate(appt.id)}
                        disabled={confirmAppt.isPending}
                        className="flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <CalendarCheck size={11} /> Confirmar
                      </button>
                    )}
                    {appt.status !== "CANCELLED" && (
                      <button
                        onClick={() => cancelAppt.mutate(appt.id)}
                        disabled={cancelAppt.isPending}
                        className="flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <XIcon size={11} /> Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

interface ClinicalData {
  sessionSummary?: string;
  mainTopics?: string[];
  emotionalState?: string;
  moodEvolution?: string;
  cognitivePatternsObserved?: string;
  therapeuticInterventions?: string;
  patientStrengths?: string;
  areasForWork?: string[];
  progressNotes?: string;
  recommendationsForProfessional?: string;
  riskIndicators?: string;
  followUpSuggestions?: string;
}

function ClinicalReport({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useQuery<ClinicalData>({
    queryKey: ["therapist", "clinical", sessionId],
    queryFn: () => therapistApi().get(`/therapist/portal/sessions/${sessionId}/clinical-report`).then(r => r.data),
    retry: false,
  });

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-300" /></div>;
  if (!data) return <p className="text-xs text-gray-400 py-2 text-center">Sin análisis clínico disponible</p>;

  const sections: { label: string; value: string | undefined }[] = [
    { label: "Resumen de la sesión", value: data.sessionSummary },
    { label: "Estado emocional", value: data.emotionalState },
    { label: "Evolución anímica", value: data.moodEvolution },
    { label: "Patrones cognitivos", value: data.cognitivePatternsObserved },
    { label: "Intervenciones terapéuticas", value: data.therapeuticInterventions },
    { label: "Fortalezas del paciente", value: data.patientStrengths },
    { label: "Notas de progreso", value: data.progressNotes },
    { label: "Recomendaciones para el profesional", value: data.recommendationsForProfessional },
    { label: "Indicadores de riesgo", value: data.riskIndicators },
    { label: "Sugerencias para próximas sesiones", value: data.followUpSuggestions },
  ];

  const isRiskSafe = data.riskIndicators?.toLowerCase().includes("ninguno")
    || data.riskIndicators?.toLowerCase().startsWith("no ");

  return (
    <div className="space-y-3 py-2">
      {/* Topics */}
      {data.mainTopics && data.mainTopics.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Temas principales</p>
          <div className="flex flex-wrap gap-1.5">
            {data.mainTopics.map(t => (
              <span key={t} className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {sections.map(({ label, value }) => {
        if (!value) return null;
        const isRisk = label === "Indicadores de riesgo";
        return (
          <div key={label}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
            <p className={clsx(
              "text-xs leading-relaxed whitespace-pre-wrap",
              isRisk && !isRiskSafe ? "text-red-700 bg-red-50 rounded-lg px-2.5 py-1.5 border border-red-100"
                : isRisk ? "text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 border border-emerald-100"
                : "text-gray-700"
            )}>
              {value}
            </p>
          </div>
        );
      })}

      {/* Areas for work */}
      {data.areasForWork && data.areasForWork.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Áreas a trabajar</p>
          <div className="flex flex-wrap gap-1.5">
            {data.areasForWork.map(a => (
              <span key={a} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{a}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"transcript" | "clinical">("clinical");
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
          {/* Tabs */}
          <div className="flex gap-1 mt-3 mb-3">
            <button
              onClick={() => setTab("clinical")}
              className={clsx(
                "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors",
                tab === "clinical" ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              <ClipboardList size={11} /> Reporte clínico
            </button>
            <button
              onClick={() => setTab("transcript")}
              className={clsx(
                "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors",
                tab === "transcript" ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              <MessageSquare size={11} /> Transcripción
            </button>
          </div>

          {tab === "clinical" ? (
            <ClinicalReport sessionId={session.id} />
          ) : (
            <SessionMessages sessionId={session.id} />
          )}
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
            <StatsPanel />
            <AppointmentsPanel />
            <TrafficPanel />
            <CountriesPanel />

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
