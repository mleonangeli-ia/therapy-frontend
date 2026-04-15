"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, MessageCircle, TrendingUp, FileText, Shield, Clock, Brain } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function LandingPage() {
  const { t, lang, setLang } = useT();

  return (
    <div className="min-h-screen bg-[#080c18] text-white flex flex-col overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#080c18]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4a9fd8] to-[#0acad0] flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">TherapyAI</span>
          </div>

          <div className="flex items-center gap-2">
            {(["es", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  lang === l
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}>
                {l.toUpperCase()}
              </button>
            ))}
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Link href="/auth/login"
              className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
              {t.auth.login}
            </Link>
            <Link href="/auth/register"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-[#4a9fd8] to-[#0acad0] text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:opacity-90 transition-all flex items-center gap-1.5">
              {t.landing.getStarted} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-6 pt-32 pb-20">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="flex flex-col items-start text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-4 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {t.landing.badge}
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
              <span className="text-white">{t.landing.heroTitle} </span>
              <span className="bg-gradient-to-r from-[#4a9fd8] to-[#0acad0] bg-clip-text text-transparent">
                {t.landing.heroHighlight}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-white/50 max-w-lg leading-relaxed mb-10">
              {t.landing.heroSubtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <Link href="/auth/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base bg-gradient-to-r from-[#4a9fd8] to-[#0acad0] text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:opacity-90 transition-all">
                {t.landing.startFree} <ArrowRight size={16} />
              </Link>
              <Link href="/auth/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all">
                {t.auth.login}
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {[t.landing.trust1, t.landing.trust2, t.landing.trust3].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-white/40">
                  <CheckCircle size={13} className="text-cyan-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right: image */}
          <div className="relative hidden lg:block">
            {/* Outer glow ring */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#4a9fd8]/20 to-[#0acad0]/10 blur-2xl" />
            {/* Card */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10">
              <Image
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&auto=format&fit=crop&q=80"
                alt="Bienestar emocional"
                width={900}
                height={650}
                className="w-full object-cover"
                priority
              />
              {/* Bottom fade to dark */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#080c18]/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
              {lang === "es" ? "Cómo funciona" : "How it works"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {lang === "es" ? "Comenzá en 3 pasos" : "Get started in 3 steps"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: lang === "es" ? "Creá tu cuenta" : "Create your account",
                desc: lang === "es" ? "Registrate gratis en segundos, sin tarjeta de crédito." : "Sign up for free in seconds, no credit card needed.",
              },
              {
                step: "02",
                title: lang === "es" ? "Contá cómo te sentís" : "Share how you feel",
                desc: lang === "es" ? "Empezá una sesión por texto o voz cuando lo necesités, de día o de noche." : "Start a session by text or voice whenever you need, day or night.",
              },
              {
                step: "03",
                title: lang === "es" ? "Seguí tu progreso" : "Track your progress",
                desc: lang === "es" ? "La IA recuerda tu historia y genera reportes para compartir con tu terapeuta." : "The AI remembers your history and generates reports to share with your therapist.",
              },
            ].map((item) => (
              <div key={item.step}
                className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.05] transition-colors group">
                <div className="text-5xl font-black text-white/[0.06] mb-4 group-hover:text-white/[0.09] transition-colors">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
              {lang === "es" ? "Todo lo que necesitás" : "Everything you need"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {lang === "es" ? "Diseñado para tu bienestar" : "Designed for your wellbeing"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: MessageCircle,
                title: t.landing.featureSessionsTitle,
                desc: t.landing.featureSessionsDesc,
                accent: "from-blue-500/20 to-blue-500/5",
                iconColor: "text-blue-400",
                iconBg: "bg-blue-500/10",
              },
              {
                icon: TrendingUp,
                title: t.landing.featureProgressTitle,
                desc: t.landing.featureProgressDesc,
                accent: "from-cyan-500/20 to-cyan-500/5",
                iconColor: "text-cyan-400",
                iconBg: "bg-cyan-500/10",
              },
              {
                icon: FileText,
                title: t.landing.featureReportsTitle,
                desc: t.landing.featureReportsDesc,
                accent: "from-violet-500/20 to-violet-500/5",
                iconColor: "text-violet-400",
                iconBg: "bg-violet-500/10",
              },
              {
                icon: Shield,
                title: lang === "es" ? "Privacidad total" : "Full privacy",
                desc: lang === "es" ? "Tus conversaciones están encriptadas y solo son accesibles por vos." : "Your conversations are encrypted and only accessible by you.",
                accent: "from-emerald-500/20 to-emerald-500/5",
                iconColor: "text-emerald-400",
                iconBg: "bg-emerald-500/10",
              },
              {
                icon: Clock,
                title: lang === "es" ? "Disponible 24/7" : "Available 24/7",
                desc: lang === "es" ? "Sin turnos ni listas de espera. Estamos cuando más lo necesitás." : "No appointments or waiting lists. We're there when you need us most.",
                accent: "from-amber-500/20 to-amber-500/5",
                iconColor: "text-amber-400",
                iconBg: "bg-amber-500/10",
              },
              {
                icon: Brain,
                title: lang === "es" ? "IA especializada" : "Specialized AI",
                desc: lang === "es" ? "Entrenada en técnicas de terapia cognitivo-conductual y mindfulness." : "Trained in cognitive-behavioral therapy and mindfulness techniques.",
                accent: "from-pink-500/20 to-pink-500/5",
                iconColor: "text-pink-400",
                iconBg: "bg-pink-500/10",
              },
            ].map((f) => (
              <div key={f.title}
                className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 overflow-hidden hover:border-white/[0.12] transition-all group">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                    <f.icon size={18} className={f.iconColor} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0e2a4a] to-[#0a1f35] border border-white/[0.08] p-10 text-center">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-cyan-500/10 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {lang === "es" ? "Tu bienestar no puede esperar" : "Your wellbeing can't wait"}
              </h2>
              <p className="text-white/50 mb-8 max-w-lg mx-auto">
                {lang === "es"
                  ? "Unite a miles de personas que ya cuidan su salud mental con TherapyAI."
                  : "Join thousands of people already caring for their mental health with TherapyAI."}
              </p>
              <Link href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-[#4a9fd8] to-[#0acad0] text-white shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:opacity-90 transition-all">
                {t.landing.startFree} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#4a9fd8] to-[#0acad0] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span className="text-xs text-white/30">© {new Date().getFullYear()} TherapyAI</span>
          </div>
          <p className="text-xs text-white/25">{t.landing.crisisLine}</p>
        </div>
      </footer>
    </div>
  );
}
