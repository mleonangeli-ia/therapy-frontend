"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle, Sun, Moon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/hooks/useTheme";
import clsx from "clsx";

export default function LandingPage() {
  const { t, lang, setLang } = useT();
  const { dark, toggle } = useTheme();

  const features = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      title: t.landing.featureSessionsTitle,
      desc:  t.landing.featureSessionsDesc,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      title: t.landing.featureProgressTitle,
      desc:  t.landing.featureProgressDesc,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      ),
      title: t.landing.featureReportsTitle,
      desc:  t.landing.featureReportsDesc,
    },
  ];

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">

      {/* ── Navbar ── */}
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span className="font-semibold text-ink text-sm">TherapyAI</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            {/* Language selector */}
            {(["es", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={clsx("text-xs px-2.5 py-1 rounded-md font-medium transition-colors",
                  lang === l ? "bg-brand-600 text-white" : "text-ink-tertiary hover:bg-surface-muted"
                )}>
                {l.toUpperCase()}
              </button>
            ))}

            {/* Dark mode toggle */}
            <button onClick={toggle}
              className="p-1.5 rounded-md text-ink-tertiary hover:bg-surface-muted hover:text-ink-secondary transition-colors ml-1">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div className="w-px h-4 bg-line mx-1" />

            <Link href="/auth/login" className="btn btn-ghost text-sm px-3 py-1.5">
              {t.auth.login}
            </Link>
            <Link href="/auth/register" className="btn btn-primary">
              {t.landing.getStarted} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 animate-slide-up">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          {t.landing.badge}
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight leading-[1.15] mb-5 max-w-2xl">
          {t.landing.heroTitle}{" "}
          <span className="text-brand-600">{t.landing.heroHighlight}</span>
        </h1>

        <p className="text-base text-ink-tertiary max-w-lg leading-relaxed mb-8">
          {t.landing.heroSubtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/auth/register" className="btn btn-primary btn-lg shadow-xs">
            {t.landing.startFree} <ArrowRight size={15} />
          </Link>
          <Link href="/auth/login" className="btn btn-secondary btn-lg">
            {t.auth.login}
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
          {[t.landing.trust1, t.landing.trust2, t.landing.trust3].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-xs text-ink-tertiary">
              <CheckCircle size={12} className="text-brand-500" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Feature grid ── */}
      <div className="border-t border-line bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-ink text-sm mb-1">{f.title}</p>
                <p className="text-xs text-ink-tertiary leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-line bg-surface">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <p className="text-xs text-ink-disabled">
            © {new Date().getFullYear()} TherapyAI
          </p>
          <p className="text-xs text-ink-disabled">
            {t.landing.crisisLine}
          </p>
        </div>
      </footer>
    </div>
  );
}
