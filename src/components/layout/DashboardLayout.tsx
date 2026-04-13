"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getPatientName } from "@/lib/auth";
import api from "@/lib/api";
import { LayoutDashboard, MessageCircle, Package, FileText, LogOut, Sun, Moon, Loader2, UserCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/lib/i18n";
import clsx from "clsx";

function Initials({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-semibold">{initials}</span>
    </div>
  );
}

const Logo = () => (
  <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  </div>
);

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { t, lang, setLang } = useT();
  const [name, setName] = useState<string>(t.nav.patient);
  const { dark, toggle } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const NAV = [
    { href: "/dashboard",          label: t.nav.home,     icon: LayoutDashboard },
    { href: "/dashboard/sessions", label: t.nav.sessions, icon: MessageCircle },
    { href: "/dashboard/packs",    label: t.nav.plan,     icon: Package },
    { href: "/dashboard/reports",  label: t.nav.reports,  icon: FileText },
  ];

  useEffect(() => {
    const n = getPatientName();
    if (n) setName(n);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await api.post("/auth/logout"); } catch { /* token may be expired, ignore */ } finally {
      clearAuth();
      router.push("/auth/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-subtle">
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-surface border-b border-line safe-top">
      <div className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold text-ink text-sm">TherapyAI</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="p-1.5 rounded-lg text-ink-tertiary hover:bg-surface-muted transition-colors">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(v => !v)} className="p-0.5">
              <Initials name={name} />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-10 w-44 bg-surface border border-line rounded-xl shadow-card z-50 py-1 animate-fade-in">
                <Link href="/dashboard/profile" onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink hover:bg-surface-muted transition-colors">
                  <UserCircle size={15} className="text-ink-tertiary" />
                  {lang === "en" ? "My profile" : "Mi perfil"}
                </Link>
                <div className="border-t border-line my-1" />
                <button onClick={() => { setShowUserMenu(false); setShowLogoutModal(true); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                  <LogOut size={15} />
                  {t.nav.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-56 fixed inset-y-0 flex-col bg-surface border-r border-line z-20">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-line flex-shrink-0">
          <Logo />
          <span className="font-semibold text-ink text-sm">TherapyAI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-100",
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-ink-tertiary hover:bg-surface-muted hover:text-ink-secondary"
                )}
              >
                <Icon size={15} className={active ? "text-brand-600" : "text-ink-disabled"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-line p-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface-subtle mb-0.5">
            <Initials name={name} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink truncate">{name}</p>
              <p className="text-2xs text-ink-disabled">{t.nav.patient}</p>
            </div>
          </div>

          {/* Language selector */}
          <div className="flex gap-1 px-2.5 py-1.5 mb-0.5">
            <button
              onClick={() => setLang("es")}
              className={clsx(
                "flex-1 text-xs py-1 rounded-md font-medium transition-colors",
                lang === "es"
                  ? "bg-brand-600 text-white"
                  : "text-ink-tertiary hover:bg-surface-muted"
              )}
            >
              ES
            </button>
            <button
              onClick={() => setLang("en")}
              className={clsx(
                "flex-1 text-xs py-1 rounded-md font-medium transition-colors",
                lang === "en"
                  ? "bg-brand-600 text-white"
                  : "text-ink-tertiary hover:bg-surface-muted"
              )}
            >
              EN
            </button>
          </div>

          <Link href="/dashboard/profile"
            className="flex items-center gap-2.5 px-2.5 py-1.5 w-full rounded-lg text-xs text-ink-tertiary hover:bg-surface-muted hover:text-ink-secondary transition-colors">
            <UserCircle size={13} />
            {lang === "en" ? "My profile" : "Mi perfil"}
          </Link>
          <button
            onClick={toggle}
            className="flex items-center gap-2.5 px-2.5 py-1.5 w-full rounded-lg text-xs text-ink-tertiary hover:bg-surface-muted hover:text-ink-secondary transition-colors"
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
            {dark ? t.nav.lightMode : t.nav.darkMode}
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 w-full rounded-lg text-xs text-ink-tertiary hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={13} />
            {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 lg:ml-56 min-h-screen flex flex-col">
        <div className="flex-1 px-4 pt-main-mobile pb-main-mobile lg:px-8 lg:py-8 lg:pt-8 lg:pb-8 animate-fade-in max-w-4xl w-full">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line flex safe-bottom">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                active ? "text-brand-600" : "text-ink-disabled"
              )}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 1.75} />
              <span className={clsx("text-[9px] font-medium", active ? "text-brand-600" : "text-ink-disabled")}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Logout confirmation modal ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-line p-6 max-w-xs w-full shadow-card animate-slide-up">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <LogOut size={18} className="text-red-500" />
            </div>
            <h2 className="text-sm font-semibold text-ink text-center mb-1">
              {lang === "en" ? "Log out?" : "¿Cerrar sesión?"}
            </h2>
            <p className="text-xs text-ink-tertiary text-center mb-5">
              {lang === "en"
                ? "You'll need to sign in again to access your account."
                : "Vas a necesitar volver a iniciar sesión para acceder."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="btn btn-secondary flex-1 text-sm"
              >
                {lang === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="btn btn-primary flex-1 text-sm bg-red-600 hover:bg-red-700 border-red-600"
              >
                {loggingOut
                  ? <Loader2 size={14} className="animate-spin mx-auto" />
                  : (lang === "en" ? "Log out" : "Salir")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
