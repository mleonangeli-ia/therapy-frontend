"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function ConsentPage() {
  const router = useRouter();
  const { t } = useT();
  const [accepted, setAccepted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/auth/consent", { consentVersion: "1.0", accepted: true }),
    onSuccess: () => {
      localStorage.setItem("consent_required", "false");
      router.push("/dashboard");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-subtle">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-ink">{t.consent.title}</h1>
          <p className="text-ink-tertiary mt-1">{t.consent.subtitle}</p>
        </div>

        <div className="card space-y-6">
          <div className="bg-surface-subtle rounded-xl p-5 max-h-80 overflow-y-auto text-sm text-ink-secondary leading-relaxed space-y-3">
            <h2 className="font-semibold text-ink">{t.consent.heading}</h2>
            {t.consent.body.map((para, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: para }} />
            ))}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-ink-secondary">{t.consent.checkLabel}</span>
          </label>

          <button
            onClick={() => mutation.mutate()}
            disabled={!accepted || mutation.isPending}
            className="btn-primary btn-lg w-full"
          >
            {mutation.isPending ? t.consent.accepting : t.consent.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
