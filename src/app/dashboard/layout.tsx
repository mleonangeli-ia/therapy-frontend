"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isConsentRequired, clearAuth, isTokenExpired } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    } else if (isConsentRequired()) {
      router.replace("/auth/consent");
      return;
    }

    const logout = () => {
      clearAuth();
      window.location.replace("/auth/login");
    };

    // Redirect immediately if token already expired
    if (isTokenExpired()) { logout(); return; }

    // Redirect when user comes back to the tab and token is expired
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && isTokenExpired()) logout();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return <DashboardLayout>{children}</DashboardLayout>;
}
