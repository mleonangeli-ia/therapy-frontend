"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isLoginPage = pathname === "/therapist/login";
    const hasToken = !!localStorage.getItem("therapist_token");
    if (!isLoginPage && !hasToken) {
      router.replace("/therapist/login");
    }
  }, [router, pathname]);

  return <>{children}</>;
}
