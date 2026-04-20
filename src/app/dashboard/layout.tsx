"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, isConsentRequired, clearAuth, isTokenExpired } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import api from "@/lib/api";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [packChecked, setPackChecked] = useState(false);

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

    if (isTokenExpired()) { logout(); return; }

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

    // Check if user has an active pack
    api.get("/packs")
      .then(({ data }) => {
        const hasActive = data.some((p: { status: string }) => p.status === "ACTIVE");
        if (!hasActive && !pathname.startsWith("/dashboard/packs")) {
          router.replace("/dashboard/packs");
        }
        setPackChecked(true);
      })
      .catch(() => setPackChecked(true)); // let through on error so we don't block forever

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router, pathname]);

  if (!packChecked) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
