"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { SessionReport } from "@/types";
import { format } from "date-fns";
import { es, enUS, type Locale } from "date-fns/locale";
import { FileText, Download, Loader2, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { Suspense } from "react";
import { useT } from "@/lib/i18n";

function ReportsContent() {
  const searchParams = useSearchParams();
  const highlightSession = searchParams.get("session");
  const { t, lang } = useT();
  const dateLocale = lang === "en" ? enUS : es;

  const { data: reports, isLoading, isError, refetch } = useQuery<SessionReport[]>({
    queryKey: ["reports"],
    queryFn: () => api.get("/reports").then((r) => r.data),
    retry: 2,
  });

  const generateReport = useMutation({
    mutationFn: (sessionId: string) =>
      api.post(`/reports/generate/${sessionId}`).then((r) => r.data),
    onSuccess: () => refetch(),
  });

  const downloadReport = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await api.get(`/reports/${reportId}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "reporte-sesion.pdf";
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t.reports.title}</h1>
          <p className="text-ink-tertiary mt-1">{t.reports.subtitle}</p>
        </div>
        <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} />
          {t.reports.refresh}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-800">{t.reports.disclaimer}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-ink-disabled" />
        </div>
      ) : isError ? (
        <div className="card text-center py-16">
          <p className="text-red-500 text-sm mb-3">
            {lang === "en" ? "Could not load reports." : "No se pudieron cargar los reportes."}
          </p>
          <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} /> {t.reports.refresh}
          </button>
        </div>
      ) : reports?.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={48} className="mx-auto text-ink-disabled mb-4" />
          <p className="text-ink-tertiary">{t.reports.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports?.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              highlighted={highlightSession !== null}
              onGenerate={() => generateReport.mutate(report.id)}
              onDownload={() => downloadReport.mutate(report.id)}
              isDownloading={downloadReport.isPending}
              dateLocale={dateLocale}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
  highlighted,
  onGenerate,
  onDownload,
  isDownloading,
  dateLocale,
  t,
}: {
  report: SessionReport;
  highlighted: boolean;
  onGenerate: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  dateLocale: Locale;
  t: ReturnType<typeof useT>["t"];
}) {
  const statusConfig = {
    COMPLETED: { label: t.reports.statusAvailable, color: "badge-green" },
    PENDING:   { label: t.reports.pending,          color: "badge-yellow" },
    GENERATING:{ label: t.reports.statusGenerating, color: "badge-blue" },
    FAILED:    { label: t.reports.statusFailed,     color: "badge-red" },
  }[report.status];

  return (
    <div className={clsx("card flex items-center justify-between", highlighted && "border-brand-200 bg-brand-50/30")}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-line flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-ink-disabled" />
        </div>
        <div>
          <p className="font-medium text-ink text-sm">
            {t.reports.session} {report.sessionNumber}
          </p>
          {report.generatedAt && (
            <p className="text-xs text-ink-tertiary mt-0.5">
              {format(new Date(report.generatedAt), "d MMM yyyy · HH:mm", { locale: dateLocale })}
            </p>
          )}
          {report.downloadCount > 0 && (
            <p className="text-xs text-ink-disabled mt-0.5">
              {t.reports.downloaded} {report.downloadCount}{" "}
              {report.downloadCount === 1 ? t.reports.downloadedOnce : t.reports.downloadedMany}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={clsx("badge", statusConfig?.color)}>
          {statusConfig?.label}
        </span>

        {report.status === "COMPLETED" ? (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="btn btn-primary btn-sm"
          >
            {isDownloading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            {isDownloading ? t.reports.downloading : t.reports.download}
          </button>
        ) : report.status === "FAILED" ? (
          <button onClick={onGenerate} className="btn btn-secondary btn-sm">
            {t.reports.retry}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-disabled" size={32} /></div>}>
      <ReportsContent />
    </Suspense>
  );
}
